import { z } from "zod";

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

export type EnvField = keyof typeof ENV_FIELDS;

export type ParsedEnv = Partial<Record<EnvField, string>>;

export interface EnvParseResult {
  values: ParsedEnv;
  invalidFields: EnvField[];
}

export interface RenamedEnvField {
  previousName: string;
  currentName: EnvField;
}

const ENV_FIELD_NAMES = Object.keys(ENV_FIELDS) as EnvField[];

const PREVIOUS_ENV_FIELD_NAMES: Readonly<Record<string, EnvField>> = {
  VITE_LIVE_RELAY_URL: "VITE_RELAY_SERVER_URL",
};

const readValue = (source: Record<string, unknown>, name: string): unknown => {
  const raw = source[name];
  const value = typeof raw === "string" ? raw.trim() : raw;
  return value === "" ? undefined : value;
};

export const parseEnvValues = (
  source: Record<string, unknown>,
): EnvParseResult => {
  const values: ParsedEnv = {};
  const invalidFields: EnvField[] = [];
  for (const name of ENV_FIELD_NAMES) {
    const value = readValue(source, name);
    if (value === undefined) continue;
    const parsed = ENV_FIELDS[name].safeParse(value);
    if (parsed.success) values[name] = parsed.data;
    else invalidFields.push(name);
  }
  return { values, invalidFields };
};

export const renamedEnvFieldsIn = (
  source: Record<string, unknown>,
): RenamedEnvField[] =>
  Object.entries(PREVIOUS_ENV_FIELD_NAMES)
    .filter(([previousName]) => readValue(source, previousName) !== undefined)
    .map(([previousName, currentName]) => ({ previousName, currentName }));
