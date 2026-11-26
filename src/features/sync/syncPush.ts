import {
  SYNC_FILE_STORE,
  type LocalChange,
  type PushResult,
  type RemoteChange,
  type SyncRecordStore,
} from "@/contracts/syncContract";
import { getFileBlob } from "../../lib/fileStore";
import { readRecord } from "../../lib/storage";
import { applyRemoteChanges } from "./applyRemoteChanges";
import { pushChanges, uploadFile } from "./syncApi";
import { planBatches, type PreparedChange } from "./syncDecisions";
import { acknowledgeEntries, type JournalEntry } from "./syncJournal";
import {
  isDeviceOnlyRecord,
  pendingJournal,
  type SyncedRecordShape,
} from "./syncScope";

const encoder = new TextEncoder();

interface PushOptions {
  deviceId: string;
  signal: AbortSignal;
  onActivity: (activity: string | null) => void;
}

export interface PushSummary {
  tooLarge: number;
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

const overwrittenOnServer = (results: readonly PushResult[]): RemoteChange[] =>
  results.flatMap((result) =>
    result.outcome === "superseded" && result.current ? [result.current] : [],
  );

const pushFiles = async (
  entries: readonly JournalEntry[],
  { deviceId, signal, onActivity }: PushOptions,
): Promise<PreparedChange[]> => {
  const removed: PreparedChange[] = [];
  for (const [index, entry] of entries.entries()) {
    signal.throwIfAborted();
    const blob = await getFileBlob(entry.recordId);
    if (!blob) {
      removed.push(deletionOf(entry));
      continue;
    }
    onActivity(`Uploading file ${index + 1} of ${entries.length}`);
    const result = await uploadFile({
      fileId: entry.recordId,
      blob,
      deviceId,
      changedAt: entry.changedAt,
      signal,
    });
    await acknowledgeEntries([entry]);
    await applyRemoteChanges(overwrittenOnServer([result]), {
      deviceId,
      signal,
      onActivity,
    });
  }
  return removed;
};

export const pushPendingChanges = async (
  options: PushOptions,
): Promise<PushSummary> => {
  const entries = await pendingJournal();
  if (entries.length === 0) return { tooLarge: 0 };
  const { deviceId, signal, onActivity } = options;

  const removedFiles = await pushFiles(
    entries.filter((entry) => !isRecordEntry(entry)),
    options,
  );

  const prepared: PreparedChange[] = [...removedFiles];
  const deviceOnly: JournalEntry[] = [];
  for (const entry of entries.filter(isRecordEntry)) {
    const change = await prepareRecordChange(entry);
    if (change) prepared.push(change);
    else deviceOnly.push(entry);
  }
  await acknowledgeEntries(deviceOnly);

  const { batches, tooLarge } = planBatches(prepared);
  for (const [index, batch] of batches.entries()) {
    signal.throwIfAborted();
    onActivity(
      batches.length > 1
        ? `Saving changes, part ${index + 1} of ${batches.length}`
        : "Saving changes",
    );
    const results = await pushChanges(deviceId, batch.changes, signal);
    await acknowledgeEntries(batch.entries);
    await applyRemoteChanges(overwrittenOnServer(results), {
      deviceId,
      signal,
      onActivity,
    });
  }
  return { tooLarge: tooLarge.length };
};
