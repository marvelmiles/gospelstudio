import { spawn } from "node:child_process";

const SYSTEM_FFMPEG = "ffmpeg";

const bundledFfmpegPath = async (): Promise<string | null> => {
  try {
    const module = (await import("ffmpeg-static")) as { default: unknown };
    return typeof module.default === "string" ? module.default : null;
  } catch {
    return null;
  }
};

export const resolveFfmpegPath = async (
  configuredPath: string | undefined,
): Promise<string> =>
  configuredPath ?? (await bundledFfmpegPath()) ?? SYSTEM_FFMPEG;

export const ffmpegRuns = (ffmpegPath: string): Promise<boolean> =>
  new Promise((resolve) => {
    const child = spawn(ffmpegPath, ["-hide_banner", "-version"], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.once("error", () => resolve(false));
    child.once("exit", (code) => resolve(code === 0));
  });
