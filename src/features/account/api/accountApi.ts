import type { z } from "zod";
import {
  ACCOUNT_EMAIL_PATH,
  ACCOUNT_PASSWORD_PATH,
  ACCOUNT_PATH,
  ACCOUNT_SESSIONS_PATH,
  accountDetailsSchema,
  accountSchema,
  accountSessionPath,
  accountSessionsSchema,
  type Account,
  type AccountDetails,
  type AccountSession,
  type changeEmailRequestSchema,
  type changePasswordRequestSchema,
} from "@/contracts/accountContract";
import { callAccountApi, callAccountApiWithoutContent } from "./authorizedApi";

export type EmailChange = z.input<typeof changeEmailRequestSchema>;
export type PasswordChange = z.input<typeof changePasswordRequestSchema>;

export const fetchAccountDetails = (): Promise<AccountDetails> =>
  callAccountApi({ path: ACCOUNT_PATH, dataSchema: accountDetailsSchema });

export const renameChurch = (churchName: string): Promise<Account> =>
  callAccountApi({
    path: ACCOUNT_PATH,
    method: "PATCH",
    body: { churchName },
    dataSchema: accountSchema,
  });

export const changeEmail = (change: EmailChange): Promise<Account> =>
  callAccountApi({
    path: ACCOUNT_EMAIL_PATH,
    method: "PUT",
    body: change,
    dataSchema: accountSchema,
  });

export const changePassword = (change: PasswordChange): Promise<void> =>
  callAccountApiWithoutContent({
    path: ACCOUNT_PASSWORD_PATH,
    method: "PUT",
    body: change,
  });

export const deleteAccount = (currentPassword: string): Promise<void> =>
  callAccountApiWithoutContent({
    path: ACCOUNT_PATH,
    method: "DELETE",
    body: { currentPassword },
  });

export const listDevices = (): Promise<AccountSession[]> =>
  callAccountApi({
    path: ACCOUNT_SESSIONS_PATH,
    dataSchema: accountSessionsSchema,
  });

export const signOutDevice = (sessionId: string): Promise<void> =>
  callAccountApiWithoutContent({
    path: accountSessionPath(sessionId),
    method: "DELETE",
  });

export const signOutOtherDevices = (): Promise<void> =>
  callAccountApiWithoutContent({
    path: ACCOUNT_SESSIONS_PATH,
    method: "DELETE",
  });
