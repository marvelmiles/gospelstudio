import type { z } from "zod";
import {
  AUTH_PATHS,
  authSessionSchema,
  type AuthSession,
  type forgotPasswordRequestSchema,
  type resetPasswordRequestSchema,
  type signInRequestSchema,
  type signUpRequestSchema,
} from "@/contracts/authContract";
import { callPublicApi, callPublicApiWithoutContent } from "./publicApi";

export type SignUpDetails = z.input<typeof signUpRequestSchema>;
export type SignInDetails = z.input<typeof signInRequestSchema>;
export type PasswordResetRequest = z.input<typeof forgotPasswordRequestSchema>;
export type PasswordResetCompletion = z.input<
  typeof resetPasswordRequestSchema
>;

export const signUp = (details: SignUpDetails): Promise<AuthSession> =>
  callPublicApi({
    path: AUTH_PATHS.signUp,
    method: "POST",
    body: details,
    dataSchema: authSessionSchema,
  });

export const signIn = (details: SignInDetails): Promise<AuthSession> =>
  callPublicApi({
    path: AUTH_PATHS.signIn,
    method: "POST",
    body: details,
    dataSchema: authSessionSchema,
  });

export const refreshSession = (refreshToken: string): Promise<AuthSession> =>
  callPublicApi({
    path: AUTH_PATHS.refresh,
    method: "POST",
    body: { refreshToken },
    dataSchema: authSessionSchema,
  });

export const endSession = (refreshToken: string): Promise<void> =>
  callPublicApiWithoutContent({
    path: AUTH_PATHS.signOut,
    method: "POST",
    body: { refreshToken },
  });

export const requestPasswordReset = (
  request: PasswordResetRequest,
): Promise<void> =>
  callPublicApiWithoutContent({
    path: AUTH_PATHS.forgotPassword,
    method: "POST",
    body: request,
  });

export const completePasswordReset = (
  completion: PasswordResetCompletion,
): Promise<void> =>
  callPublicApiWithoutContent({
    path: AUTH_PATHS.resetPassword,
    method: "POST",
    body: completion,
  });
