import { parseEnvValues, type ParsedEnv } from "./envSchema";

export const DEFAULT_PLAUSIBLE_API_BASE_URL = "https://plausible.io";

export interface Env extends ParsedEnv {
  VITE_PLAUSIBLE_API_BASE_URL: string;
}

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

console.log("Parsed environment variables:", env);
