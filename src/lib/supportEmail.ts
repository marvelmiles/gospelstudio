import { env } from "./env";

export const supportEmail = (): string | null => env.VITE_SUPPORT_EMAIL ?? null;
