import { z } from "zod";

const MAX_EMAIL_LENGTH = 254;

const forgotPasswordStateSchema = z.object({
  email: z.string().max(MAX_EMAIL_LENGTH),
});

export type ForgotPasswordState = z.infer<typeof forgotPasswordStateSchema>;

export const forgotPasswordStateOf = (email: string): ForgotPasswordState => ({
  email: email.trim().slice(0, MAX_EMAIL_LENGTH),
});

export const emailFromForgotPasswordState = (state: unknown): string => {
  const parsed = forgotPasswordStateSchema.safeParse(state);
  return parsed.success ? parsed.data.email : "";
};
