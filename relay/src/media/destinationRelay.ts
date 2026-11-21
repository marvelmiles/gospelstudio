import type {
  DestinationSnapshot,
  DestinationState,
} from "../../../src/features/liveStream/lib/liveRelayContract";
import { redactStreamUrlsInText } from "../../../src/features/liveStream/lib/streamUrl";
import { relayToPlatformArgs } from "./ffmpegArgs";
import type { FlvSink } from "./flvFanOut";
import type { MediaProcess, StartMediaProcess } from "./mediaProcess";

const RETRY_DELAYS_MS = [2000, 4000, 8000, 15_000, 30_000];
const FAILURES_BEFORE_GIVING_UP = 6;
const STABLE_AFTER_MS = 20_000;
const STDERR_TAIL_LENGTH = 4000;
const MAX_ERROR_LENGTH = 240;
const PROGRESS_PATTERN = /out_time_us=(\d+)/g;

const KNOWN_FAILURES: { pattern: RegExp; message: string }[] = [
  {
    pattern: /Input\/output error|Connection reset|Broken pipe|end of file/i,
    message:
      "The platform closed the connection. Check that the stream key is current and the platform is ready to receive a stream.",
  },
  {
    pattern: /Connection refused|timed out|Network is unreachable/i,
    message: "The platform's streaming server could not be reached.",
  },
  {
    pattern: /Failed to resolve|Name or service not known|getaddrinfo/i,
    message:
      "The streaming server address could not be found. Check the server URL.",
  },
  {
    pattern: /401|403|Unauthorized|Forbidden|rejected/i,
    message: "The platform refused the stream key.",
  },
];

export interface DestinationRelayOptions {
  id: string;
  url: string;
  startProcess: StartMediaProcess;
  attachSink: (id: string, sink: FlvSink) => void;
  detachSink: (id: string) => void;
  onChange: () => void;
  now?: () => number;
}

const lastLine = (text: string): string =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1) ?? "";

export const describeFailure = (
  stderr: string,
  exitCode: number | null,
): string => {
  const known = KNOWN_FAILURES.find(({ pattern }) => pattern.test(stderr));
  if (known) return known.message;
  const detail = redactStreamUrlsInText(lastLine(stderr));
  if (!detail)
    return `The relay to this platform stopped (code ${exitCode ?? "unknown"}).`;
  return detail.length > MAX_ERROR_LENGTH
    ? `${detail.slice(0, MAX_ERROR_LENGTH - 3)}...`
    : detail;
};

export class DestinationRelay {
  readonly id: string;
  readonly url: string;
  private readonly options: DestinationRelayOptions;
  private readonly now: () => number;
  private state: DestinationState = "waiting";
  private error: string | null = null;
  private retries = 0;
  private failures = 0;
  private process: MediaProcess | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private liveSince: number | null = null;
  private isStopped = false;
  private stderrTail = "";

  constructor(options: DestinationRelayOptions) {
    this.options = options;
    this.id = options.id;
    this.url = options.url;
    this.now = options.now ?? Date.now;
  }

  get currentState(): DestinationState {
    return this.state;
  }

  start(): void {
    if (this.isStopped) return;
    this.clearRetry();
    this.retireProcess();
    this.launch(this.state === "retrying" ? "retrying" : "connecting");
  }

  retryNow(): void {
    if (this.isStopped) return;
    this.failures = 0;
    this.error = null;
    this.start();
  }

  stop(): void {
    this.isStopped = true;
    this.clearRetry();
    this.retireProcess();
  }

  snapshot(): DestinationSnapshot {
    return {
      id: this.id,
      state: this.state,
      error: this.error,
      retries: this.retries,
    };
  }

  private launch(state: DestinationState): void {
    this.stderrTail = "";
    this.liveSince = null;
    const process = this.options.startProcess(relayToPlatformArgs(this.url));
    this.process = process;
    process.stdout.setEncoding("utf8");
    process.stdout.on("data", (text: string) =>
      this.readProgress(process, text),
    );
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (text: string) => {
      this.stderrTail = (this.stderrTail + text).slice(-STDERR_TAIL_LENGTH);
    });
    process.onExit((code, launchError) =>
      this.handleExit(process, code, launchError),
    );
    this.options.attachSink(this.id, {
      write: (bytes) => {
        if (process.stdin.writable) process.stdin.write(bytes);
      },
      get backlogBytes() {
        return process.stdin.writableLength;
      },
    });
    this.setState(state);
  }

  private readProgress(process: MediaProcess, text: string): void {
    if (process !== this.process) return;
    const isWriting = [...text.matchAll(PROGRESS_PATTERN)].some(
      (match) => Number(match[1]) > 0,
    );
    if (!isWriting) return;
    if (this.liveSince === null) this.liveSince = this.now();
    else if (this.now() - this.liveSince >= STABLE_AFTER_MS) this.failures = 0;
    if (this.state !== "live") {
      this.error = null;
      this.setState("live");
    }
  }

  private handleExit(
    process: MediaProcess,
    code: number | null,
    launchError: Error | null,
  ): void {
    if (process !== this.process) return;
    this.options.detachSink(this.id);
    this.process = null;
    if (this.isStopped) return;

    const wasStable =
      this.liveSince !== null && this.now() - this.liveSince >= STABLE_AFTER_MS;
    this.failures = wasStable ? 1 : this.failures + 1;
    this.retries += 1;
    this.error = launchError
      ? "The relay server could not start FFmpeg."
      : describeFailure(this.stderrTail, code);

    if (this.failures >= FAILURES_BEFORE_GIVING_UP) {
      this.setState("failed");
      return;
    }
    const delay =
      RETRY_DELAYS_MS[Math.min(this.failures - 1, RETRY_DELAYS_MS.length - 1)];
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.launch("retrying");
    }, delay);
    this.setState("retrying");
  }

  private retireProcess(): void {
    const process = this.process;
    if (!process) return;
    this.process = null;
    this.options.detachSink(this.id);
    process.stop();
  }

  private clearRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private setState(state: DestinationState): void {
    this.state = state;
    this.options.onChange();
  }
}
