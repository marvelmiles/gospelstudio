import { SYNC_FILE_STORE } from "@/contracts/syncContract";
import { getFileBlob, putFileBlob, thumbId } from "../../lib/fileStore";
import { ApiRequestError } from "../../lib/jsonApi";
import { announceFilesArrived, applyRemoteChanges } from "./applyRemoteChanges";
import { downloadFile, uploadFile, type ByteProgress } from "./syncApi";
import { overwrittenOnServer } from "./syncDecisions";
import {
  finishDownload,
  markDownloadFailed,
  readDownload,
  readDownloads,
  type DownloadEntry,
} from "./syncDownloads";
import type { SyncFailure } from "./syncFailure";
import { failureOrRethrow } from "./syncLaneErrors";
import { isReadyToTransfer, syncItemKeyOf } from "./syncItems";
import {
  acknowledgeEntries,
  markEntriesFailed,
  readJournalEntry,
  type JournalEntry,
} from "./syncJournal";
import { pendingJournal } from "./syncScope";
import { readSyncSettings } from "./syncSettings";
import { showSyncTransfer, type SyncTransfer } from "./syncStore";

const NOT_FOUND_STATUS = 404;
const STORAGE_FULL_STATUS = 507;
const PROGRESS_INTERVAL_MS = 250;
const THUMB_SUFFIX = thumbId("");
const UNTRACKED = { tracked: false } as const;

interface TransferOptions {
  deviceId: string;
  signal: AbortSignal;
}

type TransferOutcome =
  | { kind: "done" }
  | { kind: "cancelled" }
  | { kind: "failed"; failure: SyncFailure; error: unknown };

let activeTransfer: { key: string; controller: AbortController } | null = null;

export const cancelTransfers = (keys: ReadonlySet<string> | "all"): void => {
  if (!activeTransfer) return;
  if (keys === "all" || keys.has(activeTransfer.key))
    activeTransfer.controller.abort();
};

const isReady = (key: string, failure: SyncFailure | undefined): boolean =>
  isReadyToTransfer(
    key,
    failure,
    new Set(readSyncSettings().pausedItems),
    Date.now(),
  );

const throttledProgress = (transfer: SyncTransfer): ByteProgress => {
  let shownAtMs = 0;
  return (loadedBytes) => {
    const nowMs = Date.now();
    const isLast = loadedBytes === transfer.totalBytes;
    if (!isLast && nowMs - shownAtMs < PROGRESS_INTERVAL_MS) return;
    shownAtMs = nowMs;
    showSyncTransfer({ ...transfer, loadedBytes });
  };
};

/* Each file gets its own abort switch tied to the lane's, so pausing or stopping one item cancels only that transfer and the lane moves on. */
const runTransfer = async (
  transfer: SyncTransfer,
  laneSignal: AbortSignal,
  work: (signal: AbortSignal) => Promise<void>,
): Promise<TransferOutcome> => {
  const controller = new AbortController();
  const abortWithLane = (): void => controller.abort();
  laneSignal.addEventListener("abort", abortWithLane, { once: true });
  activeTransfer = { key: transfer.key, controller };
  showSyncTransfer(transfer);
  try {
    await work(controller.signal);
    return { kind: "done" };
  } catch (error) {
    if (laneSignal.aborted) throw error;
    if (controller.signal.aborted) return { kind: "cancelled" };
    return {
      kind: "failed",
      failure: failureOrRethrow(error, laneSignal),
      error,
    };
  } finally {
    laneSignal.removeEventListener("abort", abortWithLane);
    activeTransfer = null;
    showSyncTransfer(null);
  }
};

const isStorageFull = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.status === STORAGE_FULL_STATUS;

const thumbnailsFirst = (entries: readonly JournalEntry[]): JournalEntry[] =>
  [...entries].sort(
    (a, b) =>
      Number(!a.recordId.endsWith(THUMB_SUFFIX)) -
      Number(!b.recordId.endsWith(THUMB_SUFFIX)),
  );

const uploadEntry = async (
  queued: JournalEntry,
  { deviceId, signal }: TransferOptions,
): Promise<TransferOutcome | null> => {
  const entry = await readJournalEntry(queued.id);
  if (!entry) return null;
  const key = syncItemKeyOf(entry.store, entry.recordId);
  if (!isReady(key, entry.failure)) return null;
  const blob = await getFileBlob(entry.recordId);
  if (!blob) return null;

  const outcome = await runTransfer(
    { key, direction: "upload", loadedBytes: 0, totalBytes: blob.size },
    signal,
    async (transferSignal) => {
      const result = await uploadFile({
        fileId: entry.recordId,
        blob,
        deviceId,
        changedAt: entry.changedAt,
        signal: transferSignal,
      });
      await acknowledgeEntries([entry]);
      await applyRemoteChanges(overwrittenOnServer([result]), { deviceId });
    },
  );
  if (outcome.kind === "failed")
    await markEntriesFailed([entry], outcome.failure);
  return outcome;
};

const uploadFiles = async (options: TransferOptions): Promise<void> => {
  const queued = thumbnailsFirst(
    (await pendingJournal()).filter((entry) => entry.store === SYNC_FILE_STORE),
  );
  for (const [index, entry] of queued.entries()) {
    options.signal.throwIfAborted();
    const outcome = await uploadEntry(entry, options);
    if (outcome?.kind === "failed" && isStorageFull(outcome.error)) {
      await markEntriesFailed(queued.slice(index + 1), outcome.failure);
      return;
    }
  }
};

const downloadEntry = async (
  queued: DownloadEntry,
  { signal }: TransferOptions,
): Promise<void> => {
  const entry = await readDownload(queued.id);
  if (!entry) return;
  const key = syncItemKeyOf(SYNC_FILE_STORE, entry.id);
  if (!isReady(key, entry.failure)) return;
  const transfer: SyncTransfer = {
    key,
    direction: "download",
    loadedBytes: 0,
    totalBytes: entry.size,
  };

  const outcome = await runTransfer(
    transfer,
    signal,
    async (transferSignal) => {
      try {
        const blob = await downloadFile({
          fileId: entry.id,
          contentType: entry.contentType,
          signal: transferSignal,
          onProgress: throttledProgress(transfer),
        });
        await putFileBlob(entry.id, blob, UNTRACKED);
        await finishDownload(entry);
        await announceFilesArrived([entry.id]);
      } catch (error) {
        const removedSince =
          error instanceof ApiRequestError && error.status === NOT_FOUND_STATUS;
        if (!removedSince) throw error;
        await finishDownload(entry);
      }
    },
  );
  if (outcome.kind === "failed")
    await markDownloadFailed(entry, outcome.failure);
};

/* Smallest first, so previews and pictures appear before long videos finish. */
const downloadFiles = async (options: TransferOptions): Promise<void> => {
  const queued = (await readDownloads()).sort((a, b) => a.size - b.size);
  for (const entry of queued) {
    options.signal.throwIfAborted();
    await downloadEntry(entry, options);
  }
};

export const transferFiles = async (
  options: TransferOptions,
): Promise<void> => {
  await uploadFiles(options);
  await downloadFiles(options);
};
