import type { AuthSession } from "@/contracts/authContract";
import type { SessionEnded } from "@/contracts/realtimeContract";
import { useStore } from "../../store/useStore";
import { flushSync, stopSyncEngine } from "../sync/syncEngine";
import {
  awaitSyncDecision,
  forgetAccountSync,
  pauseSync,
} from "../sync/syncControls";
import { fetchAccountDetails } from "./api/accountApi";
import { reloadChurchLogo } from "./session/churchLogoStore";
import {
  beginSession,
  endLocalSession,
  rememberAccount,
  signOutOfSession,
} from "./session/sessionManager";

const SIGN_OUT_SYNC_WAIT_MS = 8000;

const ENDED_ELSEWHERE_MESSAGES: Record<SessionEnded["reason"], string> = {
  "signed-out":
    "This device was signed out from another device. Your library is still here.",
  "password-changed":
    "The password was changed on another device, so this device was signed out. Sign in with the new password to keep syncing.",
  "account-deleted":
    "This account was deleted on another device. Your library is still on this device.",
};

export const completeSignIn = async (session: AuthSession): Promise<void> => {
  awaitSyncDecision();
  await beginSession(session);
};

export const signOutOfAccount = async (): Promise<void> => {
  await flushSync(SIGN_OUT_SYNC_WAIT_MS);
  stopSyncEngine();
  pauseSync();
  await signOutOfSession();
};

export const finishAccountDeletion = async (): Promise<void> => {
  stopSyncEngine();
  await forgetAccountSync();
  await endLocalSession("account-deleted");
};

/* The session is already gone on the server, so this only tidies up here and says why. */
export const endSessionFromElsewhere = async ({
  reason,
}: SessionEnded): Promise<void> => {
  if (reason === "account-deleted") await finishAccountDeletion();
  else {
    stopSyncEngine();
    pauseSync();
    await endLocalSession("signed-out");
  }
  useStore.getState().pushToast(ENDED_ELSEWHERE_MESSAGES[reason], "error");
};

export const refreshAccountFromServer = async (
  logoChanged: boolean,
): Promise<void> => {
  const { account } = await fetchAccountDetails();
  await rememberAccount(account);
  if (logoChanged) reloadChurchLogo(account.id);
};
