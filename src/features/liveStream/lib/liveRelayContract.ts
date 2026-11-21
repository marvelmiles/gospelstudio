import { z } from "zod";
import { streamUrlSchema } from "./streamUrl";

export const MAX_STREAM_DESTINATIONS = 10;

export const RELAY_PATHS = {
  health: "/healthz",
  sessions: "/v1/sessions",
  session: (sessionId: string) => `/v1/sessions/${sessionId}`,
  destinations: (sessionId: string) => `/v1/sessions/${sessionId}/destinations`,
  ingest: (sessionId: string) => `/v1/sessions/${sessionId}/ingest`,
} as const;

export const INGEST_PATH_PATTERN =
  /^\/v1\/sessions\/([A-Za-z0-9_-]{16,64})\/ingest$/;

export const sessionIdSchema = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

export const sessionTokenSchema = z
  .string()
  .min(32)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);

const destinationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const createdSessionSchema = z.object({
  sessionId: sessionIdSchema,
  token: sessionTokenSchema,
});

export type CreatedSession = z.infer<typeof createdSessionSchema>;

const destinationInputSchema = z
  .object({ id: destinationIdSchema, url: streamUrlSchema })
  .strict();

export type DestinationInput = z.infer<typeof destinationInputSchema>;

export const setDestinationsRequestSchema = z
  .object({
    destinations: z
      .array(destinationInputSchema)
      .max(MAX_STREAM_DESTINATIONS)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Each destination needs its own id.",
      )
      .refine(
        (items) => new Set(items.map((item) => item.url)).size === items.length,
        "Each stream key can only be used once.",
      ),
  })
  .strict();


const DESTINATION_STATES = [
  "waiting",
  "connecting",
  "live",
  "retrying",
  "failed",
] as const;

export type DestinationState = (typeof DESTINATION_STATES)[number];

const INGEST_STATES = ["waiting", "receiving", "interrupted", "ended"] as const;

export type IngestState = (typeof INGEST_STATES)[number];

const destinationSnapshotSchema = z.object({
  id: destinationIdSchema,
  state: z.enum(DESTINATION_STATES),
  error: z.string().nullable(),
  retries: z.number().int().nonnegative(),
});

export type DestinationSnapshot = z.infer<typeof destinationSnapshotSchema>;

export const sessionSnapshotSchema = z.object({
  sessionId: sessionIdSchema,
  ingest: z.enum(INGEST_STATES),
  receivedKbps: z.number().nonnegative(),
  destinations: z.array(destinationSnapshotSchema),
});

export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;

export const ingestAuthMessageSchema = z
  .object({ type: z.literal("auth"), token: sessionTokenSchema })
  .strict();


export const relayMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("status"), session: sessionSnapshotSchema }),
  z.object({
    type: z.literal("error"),
    code: z.string(),
    message: z.string(),
  }),
]);

export type RelayMessage = z.infer<typeof relayMessageSchema>;

export type RelayErrorCode =
  | "invalid_request"
  | "unauthorized"
  | "not_found"
  | "method_not_allowed"
  | "forbidden_origin"
  | "capacity_reached"
  | "rate_limited"
  | "payload_too_large"
  | "unsupported_media_type"
  | "destination_not_allowed"
  | "session_ended"
  | "internal_error";

export const INGEST_CLOSE_CODES = {
  normal: 1000,
  goingAway: 1001,
  policyViolation: 1008,
  tooBig: 1009,
  serverError: 1011,
  replaced: 4000,
  unauthorized: 4001,
  sessionEnded: 4004,
  invalidMedia: 4005,
  ingestTooFast: 4006,
} as const;
