import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const authorizationSchema = z
  .string()
  .max(512)
  .regex(/^Bearer [\x21-\x7E]+$/);

const digest = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

export const isAuthorizedAdmin = (
  authorization: string | null,
  adminToken: string,
): boolean => {
  const parsed = authorizationSchema.safeParse(authorization);
  if (!parsed.success) return false;
  const presented = parsed.data.slice("Bearer ".length);
  return timingSafeEqual(digest(presented), digest(adminToken));
};
