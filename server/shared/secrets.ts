import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

export const secretsMatch = (presented: string, expected: string): boolean =>
  timingSafeEqual(digest(presented), digest(expected));
