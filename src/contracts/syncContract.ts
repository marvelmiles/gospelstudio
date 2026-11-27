import { z } from "zod";

export const SYNC_PUSH_PATH = "/v1/sync/push";
export const SYNC_CHANGES_PATH = "/v1/sync/changes";
export const SYNC_FILES_PATH = "/v1/sync/files";

export const syncFilePath = (fileId: string): string =>
  `${SYNC_FILES_PATH}/${encodeURIComponent(fileId)}`;

export const SYNC_RECORD_STORES = [
  "manuscripts",
  "scriptures",
  "media",
  "backgrounds",
  "themes",
  "audio",
  "prefs",
  "productions",
  "sceneLayouts",
] as const;

export const SYNC_FILE_STORE = "files";

export const SYNC_STORES = [...SYNC_RECORD_STORES, SYNC_FILE_STORE] as const;

export type SyncRecordStore = (typeof SYNC_RECORD_STORES)[number];
export type SyncStore = (typeof SYNC_STORES)[number];

export const MAX_RECORD_BYTES = 4 * 1024 * 1024;
export const MAX_PUSH_CHANGES = 100;
export const MAX_PUSH_BYTES = 8 * 1024 * 1024;
export const DEFAULT_CHANGES_LIMIT = 200;
export const MAX_CHANGES_LIMIT = 500;

export const SYNC_HEADERS = {
  deviceId: "X-Device-Id",
  changedAt: "X-Changed-At",
} as const;

export const FALLBACK_FILE_CONTENT_TYPE = "application/octet-stream";

export const recordIdSchema = z
  .string()
  .min(1, "The record id is missing.")
  .max(200, "The record id is too long.")
  .regex(/^[A-Za-z0-9_\-:.]+$/, "The record id has characters it can't use.");

export const deviceIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, "The device id is not valid.");

export const changedAtSchema = z
  .string()
  .datetime({ offset: true, message: "The change time is not valid." });

export const syncRecordStoreSchema = z.enum(SYNC_RECORD_STORES);
export const syncStoreSchema = z.enum(SYNC_STORES);
export const recordDataSchema = z.record(z.string(), z.unknown());

const putChangeSchema = z.object({
  operation: z.literal("put"),
  store: syncRecordStoreSchema,
  recordId: recordIdSchema,
  changedAt: changedAtSchema,
  data: recordDataSchema,
});

const deleteChangeSchema = z.object({
  operation: z.literal("delete"),
  store: syncStoreSchema,
  recordId: recordIdSchema,
  changedAt: changedAtSchema,
});

export const localChangeSchema = z
  .discriminatedUnion("operation", [putChangeSchema, deleteChangeSchema])
  .superRefine((change, context) => {
    if (change.operation === "put" && change.data.id !== change.recordId)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A record's data must carry the same id as the record.",
        path: ["data", "id"],
      });
  });

export type LocalChange = z.infer<typeof localChangeSchema>;

export const pushRequestSchema = z.object({
  deviceId: deviceIdSchema,
  changes: z
    .array(localChangeSchema)
    .min(1, "Send at least one change.")
    .max(MAX_PUSH_CHANGES, `Send ${MAX_PUSH_CHANGES} changes or fewer.`),
});

export type PushRequest = z.infer<typeof pushRequestSchema>;

export const remoteChangeSchema = z.object({
  store: syncStoreSchema,
  recordId: recordIdSchema,
  sequence: z.number().int().positive(),
  deleted: z.boolean(),
  data: recordDataSchema.nullable(),
  changedAt: z.string(),
  deviceId: z.string(),
});

export type RemoteChange = z.infer<typeof remoteChangeSchema>;

export const pushOutcomeSchema = z.enum(["applied", "superseded"]);

export type PushOutcome = z.infer<typeof pushOutcomeSchema>;

export const pushResultSchema = z.object({
  store: syncStoreSchema,
  recordId: recordIdSchema,
  outcome: pushOutcomeSchema,
  sequence: z.number().int().min(0),
  current: remoteChangeSchema.optional(),
});

export type PushResult = z.infer<typeof pushResultSchema>;

export const pushResponseSchema = z.object({
  results: z.array(pushResultSchema),
});

export const changesQuerySchema = z.object({
  after: z.coerce.number().int().min(0).default(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_CHANGES_LIMIT)
    .default(DEFAULT_CHANGES_LIMIT),
});

export const changesResponseSchema = z.object({
  changes: z.array(remoteChangeSchema),
  cursor: z.number().int().min(0),
  hasMore: z.boolean(),
  serverTime: z.string().datetime(),
});

export type ChangesPage = z.infer<typeof changesResponseSchema>;

export const fileContentTypeSchema = z
  .string()
  .max(127)
  .regex(/^[\w.+-]+\/[\w.+-]+$/, "The file type is not valid.");

export const fileMetadataSchema = z.object({
  id: recordIdSchema,
  size: z.number().int().min(0),
  contentType: fileContentTypeSchema,
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

export const baseContentType = (contentType: string | undefined): string =>
  (contentType ?? "").split(";")[0]?.trim().toLowerCase() ||
  FALLBACK_FILE_CONTENT_TYPE;
