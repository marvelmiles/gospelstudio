import type { Account } from "@/contracts/accountContract";
import { requestSync } from "./syncEngine";
import {
  clearDownloadFailures,
  clearDownloads,
  removeDownloads,
} from "./syncDownloads";
import type { SyncItemRef } from "./syncItems";
import {
  clearEntryFailures,
  clearJournal,
  removeJournalEntries,
} from "./syncJournal";
import { askToContinueSync } from "./syncDecision";
import { countUnsyncedChanges, refreshSyncQueue } from "./syncQueueSummary";
import { queueLibraryIfNeeded } from "./syncScope";
import {
  readSyncSettings,
  updateSyncSettings,
  type SyncResumeReason,
  type SyncSettings,
} from "./syncSettings";
import { useSyncStore } from "./syncStore";
import { cancelTransfers } from "./syncTransfers";

let preparing: Promise<void> | null = null;

const linkedTo = (
  accountId: string,
  changes: Partial<SyncSettings>,
): SyncSettings => {
  const isSameAccount = readSyncSettings().accountId === accountId;
  if (!isSameAccount) void clearDownloads();
  return updateSyncSettings({
    ...(isSameAccount
      ? {}
      : {
          accountId,
          cursor: 0,
          lastSyncedAt: null,
          libraryQueued: false,
          pausedItems: [],
        }),
    awaitingDecision: false,
    pendingDecision: null,
    ...changes,
  });
};

export const awaitSyncDecision = (): void => {
  updateSyncSettings({ awaitingDecision: true });
};

const resumeReasonFor = (accountId: string): SyncResumeReason => {
  const settings = readSyncSettings();
  if (settings.pendingDecision) return settings.pendingDecision;
  const isJoining = settings.accountId !== accountId || !settings.libraryQueued;
  return isJoining ? "joining" : "signed-out";
};

const askOrLink = async (account: Account): Promise<void> => {
  const pendingCount = await countUnsyncedChanges(account.id);
  if (pendingCount === 0) {
    linkedTo(account.id, { enabled: true, libraryQueued: true });
    requestSync();
    return;
  }
  askToContinueSync(account.id, pendingCount, resumeReasonFor(account.id));
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
  await refreshSyncQueue();
};

/* Holds sync and lays out everything waiting, so the Sync activity page shows each item to pause or stop before sync resumes. */
export const manageSyncFirst = async (accountId: string): Promise<void> => {
  await keepSyncPaused(accountId);
  await queueLibraryIfNeeded();
  await refreshSyncQueue();
};

export const pauseSync = (): void => {
  updateSyncSettings({
    enabled: false,
    awaitingDecision: false,
    pendingDecision: null,
  });
};

const withoutKeys = (keys: Iterable<string>): string[] => {
  const removed = new Set(keys);
  return readSyncSettings().pausedItems.filter((key) => !removed.has(key));
};

export const pauseSyncItems = (items: readonly SyncItemRef[]): void => {
  const paused = new Set(readSyncSettings().pausedItems);
  for (const item of items) paused.add(item.key);
  updateSyncSettings({ pausedItems: [...paused] });
};

export const resumeSyncItems = (items: readonly SyncItemRef[]): void => {
  updateSyncSettings({ pausedItems: withoutKeys(items.map((i) => i.key)) });
  requestSync();
};

/* Resuming everything also turns sync back on, since a user who taps Resume all expects things to start moving. */
export const resumeAllSyncing = (accountId: string): void => {
  updateSyncSettings({ pausedItems: [] });
  turnOnSync(accountId);
};

const entryIdsOf = (
  items: readonly SyncItemRef[],
  direction: SyncItemRef["direction"],
): string[] =>
  items
    .filter((item) => item.direction === direction)
    .flatMap((item) => [...item.entryIds]);

export const retrySyncItems = async (
  items: readonly SyncItemRef[],
): Promise<void> => {
  await Promise.all([
    clearEntryFailures(entryIdsOf(items, "upload")),
    clearDownloadFailures(entryIdsOf(items, "download")),
  ]);
  requestSync();
};

/* Stopping drops the item from this device's queue: an upload's change stays on this device only, and a download is skipped here. */
export const stopSyncItems = async (
  items: readonly SyncItemRef[],
): Promise<void> => {
  const keys = new Set(items.map((item) => item.key));
  cancelTransfers(keys);
  await Promise.all([
    removeJournalEntries(entryIdsOf(items, "upload")),
    removeDownloads(entryIdsOf(items, "download")),
  ]);
  updateSyncSettings({ pausedItems: withoutKeys(keys) });
};

export const stopAllSyncing = async (): Promise<void> => {
  cancelTransfers("all");
  await Promise.all([clearJournal(), clearDownloads()]);
  updateSyncSettings({ pausedItems: [], libraryQueued: true });
  await refreshSyncQueue();
};

export const forgetAccountSync = async (): Promise<void> => {
  updateSyncSettings({
    accountId: null,
    enabled: false,
    cursor: 0,
    lastSyncedAt: null,
    libraryQueued: false,
    awaitingDecision: false,
    pendingDecision: null,
    offlineSince: null,
    pausedItems: [],
  });
  await Promise.all([clearJournal(), clearDownloads()]);
};
