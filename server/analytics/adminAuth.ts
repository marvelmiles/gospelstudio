import { z } from "zod";
import { secretsMatch } from "../shared/secrets";

const authorizationSchema = z
  .string()
  .max(512)
  .regex(/^Bearer [\x21-\x7E]+$/);

export const isAuthorizedAdmin = (
  authorization: string | null,
  adminToken: string,
): boolean => {
  const parsed = authorizationSchema.safeParse(authorization);
  if (!parsed.success) return false;
  return secretsMatch(parsed.data.slice("Bearer ".length), adminToken);
};
