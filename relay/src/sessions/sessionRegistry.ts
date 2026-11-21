import { RelayError } from "../errors";
import type { LiveSession } from "./liveSession";
import {
  createSessionCredentials,
  digestToken,
  type SessionCredentials,
} from "./sessionTokens";

interface SessionRegistryOptions {
  maxSessions: number;
  createSession: (
    credentials: { sessionId: string; tokenDigest: Buffer },
    onEnded: (session: LiveSession) => void,
  ) => LiveSession;
}

export class SessionRegistry {
  private readonly sessions = new Map<string, LiveSession>();
  private readonly options: SessionRegistryOptions;

  constructor(options: SessionRegistryOptions) {
    this.options = options;
  }

  get size(): number {
    return this.sessions.size;
  }

  get capacity(): number {
    return this.options.maxSessions;
  }

  create(): { session: LiveSession; credentials: SessionCredentials } {
    if (this.sessions.size >= this.options.maxSessions)
      throw new RelayError(
        503,
        "capacity_reached",
        "This streaming server is full right now. Try again in a few minutes.",
      );
    const credentials = createSessionCredentials();
    const session = this.options.createSession(
      {
        sessionId: credentials.sessionId,
        tokenDigest: digestToken(credentials.token),
      },
      (ended) => this.sessions.delete(ended.id),
    );
    this.sessions.set(session.id, session);
    return { session, credentials };
  }

  find(sessionId: string): LiveSession | undefined {
    return this.sessions.get(sessionId);
  }

  endAll(): void {
    for (const session of [...this.sessions.values()]) session.end();
  }
}
