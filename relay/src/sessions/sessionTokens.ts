import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_ID_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;

export interface SessionCredentials {
  sessionId: string;
  token: string;
}

export const createSessionCredentials = (): SessionCredentials => ({
  sessionId: randomBytes(SESSION_ID_BYTES).toString("base64url"),
  token: randomBytes(SESSION_TOKEN_BYTES).toString("base64url"),
});

export const digestToken = (token: string): Buffer =>
  createHash("sha256").update(token, "utf8").digest();

export const tokenMatches = (token: string, digest: Buffer): boolean =>
  timingSafeEqual(digestToken(token), digest);
