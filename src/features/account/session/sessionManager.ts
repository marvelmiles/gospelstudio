import type { Account } from "@/contracts/accountContract";
import { API_ERROR_CODES } from "@/contracts/apiErrors";
import type { AuthSession, SessionTokens } from "@/contracts/authContract";
import { deepEqual } from "../../../lib/equality";
import { ApiRequestError } from "../../../lib/jsonApi";
import { withWebLock } from "../../../lib/webLocks";
import { useStore } from "../../../store/useStore";
import { endSession, refreshSession } from "../api/authApi";
import { announceToOtherTabs } from "./accountChannel";
import { useAuthStore } from "./authStore";
import {
  clearCredentials,
  readCredentials,
  writeCredentials,
} from "./credentialVault";

const REFRESH_LOCK = "gospelstudio-auth-refresh";
const EXPIRY_MARGIN_MS = 30_000;
const REFRESH_ATTEMPTS = 2;
const EXPIRED_MESSAGE =
  "Your sign-in ended, so syncing stopped. Everything on this device is still here. Sign in again to keep syncing.";

export class SignedOutError extends Error {
  constructor() {
    super("You are signed out.");
    this.name = "SignedOutError";
  }
}

export type SessionEndReason = "signed-out" | "expired" | "account-deleted";

interface CachedAccessToken {
  value: string;
  expiresAt: number;
}

let accessToken: CachedAccessToken | null = null;
let renewing: Promise<string> | null = null;

const rememberAccessToken = (tokens: SessionTokens): void => {
  accessToken = {
    value: tokens.accessToken,
    expiresAt: Date.parse(tokens.accessTokenExpiresAt),
  };
};

const showSignedIn = (account: Account): void => {
  if (!deepEqual(useAuthStore.getState().account, account))
    useAuthStore.setState({ status: "signedIn", account });
};

export const isSessionEnded = (error: unknown): boolean =>
  error instanceof SignedOutError ||
  (error instanceof ApiRequestError && error.status === 401);

export const restoreSession = async (): Promise<void> => {
  const credentials = await readCredentials();
  useAuthStore.setState(
    credentials
      ? { status: "signedIn", account: credentials.account }
      : { status: "signedOut", account: null },
  );
};

export const beginSession = async (session: AuthSession): Promise<void> => {
  await writeCredentials(session.tokens.refreshToken, session.account);
  rememberAccessToken(session.tokens);
  useAuthStore.setState({ status: "signedIn", account: session.account });
  announceToOtherTabs({ type: "session-changed" });
};

export const rememberAccount = async (account: Account): Promise<void> => {
  const credentials = await readCredentials();
  if (!credentials) return;
  await writeCredentials(credentials.refreshToken, account);
  showSignedIn(account);
  announceToOtherTabs({ type: "session-changed" });
};

export const endLocalSession = async (
  reason: SessionEndReason,
): Promise<void> => {
  accessToken = null;
  await clearCredentials();
  useAuthStore.setState({ status: "signedOut", account: null });
  announceToOtherTabs({ type: "session-changed" });
  if (reason === "expired")
    useStore.getState().pushToast(EXPIRED_MESSAGE, "error");
};

/* The refresh token rotates on every use, so tabs take turns: each one re-reads the stored token inside the lock instead of racing with an old one. */
const renewAccessToken = (): Promise<string> =>
  withWebLock(REFRESH_LOCK, async () => {
    for (let attempt = 1; ; attempt += 1) {
      const credentials = await readCredentials();
      if (!credentials) throw new SignedOutError();
      try {
        const session = await refreshSession(credentials.refreshToken);
        await writeCredentials(session.tokens.refreshToken, session.account);
        rememberAccessToken(session.tokens);
        showSignedIn(session.account);
        return session.tokens.accessToken;
      } catch (error) {
        const rotatedElsewhere =
          error instanceof ApiRequestError &&
          error.code === API_ERROR_CODES.tokenRotated;
        if (rotatedElsewhere && attempt < REFRESH_ATTEMPTS) continue;
        if (isSessionEnded(error)) {
          await endLocalSession("expired");
          throw new SignedOutError();
        }
        throw error;
      }
    }
  });

export const accessTokenFor = (): Promise<string> => {
  if (accessToken && accessToken.expiresAt - Date.now() > EXPIRY_MARGIN_MS)
    return Promise.resolve(accessToken.value);
  renewing ??= renewAccessToken().finally(() => {
    renewing = null;
  });
  return renewing;
};

export const forgetAccessToken = (): void => {
  accessToken = null;
};

export const signOutOfSession = async (): Promise<void> => {
  const credentials = await readCredentials();
  await endLocalSession("signed-out");
  if (credentials) await endSession(credentials.refreshToken).catch(() => {});
};
