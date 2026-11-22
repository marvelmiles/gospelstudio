import type { z } from "zod";
import { env } from "../../../lib/env";
import { requestJson } from "../../../lib/jsonApi";
import {
  createdSessionSchema,
  RELAY_PATHS,
  sessionSnapshotSchema,
  type CreatedSession,
  type DestinationInput,
  type SessionSnapshot,
} from "./liveRelayContract";

const SERVICE_NAME = "streaming relay";
const MISSING_RELAY_HINT =
  "Check VITE_LIVE_RELAY_URL and that the relay server is running.";
const REQUEST_TIMEOUT_MS = 60_000;

export const liveRelayUrl = (): string | null =>
  env.VITE_LIVE_RELAY_URL?.replace(/\/+$/, "") ?? null;

export const ingestUrlOf = (relayUrl: string, sessionId: string): string =>
  `${relayUrl.replace(/^http/i, "ws")}${RELAY_PATHS.ingest(sessionId)}`;

const relayRequest = <S extends z.ZodTypeAny>(
  relayUrl: string,
  path: string,
  init: RequestInit,
  dataSchema: S,
): Promise<z.output<S>> =>
  requestJson({
    url: `${relayUrl}${path}`,
    init: { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    dataSchema,
    serviceName: SERVICE_NAME,
    missingServiceHint: MISSING_RELAY_HINT,
  });

const authorized = (session: CreatedSession): Record<string, string> => ({
  Authorization: `Bearer ${session.token}`,
});

export const createRelaySession = (relayUrl: string): Promise<CreatedSession> =>
  relayRequest(
    relayUrl,
    RELAY_PATHS.sessions,
    { method: "POST" },
    createdSessionSchema,
  );

export const setRelayDestinations = (
  relayUrl: string,
  session: CreatedSession,
  destinations: readonly DestinationInput[],
): Promise<SessionSnapshot> =>
  relayRequest(
    relayUrl,
    RELAY_PATHS.destinations(session.sessionId),
    {
      method: "PUT",
      headers: { ...authorized(session), "Content-Type": "application/json" },
      body: JSON.stringify({ destinations }),
    },
    sessionSnapshotSchema,
  );

export const endRelaySession = (
  relayUrl: string,
  session: CreatedSession,
): Promise<SessionSnapshot> =>
  relayRequest(
    relayUrl,
    RELAY_PATHS.session(session.sessionId),
    { method: "DELETE", headers: authorized(session) },
    sessionSnapshotSchema,
  );
