import { z } from "zod";

export const DEFAULT_PLAUSIBLE_API_BASE_URL = "https://plausible.io";

const ENV_FIELDS = {
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_FIREBASE_DATABASE_URL: z.string().url(),
  VITE_PLAUSIBLE_DOMAIN: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i),
  VITE_PLAUSIBLE_API_BASE_URL: z.string().url(),
  VITE_RELAY_SERVER_URL: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "Use an http(s) address"),
} satisfies Record<string, z.ZodType<string>>;

type EnvField = keyof typeof ENV_FIELDS;

type ParsedEnv = Partial<Record<EnvField, string>>;

export interface Env extends ParsedEnv {
  VITE_PLAUSIBLE_API_BASE_URL: string;
}

interface EnvParseResult {
  values: ParsedEnv;
  invalidFields: EnvField[];
}

const ENV_FIELD_NAMES = Object.keys(ENV_FIELDS) as EnvField[];

export const parseEnvValues = (
  source: Record<string, unknown>,
): EnvParseResult => {
  const values: ParsedEnv = {};
  const invalidFields: EnvField[] = [];
  for (const name of ENV_FIELD_NAMES) {
    const raw = source[name];
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === undefined || value === "") continue;
    const parsed = ENV_FIELDS[name].safeParse(value);
    if (parsed.success) values[name] = parsed.data;
    else invalidFields.push(name);
  }
  return { values, invalidFields };
};

const currentSiteHostname = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.location.hostname.replace(/^www\./i, "") || undefined;
};

const withDefaults = (parsed: ParsedEnv): Env => ({
  ...parsed,
  VITE_PLAUSIBLE_DOMAIN: parsed.VITE_PLAUSIBLE_DOMAIN ?? currentSiteHostname(),
  VITE_PLAUSIBLE_API_BASE_URL:
    parsed.VITE_PLAUSIBLE_API_BASE_URL ?? DEFAULT_PLAUSIBLE_API_BASE_URL,
});

const parseEnv = (): Env => {
  const { values, invalidFields } = parseEnvValues(import.meta.env);
  if (invalidFields.length > 0 && import.meta.env.DEV)
    console.warn(
      `Ignoring invalid environment variables: ${invalidFields.join(", ")}`,
    );
  return withDefaults(values);
};

export const env: Env = parseEnv();
