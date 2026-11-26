import {
  MAX_PUSH_BYTES,
  MAX_PUSH_CHANGES,
  MAX_RECORD_BYTES,
  type LocalChange,
  type RemoteChange,
} from "@/contracts/syncContract";
import type { JournalEntry } from "./syncJournal";

const CHANGE_ENVELOPE_BYTES = 256;

export interface PreparedChange {
  entry: JournalEntry;
  change: LocalChange;
  bytes: number;
}

interface PushBatch {
  entries: JournalEntry[];
  changes: LocalChange[];
}

export interface BatchPlan {
  batches: PushBatch[];
  tooLarge: JournalEntry[];
}

export const shouldApplyRemote = (
  change: RemoteChange,
  pending: JournalEntry | undefined,
  deviceId: string,
): boolean => {
  if (change.deviceId === deviceId) return false;
  return (
    !pending || Date.parse(pending.changedAt) <= Date.parse(change.changedAt)
  );
};

export const planBatches = (prepared: readonly PreparedChange[]): BatchPlan => {
  const batches: PushBatch[] = [];
  const tooLarge: JournalEntry[] = [];
  let current: PushBatch = { entries: [], changes: [] };
  let currentBytes = 0;

  for (const { entry, change, bytes } of prepared) {
    if (bytes > MAX_RECORD_BYTES) {
      tooLarge.push(entry);
      continue;
    }
    const size = bytes + CHANGE_ENVELOPE_BYTES;
    const isFull =
      current.changes.length >= MAX_PUSH_CHANGES ||
      currentBytes + size > MAX_PUSH_BYTES;
    if (isFull && current.changes.length > 0) {
      batches.push(current);
      current = { entries: [], changes: [] };
      currentBytes = 0;
    }
    current.entries.push(entry);
    current.changes.push(change);
    currentBytes += size;
  }
  if (current.changes.length > 0) batches.push(current);
  return { batches, tooLarge };
};

const MIN_RETRY_MS = 5_000;
const MAX_RETRY_MS = 5 * 60 * 1000;

export const retryDelayAfter = (failures: number): number =>
  Math.min(MAX_RETRY_MS, MIN_RETRY_MS * 2 ** Math.max(0, failures - 1));
