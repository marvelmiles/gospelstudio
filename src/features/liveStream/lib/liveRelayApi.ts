import type { z } from "zod";
import { requestJson } from "../../../lib/jsonApi";
import { RELAY_SERVER_MISSING_HINT } from "../../../lib/relayServer";
import {
  createdSessionSchema,
  RELAY_PATHS,
  sessionSnapshotSchema,
  type CreatedSession,
  type DestinationInput,
  type SessionSnapshot,
} from "@/contracts/liveRelay";

const SERVICE_NAME = "streaming relay";
const REQUEST_TIMEOUT_MS = 60_000;

export const LIVE_STREAMING_NOT_CONFIGURED =
  "Live streaming is not set up on this site yet. Whoever runs it needs to start the relay server and set VITE_RELAY_SERVER_URL.";

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
    missingServiceHint: RELAY_SERVER_MISSING_HINT,
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
