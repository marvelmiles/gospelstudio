import { z } from "zod";

const emptyAsMissing = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const booleanFlag = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const originListSchema = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z.union([
          z.literal("*"),
          z
            .string()
            .url()
            .transform((origin) => new URL(origin).origin),
        ]),
      )
      .min(1),
  );

const relayEnvSchema = z.object({
  PORT: emptyAsMissing(z.coerce.number().int().min(1).max(65535).default(8080)),
  HOST: emptyAsMissing(z.string().min(1).default("0.0.0.0")),
  ALLOWED_ORIGINS: originListSchema,
  FFMPEG_PATH: emptyAsMissing(z.string().min(1).optional()),
  MAX_SESSIONS: emptyAsMissing(
    z.coerce.number().int().min(1).max(10_000).default(100),
  ),
  MAX_INGEST_KBPS: emptyAsMissing(
    z.coerce.number().int().min(1000).max(100_000).default(12_000),
  ),
  TRUST_PROXY_HOPS: emptyAsMissing(
    z.coerce.number().int().min(0).max(10).default(0),
  ),
  ALLOW_PRIVATE_DESTINATIONS: emptyAsMissing(booleanFlag.default("false")),
});

export type RelayEnv = z.infer<typeof relayEnvSchema>;

type RelayEnvResult =
  { ok: true; env: RelayEnv } | { ok: false; invalidVariables: string[] };

export const parseRelayEnv = (
  source: Record<string, string | undefined>,
): RelayEnvResult => {
  const result = relayEnvSchema.safeParse(source);
  if (result.success) return { ok: true, env: result.data };
  return {
    ok: false,
    invalidVariables: [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ],
  };
};

export const isOriginAllowed = (
  allowedOrigins: readonly string[],
  origin: string | undefined,
): boolean =>
  origin === undefined ||
  allowedOrigins.includes("*") ||
  allowedOrigins.includes(origin);
