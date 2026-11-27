import {
  MAX_RECORD_BYTES,
  SYNC_FILE_STORE,
  localChangeSchema,
  type LocalChange,
  type PushResult,
  type SyncRecordStore,
} from "@/contracts/syncContract";
import { formatBytes } from "../../lib/storageStats";
import { readAllKeys, readRecord } from "../../lib/storage";
import { applyRemoteChanges } from "./applyRemoteChanges";
import { pushChanges } from "./syncApi";
import {
  overwrittenOnServer,
  planBatches,
  type PreparedChange,
  type PushBatch,
} from "./syncDecisions";
import { permanentFailure } from "./syncFailure";
import { failureOrRethrow } from "./syncLaneErrors";
import { isReadyToTransfer, syncItemKeyOf } from "./syncItems";
import {
  acknowledgeEntries,
  markEntriesFailed,
  type JournalEntry,
} from "./syncJournal";
import {
  isDeviceOnlyRecord,
  pendingJournal,
  type SyncedRecordShape,
} from "./syncScope";
import { readSyncSettings } from "./syncSettings";

const encoder = new TextEncoder();

const TOO_LARGE_MESSAGE = `This item is larger than ${formatBytes(MAX_RECORD_BYTES)}, so it can't sync and stays on this device.`;
const UNREADABLE_MESSAGE =
  "This item has information sync can't read, so it stays on this device.";

interface PushOptions {
  deviceId: string;
  signal: AbortSignal;
  onActivity: (activity: string | null) => void;
}

const deletionOf = (entry: JournalEntry): PreparedChange => ({
  entry,
  change: {
    operation: "delete",
    store: entry.store,
    recordId: entry.recordId,
    changedAt: entry.changedAt,
  },
  bytes: 0,
});

type RecordEntry = JournalEntry & { store: SyncRecordStore };

const isRecordEntry = (entry: JournalEntry): entry is RecordEntry =>
  entry.store !== SYNC_FILE_STORE;

const prepareRecordChange = async (
  entry: RecordEntry,
): Promise<PreparedChange | null> => {
  const record = await readRecord<SyncedRecordShape>(
    entry.store,
    entry.recordId,
  );
  if (!record) return deletionOf(entry);
  if (isDeviceOnlyRecord(entry.store, record)) return null;
  const json = JSON.stringify(record);
  const change: LocalChange = {
    operation: "put",
    store: entry.store,
    recordId: entry.recordId,
    changedAt: entry.changedAt,
    data: JSON.parse(json) as Record<string, unknown>,
  };
  return { entry, change, bytes: encoder.encode(json).length };
};

const readyEntries = async (nowMs: number): Promise<JournalEntry[]> => {
  const paused = new Set(readSyncSettings().pausedItems);
  return (await pendingJournal()).filter((entry) =>
    isReadyToTransfer(
      syncItemKeyOf(entry.store, entry.recordId),
      entry.failure,
      paused,
      nowMs,
    ),
  );
};

/* A batch the server refuses as malformed is split so the one bad record is set aside and the rest still sync; a server outage fails the batch as a whole instead of retrying each change. */
const pushBatch = async (
  batch: PushBatch,
  options: PushOptions,
): Promise<void> => {
  const { deviceId, signal } = options;
  let results: PushResult[];
  try {
    results = await pushChanges(deviceId, batch.changes, signal);
  } catch (error) {
    const failure = failureOrRethrow(error, signal);
    const canSplit = batch.changes.length > 1 && failure.retryAt === null;
    if (!canSplit) {
      await markEntriesFailed(batch.entries, failure);
      return;
    }
    for (const [index, change] of batch.changes.entries()) {
      const entry = batch.entries[index];
      if (entry)
        await pushBatch({ entries: [entry], changes: [change] }, options);
    }
    return;
  }
  await acknowledgeEntries(batch.entries);
  await applyRemoteChanges(overwrittenOnServer(results), { deviceId });
};

/* Records and deletions only: file contents travel in the separate files lane so a large upload never holds back an edit. */
export const pushRecordChanges = async (
  options: PushOptions,
): Promise<void> => {
  const { signal, onActivity } = options;
  const nowMs = Date.now();
  const entries = await readyEntries(nowMs);
  if (entries.length === 0) return;

  const storedFileIds = new Set(
    entries.some((entry) => !isRecordEntry(entry))
      ? await readAllKeys(SYNC_FILE_STORE)
      : [],
  );
  const prepared: PreparedChange[] = [];
  const deviceOnly: JournalEntry[] = [];
  const unreadable: JournalEntry[] = [];
  for (const entry of entries) {
    if (!isRecordEntry(entry)) {
      if (!storedFileIds.has(entry.recordId)) prepared.push(deletionOf(entry));
      continue;
    }
    const change = await prepareRecordChange(entry);
    if (!change) deviceOnly.push(entry);
    else if (localChangeSchema.safeParse(change.change).success)
      prepared.push(change);
    else unreadable.push(entry);
  }
  await acknowledgeEntries(deviceOnly);
  await markEntriesFailed(
    unreadable,
    permanentFailure(UNREADABLE_MESSAGE, nowMs),
  );

  const { batches, tooLarge } = planBatches(prepared);
  await markEntriesFailed(tooLarge, permanentFailure(TOO_LARGE_MESSAGE, nowMs));
  for (const [index, batch] of batches.entries()) {
    signal.throwIfAborted();
    onActivity(
      batches.length > 1
        ? `Saving changes, part ${index + 1} of ${batches.length}`
        : "Saving changes",
    );
    await pushBatch(batch, options);
  }
};
