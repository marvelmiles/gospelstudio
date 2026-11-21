import { createServer, type Server } from "node:http";
import type { RelayEnv } from "./config/relayEnv";
import { createRelayApp } from "./http/relayApp";
import type { Logger } from "./logger";
import {
  createDestinationGuard,
  resolveWithDns,
  type ResolveHost,
} from "./media/destinationGuard";
import type { StartMediaProcess } from "./media/mediaProcess";
import { LiveSession } from "./sessions/liveSession";
import { SessionRegistry } from "./sessions/sessionRegistry";
import { attachIngestServer } from "./ws/ingestServer";

const SESSION_START_TIMEOUT_MS = 5 * 60 * 1000;
const RECONNECT_GRACE_MS = 90 * 1000;

export interface RelayServerDependencies {
  env: RelayEnv;
  startProcess: StartMediaProcess;
  logger: Logger;
  resolveHost?: ResolveHost;
  sessionStartTimeoutMs?: number;
  reconnectGraceMs?: number;
}

export interface RelayServer {
  server: Server;
  registry: SessionRegistry;
  close(): Promise<void>;
}

export const createRelayServer = ({
  env,
  startProcess,
  logger,
  resolveHost = resolveWithDns,
  sessionStartTimeoutMs = SESSION_START_TIMEOUT_MS,
  reconnectGraceMs = RECONNECT_GRACE_MS,
}: RelayServerDependencies): RelayServer => {
  const registry = new SessionRegistry({
    maxSessions: env.MAX_SESSIONS,
    createSession: ({ sessionId, tokenDigest }, onEnded) =>
      new LiveSession({
        sessionId,
        tokenDigest,
        startProcess,
        startTimeoutMs: sessionStartTimeoutMs,
        reconnectGraceMs,
        onEnded: (session) => {
          logger.info("Session closed", { sessionId: session.id });
          onEnded(session);
        },
      }),
  });

  const app = createRelayApp({
    registry,
    allowedOrigins: env.ALLOWED_ORIGINS,
    guardDestination: createDestinationGuard({
      allowPrivate: env.ALLOW_PRIVATE_DESTINATIONS,
      resolve: resolveHost,
    }),
    trustProxyHops: env.TRUST_PROXY_HOPS,
    logger,
  });

  const server = createServer(app);
  const ingest = attachIngestServer({
    server,
    registry,
    allowedOrigins: env.ALLOWED_ORIGINS,
    maxIngestKbps: env.MAX_INGEST_KBPS,
    logger,
  });

  return {
    server,
    registry,
    close: () =>
      new Promise((resolve) => {
        ingest.close();
        registry.endAll();
        server.close(() => resolve());
        server.closeAllConnections();
      }),
  };
};
