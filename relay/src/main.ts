import { parseRelayEnv } from "./config/relayEnv";
import { consoleLogger } from "./logger";
import { ffmpegRuns, resolveFfmpegPath } from "./media/ffmpegPath";
import { createFfmpegLauncher } from "./media/mediaProcess";
import { createRelayServer } from "./relayServer";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const main = async (): Promise<void> => {
  const config = parseRelayEnv(process.env);
  if (!config.ok) {
    consoleLogger.error("The relay is not configured", {
      invalidVariables: config.invalidVariables.join(", "),
    });
    process.exit(1);
  }
  const { env } = config;

  const ffmpegPath = await resolveFfmpegPath(env.FFMPEG_PATH);
  if (!(await ffmpegRuns(ffmpegPath))) {
    consoleLogger.error("FFmpeg was not found. Install it or set FFMPEG_PATH.");
    process.exit(1);
  }

  const relay = createRelayServer({
    env,
    startProcess: createFfmpegLauncher(ffmpegPath),
    logger: consoleLogger,
  });

  relay.server.listen(env.PORT, env.HOST, () => {
    consoleLogger.info("Live relay listening", {
      port: env.PORT,
      maxSessions: env.MAX_SESSIONS,
    });
  });

  const shutdown = (signal: string) => {
    consoleLogger.info("Shutting down", { signal });
    setTimeout(() => process.exit(0), SHUTDOWN_TIMEOUT_MS).unref();
    void relay.close().then(() => process.exit(0));
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
};

void main();
