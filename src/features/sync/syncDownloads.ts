import {
  clearStore,
  deleteMatchingRecords,
  readAllRecords,
  readRecord,
  saveRecords,
  updateMatchingRecords,
} from "../../lib/storage";
import type { SyncFailure } from "./syncFailure";
import { notifySyncQueue } from "./syncQueueEvents";

export interface DownloadEntry {
  id: string;
  size: number;
  contentType: string;
  changedAt: string;
  failure?: SyncFailure;
}

const DOWNLOADS_STORE = "syncDownloads";
const UNTRACKED = { tracked: false } as const;

const isDownloadEntry = (entry: DownloadEntry | undefined): boolean =>
  entry !== undefined &&
  typeof entry.id === "string" &&
  typeof entry.size === "number" &&
  typeof entry.contentType === "string" &&
  typeof entry.changedAt === "string";

export const queueDownloads = async (
  entries: readonly DownloadEntry[],
): Promise<void> => {
  if (entries.length === 0) return;
  await saveRecords<DownloadEntry>(DOWNLOADS_STORE, [...entries], UNTRACKED);
  notifySyncQueue(true);
};

export const readDownloads = async (): Promise<DownloadEntry[]> =>
  (await readAllRecords<DownloadEntry>(DOWNLOADS_STORE)).filter(
    isDownloadEntry,
  );

export const readDownload = async (
  id: string,
): Promise<DownloadEntry | null> => {
  const entry = await readRecord<DownloadEntry>(DOWNLOADS_STORE, id);
  return entry && isDownloadEntry(entry) ? entry : null;
};

/* Matching the change time keeps a newer version of the file queued if it arrived while this one was downloading. */
export const finishDownload = async (entry: DownloadEntry): Promise<void> => {
  await deleteMatchingRecords<DownloadEntry>(
    DOWNLOADS_STORE,
    [entry.id],
    (record) => record.changedAt === entry.changedAt,
  );
  notifySyncQueue(false);
};

export const markDownloadFailed = async (
  entry: DownloadEntry,
  failure: SyncFailure,
): Promise<void> => {
  await updateMatchingRecords<DownloadEntry>(
    DOWNLOADS_STORE,
    [entry.id],
    (record) =>
      record.changedAt === entry.changedAt ? { ...record, failure } : null,
  );
  notifySyncQueue(false);
};

export const clearDownloadFailures = async (
  ids: readonly string[],
): Promise<void> => {
  if (ids.length === 0) return;
  await updateMatchingRecords<DownloadEntry>(
    DOWNLOADS_STORE,
    ids,
    ({ failure, ...entry }) => (failure ? entry : null),
  );
  notifySyncQueue(true);
};

export const removeDownloads = async (
  ids: readonly string[],
): Promise<void> => {
  if (ids.length === 0) return;
  await deleteMatchingRecords<DownloadEntry>(DOWNLOADS_STORE, ids, () => true);
  notifySyncQueue(false);
};

export const clearDownloads = async (): Promise<void> => {
  await clearStore(DOWNLOADS_STORE, UNTRACKED);
  notifySyncQueue(false);
};
