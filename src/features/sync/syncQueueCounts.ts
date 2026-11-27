import type { DownloadEntry } from "./syncDownloads";
import { isFailureActive, type SyncFailure } from "./syncFailure";
import { syncItemKeyOf } from "./syncItems";
import type { JournalEntry } from "./syncJournal";
import type { SyncQueueSummary } from "./syncStore";

interface QueuedItem {
  key: string;
  failure?: SyncFailure;
}

interface QueueSnapshot {
  uploads: readonly JournalEntry[];
  downloads: readonly DownloadEntry[];
  pausedItems: readonly string[];
  nowMs: number;
}

const failedByItem = (
  items: readonly QueuedItem[],
  nowMs: number,
): Map<string, boolean> => {
  const failed = new Map<string, boolean>();
  for (const { key, failure } of items)
    failed.set(
      key,
      (failed.get(key) ?? false) || isFailureActive(failure, nowMs),
    );
  return failed;
};

/* Counts what the user sees as items, so a video's details, file and preview count once, and a paused item never also counts as failed. */
export const summarizeQueue = ({
  uploads,
  downloads,
  pausedItems,
  nowMs,
}: QueueSnapshot): SyncQueueSummary => {
  const paused = new Set(pausedItems);
  const uploadItems = failedByItem(
    uploads.map((entry) => ({
      key: syncItemKeyOf(entry.store, entry.recordId),
      failure: entry.failure,
    })),
    nowMs,
  );
  const downloadItems = failedByItem(
    downloads.map((entry) => ({
      key: syncItemKeyOf("files", entry.id),
      failure: entry.failure,
    })),
    nowMs,
  );
  let pausedCount = 0;
  let failedCount = 0;
  for (const items of [uploadItems, downloadItems])
    for (const [key, hasFailed] of items) {
      if (paused.has(key)) pausedCount += 1;
      else if (hasFailed) failedCount += 1;
    }
  return {
    uploads: uploadItems.size,
    downloads: downloadItems.size,
    paused: pausedCount,
    failed: failedCount,
  };
};
