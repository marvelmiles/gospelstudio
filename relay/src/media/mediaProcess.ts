import { spawn } from "node:child_process";
import type { Readable, Writable } from "node:stream";

export interface MediaProcess {
  readonly stdin: Writable;
  readonly stdout: Readable;
  readonly stderr: Readable;
  stop(): void;
  onExit(
    listener: (code: number | null, launchError: Error | null) => void,
  ): void;
}

export type StartMediaProcess = (args: readonly string[]) => MediaProcess;

const FORCE_STOP_AFTER_MS = 5000;

export const createFfmpegLauncher =
  (ffmpegPath: string): StartMediaProcess =>
  (args) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdin.on("error", () => {});
    child.on("error", () => {});

    return {
      stdin: child.stdin,
      stdout: child.stdout,
      stderr: child.stderr,
      stop: () => {
        child.stdin.end();
        const timer = setTimeout(
          () => child.kill("SIGKILL"),
          FORCE_STOP_AFTER_MS,
        );
        timer.unref();
        child.once("close", () => clearTimeout(timer));
      },
      onExit: (listener) => {
        let isDone = false;
        const finish = (code: number | null, launchError: Error | null) => {
          if (isDone) return;
          isDone = true;
          listener(code, launchError);
        };
        child.once("error", (error) => finish(null, error));
        child.once("close", (code) => finish(code, null));
      },
    };
  };
