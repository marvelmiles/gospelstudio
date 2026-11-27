import { updateSyncSettings, type SyncResumeReason } from "./syncSettings";
import { useSyncStore } from "./syncStore";

/* Holds sync and asks first. The reason is stored too, so a reload while the question is open asks the same question again. */
export const askToContinueSync = (
  accountId: string,
  pendingCount: number,
  reason: SyncResumeReason,
): void => {
  updateSyncSettings({ awaitingDecision: true, pendingDecision: reason });
  useSyncStore.setState({ consent: { accountId, pendingCount, reason } });
};
