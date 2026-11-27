import { signedInAccount } from "../account/session/authStore";
import { readDownloads } from "./syncDownloads";
import { syncItemKeyOf } from "./syncItems";
import { summarizeQueue } from "./syncQueueCounts";
import { countLibraryUpload, pendingJournal } from "./syncScope";
import { readSyncSettings } from "./syncSettings";
import { EMPTY_SYNC_QUEUE, useSyncStore } from "./syncStore";

const isLibraryQueuedFor = (accountId: string): boolean => {
  const settings = readSyncSettings();
  return settings.accountId === accountId && settings.libraryQueued;
};

export const countUnsyncedChanges = async (
  accountId: string,
): Promise<number> => {
  const journal = await pendingJournal();
  return isLibraryQueuedFor(accountId)
    ? new Set(
        journal.map((entry) => syncItemKeyOf(entry.store, entry.recordId)),
      ).size
    : countLibraryUpload(journal);
};

export const refreshSyncQueue = async (): Promise<void> => {
  const account = signedInAccount();
  if (!account) {
    useSyncStore.setState({ queue: EMPTY_SYNC_QUEUE });
    return;
  }
  const [uploads, downloads] = await Promise.all([
    pendingJournal(),
    readDownloads(),
  ]);
  const queue = summarizeQueue({
    uploads,
    downloads,
    pausedItems: readSyncSettings().pausedItems,
    nowMs: Date.now(),
  });
  useSyncStore.setState({
    queue: isLibraryQueuedFor(account.id)
      ? queue
      : { ...queue, uploads: await countLibraryUpload(uploads) },
  });
};
