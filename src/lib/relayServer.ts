import { env } from "./env";

export const RELAY_SERVER_MISSING_HINT =
  "Check VITE_RELAY_SERVER_URL and that the relay server is running.";

export const relayServerUrl = (): string | null =>
  env.VITE_RELAY_SERVER_URL?.replace(/\/+$/, "") ?? null;
