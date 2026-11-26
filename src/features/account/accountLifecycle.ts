import type { AuthSession } from "@/contracts/authContract";
import { flushSync, stopSyncEngine } from "../sync/syncEngine";
import {
  awaitSyncDecision,
  forgetAccountSync,
  pauseSync,
} from "../sync/syncControls";
import {
  beginSession,
  endLocalSession,
  signOutOfSession,
} from "./session/sessionManager";

const SIGN_OUT_SYNC_WAIT_MS = 8000;

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
