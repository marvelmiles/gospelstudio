import { env } from "./env";

export const API_SERVER_MISSING_HINT =
  "Check VITE_API_URL and that the GospelStudio API is running.";

export const apiServerUrl = (): string | null =>
  env.VITE_API_URL?.replace(/\/+$/, "") ?? null;

export const isAccountsAvailable = (): boolean => apiServerUrl() !== null;
