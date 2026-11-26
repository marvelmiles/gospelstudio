import { z } from "zod";
import { accountSchema, type Account } from "@/contracts/accountContract";
import { refreshTokenSchema } from "@/contracts/authContract";
import {
  deleteRecord,
  readRecord,
  saveRecordStrict,
} from "../../../lib/storage";

const CREDENTIALS_ID = "current";
const UNTRACKED = { tracked: false } as const;

const storedCredentialsSchema = z.object({
  id: z.literal(CREDENTIALS_ID),
  refreshToken: refreshTokenSchema,
  account: accountSchema,
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

export const readCredentials = async (): Promise<StoredCredentials | null> => {
  const parsed = storedCredentialsSchema.safeParse(
    await readRecord("credentials", CREDENTIALS_ID),
  );
  return parsed.success ? parsed.data : null;
};

export const writeCredentials = (
  refreshToken: string,
  account: Account,
): Promise<void> =>
  saveRecordStrict<StoredCredentials>(
    "credentials",
    { id: CREDENTIALS_ID, refreshToken, account },
    UNTRACKED,
  );

export const clearCredentials = (): Promise<void> =>
  deleteRecord("credentials", CREDENTIALS_ID, UNTRACKED);
