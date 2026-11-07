import { env } from "../env";

interface AnalyticsConfig {
  domain: string;
  endpoint: string;
}

const isTrackedHost = (hostname: string, domain: string): boolean => {
  const host = hostname.toLowerCase();
  const site = domain.toLowerCase();
  return host === site || host === `www.${site}`;
};

const eventEndpoint = (apiBaseUrl: string): string =>
  new URL("/api/event", apiBaseUrl).href;

const resolveAnalyticsConfig = (): AnalyticsConfig | null => {
  const domain = env.VITE_PLAUSIBLE_DOMAIN;
  console.log(
    env,
    import.meta.env.PROD,
    domain,
    isTrackedHost(window.location.hostname, domain || ""),
    " env",
  );

  if (!import.meta.env.PROD || !domain) return null;
  if (!isTrackedHost(window.location.hostname, domain)) return null;
  return {
    domain,
    endpoint: eventEndpoint(env.VITE_PLAUSIBLE_API_BASE_URL),
  };
};

let resolvedConfig: AnalyticsConfig | null | undefined;

export const getAnalyticsConfig = (): AnalyticsConfig | null => {
  if (resolvedConfig === undefined) resolvedConfig = resolveAnalyticsConfig();
  return resolvedConfig;
};
