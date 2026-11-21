import { PassThrough } from "node:stream";
import type { MediaProcess, StartMediaProcess } from "../media/mediaProcess";

export class FakeMediaProcess implements MediaProcess {
  readonly stdin = new PassThrough();
  readonly stdout = new PassThrough();
  readonly stderr = new PassThrough();
  readonly args: readonly string[];
  readonly received: Buffer[] = [];
  isStopped = false;
  private readonly exitListeners: ((
    code: number | null,
    error: Error | null,
  ) => void)[] = [];

  constructor(args: readonly string[]) {
    this.args = args;
    this.stdin.on("data", (chunk: Buffer) => this.received.push(chunk));
  }

  stop(): void {
    this.isStopped = true;
    this.exit(0);
  }

  onExit(listener: (code: number | null, error: Error | null) => void): void {
    this.exitListeners.push(listener);
  }

  reportProgress(outTimeMicroseconds: number): void {
    this.stdout.write(
      `out_time_us=${outTimeMicroseconds}\nprogress=continue\n`,
    );
  }

  fail(stderr: string, code = 1): void {
    this.stderr.write(stderr);
    setImmediate(() => this.exit(code));
  }

  exit(code: number | null): void {
    for (const listener of this.exitListeners.splice(0)) listener(code, null);
  }
}

export const fakeLauncher = () => {
  const started: FakeMediaProcess[] = [];
  const startProcess: StartMediaProcess = (args) => {
    const process = new FakeMediaProcess(args);
    started.push(process);
    return process;
  };
  return { started, startProcess };
};
