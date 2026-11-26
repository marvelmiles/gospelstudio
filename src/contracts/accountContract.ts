import { z } from "zod";

export const ACCOUNT_PATH = "/v1/account";
export const ACCOUNT_EMAIL_PATH = "/v1/account/email";
export const ACCOUNT_PASSWORD_PATH = "/v1/account/password";
export const ACCOUNT_SESSIONS_PATH = "/v1/account/sessions";

export const accountSessionPath = (sessionId: string): string =>
  `${ACCOUNT_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`;

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const CHURCH_NAME_MAX_LENGTH = 120;
export const DEVICE_NAME_MAX_LENGTH = 80;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(EMAIL_MAX_LENGTH, "That email address is too long.")
  .email("Enter a valid email address.");

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`);

export const currentPasswordSchema = z
  .string()
  .min(1, "Enter your password.")
  .max(PASSWORD_MAX_LENGTH, "That password is too long.");

export const churchNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your church or ministry name.")
  .max(
    CHURCH_NAME_MAX_LENGTH,
    `Use ${CHURCH_NAME_MAX_LENGTH} characters or fewer.`,
  );

export const deviceNameSchema = z
  .string()
  .trim()
  .min(1, "The device name is missing.")
  .max(DEVICE_NAME_MAX_LENGTH, "The device name is too long.");

export const sessionIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/, "That device session is not valid.");

export const accountSchema = z.object({
  id: z.string(),
  email: z.string(),
  churchName: z.string(),
  createdAt: z.string(),
});

export type Account = z.infer<typeof accountSchema>;

export const storageUsageSchema = z.object({
  usedBytes: z.number().int().min(0),
  quotaBytes: z.number().int().min(0),
});

export type StorageUsage = z.infer<typeof storageUsageSchema>;

export const accountDetailsSchema = z.object({
  account: accountSchema,
  storage: storageUsageSchema,
});

export type AccountDetails = z.infer<typeof accountDetailsSchema>;

export const updateAccountRequestSchema = z.object({
  churchName: churchNameSchema,
});

export const changeEmailRequestSchema = z.object({
  email: emailSchema,
  currentPassword: currentPasswordSchema,
});

export const changePasswordRequestSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema,
});

export const deleteAccountRequestSchema = z.object({
  currentPassword: currentPasswordSchema,
});

export const accountSessionSchema = z.object({
  id: z.string(),
  deviceName: z.string(),
  createdAt: z.string(),
  lastActiveAt: z.string(),
  current: z.boolean(),
});

export type AccountSession = z.infer<typeof accountSessionSchema>;

export const accountSessionsSchema = z.array(accountSessionSchema);
