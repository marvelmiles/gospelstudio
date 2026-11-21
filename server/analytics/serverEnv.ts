import { z } from "zod";
import {
  DEFAULT_REPORT_TIME_ZONE,
  isValidTimeZone,
} from "../../src/lib/analytics/reportPeriods";
import { emptyAsMissing, parseEnvWith, type EnvResult } from "../shared/env";

const DEFAULT_PLAUSIBLE_API_BASE_URL = "https://plausible.io";
const MIN_ADMIN_TOKEN_LENGTH = 32;

const serverEnvSchema = z.object({
  PLAUSIBLE_API_KEY: emptyAsMissing(z.string().min(20)),
  PLAUSIBLE_SITE_ID: emptyAsMissing(
    z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Use the site domain"),
  ),
  PLAUSIBLE_API_BASE_URL: emptyAsMissing(
    z.string().url().default(DEFAULT_PLAUSIBLE_API_BASE_URL),
  ),
  ANALYTICS_ADMIN_TOKEN: emptyAsMissing(z.string().min(MIN_ADMIN_TOKEN_LENGTH)),
  ANALYTICS_TIMEZONE: emptyAsMissing(
    z
      .string()
      .refine(isValidTimeZone, "Use an IANA time zone")
      .default(DEFAULT_REPORT_TIME_ZONE),
  ),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const parseServerEnv = (
  source: Record<string, string | undefined>,
): EnvResult<ServerEnv> => parseEnvWith(serverEnvSchema, source);
