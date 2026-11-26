import type { Account } from "@/contracts/accountContract";
import { requestSync } from "./syncEngine";
import { clearJournal } from "./syncJournal";
import { countUnsyncedChanges, refreshPendingCount } from "./syncPending";
import {
  readSyncSettings,
  updateSyncSettings,
  type SyncSettings,
} from "./syncSettings";
import { useSyncStore } from "./syncStore";

let preparing: Promise<void> | null = null;

const linkedTo = (
  accountId: string,
  changes: Partial<SyncSettings>,
): SyncSettings => {
  const isSameAccount = readSyncSettings().accountId === accountId;
  return updateSyncSettings({
    ...(isSameAccount
      ? {}
      : { accountId, cursor: 0, lastSyncedAt: null, libraryQueued: false }),
    awaitingDecision: false,
    ...changes,
  });
};

export const awaitSyncDecision = (): void => {
  updateSyncSettings({ awaitingDecision: true });
};

const askOrLink = async (account: Account): Promise<void> => {
  const settings = readSyncSettings();
  const pendingCount = await countUnsyncedChanges(account.id);
  if (pendingCount === 0) {
    linkedTo(account.id, { enabled: true, libraryQueued: true });
    requestSync();
    return;
  }
  useSyncStore.setState({
    consent: {
      accountId: account.id,
      pendingCount,
      joiningAccount:
        settings.accountId !== account.id || !settings.libraryQueued,
    },
  });
};

/* The decision is stored until it is made, so a reload or closed tab after signing in asks again instead of leaving sync off without a word. */
export const prepareSyncForAccount = (account: Account): Promise<void> => {
  preparing ??= askOrLink(account).finally(() => {
    preparing = null;
  });
  return preparing;
};

export const turnOnSync = (accountId: string): void => {
  linkedTo(accountId, { enabled: true });
  useSyncStore.setState({ consent: null });
  requestSync();
};

export const keepSyncPaused = async (accountId: string): Promise<void> => {
  linkedTo(accountId, { enabled: false });
  useSyncStore.setState({ consent: null, phase: "paused" });
  await refreshPendingCount();
};

export const pauseSync = (): void => {
  updateSyncSettings({ enabled: false, awaitingDecision: false });
};

export const forgetAccountSync = async (): Promise<void> => {
  updateSyncSettings({
    accountId: null,
    enabled: false,
    cursor: 0,
    lastSyncedAt: null,
    libraryQueued: false,
    awaitingDecision: false,
  });
  await clearJournal();
};
