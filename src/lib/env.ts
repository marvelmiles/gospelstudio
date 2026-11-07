import { z } from "zod";

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1).optional(),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  VITE_FIREBASE_APP_ID: z.string().min(1).optional(),
  VITE_FIREBASE_DATABASE_URL: z.string().url().optional(),
  VITE_PLAUSIBLE_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
    .optional(),
  VITE_PLAUSIBLE_API_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  const result = envSchema.safeParse(import.meta.env);

  console.log(result, import.meta.env, "parsed result");

  if (result.success) return result.data;

  if (import.meta.env.DEV) {
    console.warn(
      "Invalid environment variables; ignoring them:",
      result.error.flatten().fieldErrors,
    );
  }
  return {};
};

export const env: Env = parseEnv();
