import { z } from "zod";
import {
  accountSchema,
  churchNameSchema,
  currentPasswordSchema,
  deviceNameSchema,
  emailSchema,
  newPasswordSchema,
} from "./accountContract";

export const AUTH_PATHS = {
  signUp: "/v1/auth/sign-up",
  signIn: "/v1/auth/sign-in",
  refresh: "/v1/auth/refresh",
  signOut: "/v1/auth/sign-out",
  forgotPassword: "/v1/auth/password/forgot",
  resetPassword: "/v1/auth/password/reset",
} as const;

export const PASSWORD_RESET_APP_PATH = "/reset-password";
export const PASSWORD_RESET_TOKEN_PARAM = "token";

export const passwordResetLink = (appOrigin: string, token: string): string =>
  `${appOrigin}${PASSWORD_RESET_APP_PATH}#${PASSWORD_RESET_TOKEN_PARAM}=${token}`;

export const refreshTokenSchema = z
  .string()
  .regex(
    /^[a-f0-9]{24}\.[A-Za-z0-9_-]{43}$/,
    "The session token is not valid.",
  );

export const resetTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "This reset link is not valid.");

export const signUpRequestSchema = z.object({
  churchName: churchNameSchema,
  email: emailSchema,
  password: newPasswordSchema,
  deviceName: deviceNameSchema,
});

export const signInRequestSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
  deviceName: deviceNameSchema,
});

export const refreshRequestSchema = z.object({
  refreshToken: refreshTokenSchema,
});

export const signOutRequestSchema = refreshRequestSchema;

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordRequestSchema = z.object({
  token: resetTokenSchema,
  password: newPasswordSchema,
});

export const sessionTokensSchema = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.string(),
  refreshToken: refreshTokenSchema,
});

export type SessionTokens = z.infer<typeof sessionTokensSchema>;

export const authSessionSchema = z.object({
  account: accountSchema,
  tokens: sessionTokensSchema,
});

export type AuthSession = z.infer<typeof authSessionSchema>;
