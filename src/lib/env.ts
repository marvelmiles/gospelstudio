import { z } from "zod";

export const DEFAULT_PLAUSIBLE_API_BASE_URL = "https://plausible.io";

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1).optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  VITE_FIREBASE_APP_ID: z.string().min(1).optional(),
  VITE_FIREBASE_DATABASE_URL: z.string().url().optional(),
  VITE_PLAUSIBLE_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
    .optional(),
  VITE_PLAUSIBLE_API_BASE_URL: z.string().url().optional(),
});

type ParsedEnv = z.infer<typeof envSchema>;

export interface Env extends ParsedEnv {
  VITE_PLAUSIBLE_API_BASE_URL: string;
}

const currentSiteHostname = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.location.hostname.replace(/^www\./i, "") || undefined;
};

const withDefaults = (parsed: ParsedEnv): Env => {
  const t = {
    ...parsed,
    VITE_PLAUSIBLE_DOMAIN:
      parsed.VITE_PLAUSIBLE_DOMAIN ?? currentSiteHostname(),
    VITE_PLAUSIBLE_API_BASE_URL:
      parsed.VITE_PLAUSIBLE_API_BASE_URL ?? DEFAULT_PLAUSIBLE_API_BASE_URL,
  };

  console.log(t, parsed, currentSiteHostname(), " with defaults");

  return t;
};

const parseEnv = (): Env => {
  const result = envSchema.safeParse(import.meta.env);

  if (result.success) return withDefaults(result.data);

  if (import.meta.env.DEV) {
    console.warn(
      "Invalid environment variables; ignoring them:",
      result.error.flatten().fieldErrors,
    );
  }
  return withDefaults({});
};

export const env: Env = parseEnv();
