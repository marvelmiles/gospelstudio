import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { FlvFormatError } from "../../../src/features/liveStream/lib/flv";
import {
  INGEST_CLOSE_CODES,
  INGEST_PATH_PATTERN,
  ingestAuthMessageSchema,
  type RelayMessage,
  type SessionSnapshot,
} from "../../../src/features/liveStream/lib/liveRelayContract";
import { isOriginAllowed } from "../config/relayEnv";
import type { Logger } from "../logger";
import type { IngestHandle, LiveSession } from "../sessions/liveSession";
import type { SessionRegistry } from "../sessions/sessionRegistry";

const MAX_MESSAGE_BYTES = 4 * 1024 * 1024;
const AUTH_TIMEOUT_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 15_000;
const STATUS_THROTTLE_MS = 300;
const BITRATE_GRACE_MS = 10_000;

interface IngestServerOptions {
  server: Server;
  registry: SessionRegistry;
  allowedOrigins: readonly string[];
  maxIngestKbps: number;
  logger: Logger;
}

const rejectUpgrade = (
  socket: Duplex,
  status: number,
  reason: string,
): void => {
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
};

const toBytes = (data: RawData): Uint8Array => {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data));
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
};

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const throttle = (
  send: (snapshot: SessionSnapshot) => void,
): ((snapshot: SessionSnapshot) => void) & { cancel: () => void } => {
  let latest: SessionSnapshot | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    if (latest) send(latest);
    latest = null;
  };
  const throttled = (snapshot: SessionSnapshot) => {
    latest = snapshot;
    timer ??= setTimeout(flush, STATUS_THROTTLE_MS);
  };
  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return throttled;
};

const serveIngest = (
  socket: WebSocket,
  session: LiveSession,
  maxIngestKbps: number,
  logger: Logger,
): void => {
  let ingest: IngestHandle | null = null;
  let unsubscribe: () => void = () => {};
  const openedAt = Date.now();
  const send = (message: RelayMessage) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
  };
  const sendStatus = throttle((snapshot) => {
    send({ type: "status", session: snapshot });
    if (snapshot.ingest === "ended")
      socket.close(INGEST_CLOSE_CODES.sessionEnded, "The live session ended");
  });
  const authTimer = setTimeout(
    () =>
      socket.close(INGEST_CLOSE_CODES.unauthorized, "Authentication timed out"),
    AUTH_TIMEOUT_MS,
  );

  const authenticate = (data: RawData, isBinary: boolean): void => {
    const message = isBinary ? null : parseJson(data.toString());
    const parsed = ingestAuthMessageSchema.safeParse(message);
    if (!parsed.success || !session.verifyToken(parsed.data.token)) {
      socket.close(INGEST_CLOSE_CODES.unauthorized, "Unauthorized");
      return;
    }
    if (session.hasEnded) {
      socket.close(INGEST_CLOSE_CODES.sessionEnded, "The live session ended");
      return;
    }
    clearTimeout(authTimer);
    ingest = session.openIngest(() =>
      socket.close(INGEST_CLOSE_CODES.replaced, "Another connection took over"),
    );
    unsubscribe = session.subscribe(sendStatus);
    send({ type: "ready" });
    send({ type: "status", session: session.snapshot() });
    logger.info("Ingest connected", { sessionId: session.id });
  };

  socket.on("message", (data, isBinary) => {
    if (!ingest) {
      authenticate(data, isBinary);
      return;
    }
    if (!isBinary) return;
    try {
      ingest.push(toBytes(data));
    } catch (error) {
      const isInvalidMedia = error instanceof FlvFormatError;
      if (!isInvalidMedia)
        logger.error("Ingest failed", {
          sessionId: session.id,
          reason: error instanceof Error ? error.name : "unknown",
        });
      socket.close(
        isInvalidMedia
          ? INGEST_CLOSE_CODES.invalidMedia
          : INGEST_CLOSE_CODES.serverError,
        isInvalidMedia
          ? "The stream is not valid FLV"
          : "The relay hit an error",
      );
      return;
    }
    if (
      Date.now() - openedAt > BITRATE_GRACE_MS &&
      session.receivedKbps() > maxIngestKbps
    )
      socket.close(INGEST_CLOSE_CODES.ingestTooFast, "The stream is too fast");
  });

  socket.on("close", (code) => {
    clearTimeout(authTimer);
    sendStatus.cancel();
    unsubscribe();
    if (ingest) {
      ingest.close();
      logger.info("Ingest disconnected", { sessionId: session.id, code });
    }
  });
  socket.on("error", () => socket.terminate());
};

export const attachIngestServer = ({
  server,
  registry,
  allowedOrigins,
  maxIngestKbps,
  logger,
}: IngestServerOptions): { close: () => void } => {
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_MESSAGE_BYTES,
    perMessageDeflate: false,
  });
  const alive = new WeakSet<WebSocket>();

  server.on(
    "upgrade",
    (request: IncomingMessage, socket: Duplex, head: Buffer) => {
      const { pathname } = new URL(request.url ?? "/", "http://relay.local");
      const match = INGEST_PATH_PATTERN.exec(pathname);
      if (!match) return rejectUpgrade(socket, 404, "Not Found");
      if (!isOriginAllowed(allowedOrigins, request.headers.origin))
        return rejectUpgrade(socket, 403, "Forbidden");
      const session = registry.find(match[1]);
      if (!session || session.hasEnded)
        return rejectUpgrade(socket, 404, "Not Found");
      sockets.handleUpgrade(request, socket, head, (webSocket) => {
        alive.add(webSocket);
        webSocket.on("pong", () => alive.add(webSocket));
        serveIngest(webSocket, session, maxIngestKbps, logger);
      });
    },
  );

  const heartbeat = setInterval(() => {
    for (const client of sockets.clients) {
      if (!alive.has(client)) {
        client.terminate();
        continue;
      }
      alive.delete(client);
      client.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeat.unref();

  return {
    close: () => {
      clearInterval(heartbeat);
      for (const client of sockets.clients)
        client.close(INGEST_CLOSE_CODES.goingAway, "The relay is restarting");
      sockets.close();
    },
  };
};
