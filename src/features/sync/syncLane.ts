import { withWebLockIfFree } from "../../lib/webLocks";
import { isSessionEnded } from "../account/session/sessionManager";
import { retryDelayAfter } from "./syncDecisions";

type LaneState = "idle" | "busy" | "error" | "off";

export interface SyncLane {
  readonly state: LaneState;
  readonly error: unknown;
  start(): void;
  stop(): void;
  schedule(delayMs: number): void;
  run(): Promise<void>;
  abort(): void;
}

interface SyncLaneOptions {
  lockName: string;
  work: (signal: AbortSignal) => Promise<void>;
  nextRunDelayMs: () => Promise<number | null>;
  onStateChange: () => void;
}

/* One sync lane: a single task that runs at most once at a time across tabs, reruns when asked while busy, backs off after failures, wakes for the next set-aside item that is due, and can be cancelled at any point. */
export const createSyncLane = ({
  lockName,
  work,
  nextRunDelayMs,
  onStateChange,
}: SyncLaneOptions): SyncLane => {
  let started = false;
  let state: LaneState = "idle";
  let lastError: unknown = null;
  let timer: number | undefined;
  let dueAtMs: number | null = null;
  let running: Promise<void> | null = null;
  let rerunDelayMs: number | null = null;
  let controller: AbortController | null = null;
  let failures = 0;

  const setState = (next: LaneState, error: unknown = null): void => {
    state = next;
    lastError = error;
    onStateChange();
  };

  const clearTimer = (): void => {
    window.clearTimeout(timer);
    timer = undefined;
    dueAtMs = null;
  };

  const schedule = (delayMs: number): void => {
    if (!started) return;
    if (running) {
      rerunDelayMs =
        rerunDelayMs === null ? delayMs : Math.min(rerunDelayMs, delayMs);
      return;
    }
    const dueAt = Date.now() + delayMs;
    if (dueAtMs !== null && dueAtMs <= dueAt) return;
    clearTimer();
    dueAtMs = dueAt;
    timer = window.setTimeout(() => {
      dueAtMs = null;
      void run();
    }, delayMs);
  };

  const cycle = async (): Promise<void> => {
    const cycleController = new AbortController();
    controller = cycleController;
    setState("busy");
    try {
      await withWebLockIfFree(lockName, () => work(cycleController.signal));
      if (!started) return;
      failures = 0;
      setState("idle");
      const delayMs = await nextRunDelayMs();
      if (started && delayMs !== null) schedule(delayMs);
    } catch (error) {
      if (!started) return;
      if (cycleController.signal.aborted) {
        setState("idle");
        return;
      }
      if (isSessionEnded(error)) {
        setState("off");
        return;
      }
      failures += 1;
      setState("error", error);
      schedule(retryDelayAfter(failures));
    } finally {
      if (controller === cycleController) controller = null;
    }
  };

  const run = (): Promise<void> => {
    if (!started) return Promise.resolve();
    clearTimer();
    if (running) {
      rerunDelayMs = 0;
      return running;
    }
    running = cycle().finally(() => {
      running = null;
      const delayMs = rerunDelayMs;
      rerunDelayMs = null;
      if (delayMs !== null) schedule(delayMs);
    });
    return running;
  };

  return {
    get state() {
      return state;
    },
    get error() {
      return lastError;
    },
    start: () => {
      if (started) return;
      started = true;
      failures = 0;
      setState("idle");
    },
    stop: () => {
      if (!started) return;
      started = false;
      rerunDelayMs = null;
      clearTimer();
      controller?.abort();
      controller = null;
      setState("off");
    },
    schedule,
    run,
    abort: () => {
      controller?.abort();
      controller = null;
    },
  };
};
