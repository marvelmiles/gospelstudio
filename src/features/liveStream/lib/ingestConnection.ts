import {
  INGEST_CLOSE_CODES,
  relayMessageSchema,
  type SessionSnapshot,
} from "./liveRelayContract";
import type { EncoderFailure } from "./liveEncoderProtocol";

const RECONNECT_DELAYS_MS = [
  1000, 2000, 4000, 8000, 15_000, 15_000, 15_000, 15_000,
];

const FINAL_CLOSE_CODES: Partial<Record<number, EncoderFailure>> = {
  [INGEST_CLOSE_CODES.unauthorized]: "unauthorized",
  [INGEST_CLOSE_CODES.sessionEnded]: "session_ended",
  [INGEST_CLOSE_CODES.replaced]: "session_ended",
  [INGEST_CLOSE_CODES.invalidMedia]: "encoder_failed",
};

const FAILURE_MESSAGES: Record<EncoderFailure, string> = {
  unauthorized: "The streaming relay did not accept this live session.",
  session_ended: "The live session ended on the streaming relay.",
  encoder_failed: "The relay could not read the stream from this browser.",
  connection_lost:
    "The internet connection dropped for too long, so the stream ended. Go live again when the connection is back.",
};

export interface IngestConnectionHandlers {
  onReady: () => void;
  onSession: (session: SessionSnapshot) => void;
  onReconnecting: (attempt: number) => void;
  onFailed: (reason: EncoderFailure, message: string) => void;
}

const parseMessage = (data: unknown) => {
  if (typeof data !== "string") return null;
  try {
    const parsed = relayMessageSchema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export class IngestConnection {
  private readonly url: string;
  private readonly token: string;
  private readonly handlers: IngestConnectionHandlers;
  private socket: WebSocket | null = null;
  private isReady = false;
  private isClosedByUs = false;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, token: string, handlers: IngestConnectionHandlers) {
    this.url = url;
    this.token = token;
    this.handlers = handlers;
    this.connect();
  }

  get isOpen(): boolean {
    return this.isReady && this.socket?.readyState === WebSocket.OPEN;
  }

  get bufferedBytes(): number {
    return this.socket?.bufferedAmount ?? 0;
  }

  send(bytes: Uint8Array): boolean {
    if (!this.isOpen || !this.socket) return false;
    this.socket.send(bytes);
    return true;
  }

  close(): void {
    this.isClosedByUs = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close(INGEST_CLOSE_CODES.normal, "Stream ended");
    this.socket = null;
  }

  private connect(): void {
    const socket = new WebSocket(this.url);
    socket.binaryType = "arraybuffer";
    this.socket = socket;
    this.isReady = false;
    socket.onopen = () =>
      socket.send(JSON.stringify({ type: "auth", token: this.token }));
    socket.onmessage = ({ data }) => this.receive(data);
    socket.onclose = ({ code }) => this.handleClose(socket, code);
  }

  private receive(data: unknown): void {
    const message = parseMessage(data);
    if (!message) return;
    if (message.type === "ready") {
      this.isReady = true;
      this.attempts = 0;
      this.handlers.onReady();
    } else if (message.type === "status") {
      this.handlers.onSession(message.session);
    }
  }

  private handleClose(socket: WebSocket, code: number): void {
    if (socket !== this.socket || this.isClosedByUs) return;
    this.isReady = false;
    const finalReason = FINAL_CLOSE_CODES[code];
    if (finalReason) {
      this.handlers.onFailed(finalReason, FAILURE_MESSAGES[finalReason]);
      return;
    }
    if (this.attempts >= RECONNECT_DELAYS_MS.length) {
      this.handlers.onFailed(
        "connection_lost",
        FAILURE_MESSAGES.connection_lost,
      );
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.attempts];
    this.attempts += 1;
    this.handlers.onReconnecting(this.attempts);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }
}
