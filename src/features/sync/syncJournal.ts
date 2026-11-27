import { SYNC_STORES, type SyncStore } from "@/contracts/syncContract";
import {
  clearStore,
  deleteMatchingRecords,
  onRecordsChanged,
  readAllRecords,
  readRecord,
  saveRecords,
  updateMatchingRecords,
  type RecordChange,
} from "../../lib/storage";
import { syncNow } from "./syncClock";
import type { SyncFailure } from "./syncFailure";
import { notifySyncQueue } from "./syncQueueEvents";

export interface JournalEntry {
  id: string;
  store: SyncStore;
  recordId: string;
  changedAt: string;
  failure?: SyncFailure;
}

export interface JournalInput {
  store: SyncStore;
  recordId: string;
  changedAt?: string;
}

const JOURNAL_STORE = "syncChanges";
const SYNC_STORE_NAMES = new Set<string>(SYNC_STORES);
const UNTRACKED = { tracked: false } as const;

const isSyncStore = (store: string): store is SyncStore =>
  SYNC_STORE_NAMES.has(store);

export const journalKey = (store: SyncStore, recordId: string): string =>
  `${store}/${recordId}`;

/* A new change replaces the entry whole, which also clears any earlier failure so the edit gets a fresh try. */
export const addToJournal = async (
  inputs: readonly JournalInput[],
): Promise<void> => {
  if (inputs.length === 0) return;
  const changedAt = syncNow();
  await saveRecords<JournalEntry>(
    JOURNAL_STORE,
    inputs.map((input) => ({
      id: journalKey(input.store, input.recordId),
      store: input.store,
      recordId: input.recordId,
      changedAt: input.changedAt ?? changedAt,
    })),
    UNTRACKED,
  );
  notifySyncQueue(true);
};

const recordLocalChange = async ({
  store,
  ids,
}: RecordChange): Promise<void> => {
  if (!isSyncStore(store)) return;
  await addToJournal(ids.map((recordId) => ({ store, recordId })));
};

export const startChangeJournal = (): void =>
  onRecordsChanged(recordLocalChange);

const isJournalEntry = (entry: JournalEntry | undefined): boolean =>
  entry !== undefined &&
  isSyncStore(entry.store) &&
  typeof entry.recordId === "string" &&
  typeof entry.changedAt === "string";

export const readJournal = async (): Promise<JournalEntry[]> =>
  (await readAllRecords<JournalEntry>(JOURNAL_STORE))
    .filter(isJournalEntry)
    .sort((a, b) => a.changedAt.localeCompare(b.changedAt));

export const readJournalEntry = async (
  id: string,
): Promise<JournalEntry | null> => {
  const entry = await readRecord<JournalEntry>(JOURNAL_STORE, id);
  return entry && isJournalEntry(entry) ? entry : null;
};

const changedAtById = (entries: readonly JournalEntry[]): Map<string, string> =>
  new Map(entries.map((entry) => [entry.id, entry.changedAt]));

/* Only entries that still hold the pushed change time are removed, so an edit made while a push was in flight stays queued. */
export const acknowledgeEntries = async (
  entries: readonly JournalEntry[],
): Promise<void> => {
  if (entries.length === 0) return;
  const pushedAt = changedAtById(entries);
  await deleteMatchingRecords<JournalEntry>(
    JOURNAL_STORE,
    [...pushedAt.keys()],
    (record) => record.changedAt === pushedAt.get(record.id),
  );
  notifySyncQueue(false);
};

export const markEntriesFailed = async (
  entries: readonly JournalEntry[],
  failure: SyncFailure,
): Promise<void> => {
  if (entries.length === 0) return;
  const triedAt = changedAtById(entries);
  await updateMatchingRecords<JournalEntry>(
    JOURNAL_STORE,
    [...triedAt.keys()],
    (record) =>
      record.changedAt === triedAt.get(record.id)
        ? { ...record, failure }
        : null,
  );
  notifySyncQueue(false);
};

export const clearEntryFailures = async (
  ids: readonly string[],
): Promise<void> => {
  if (ids.length === 0) return;
  await updateMatchingRecords<JournalEntry>(
    JOURNAL_STORE,
    ids,
    ({ failure, ...entry }) => (failure ? entry : null),
  );
  notifySyncQueue(true);
};

export const removeJournalEntries = async (
  ids: readonly string[],
): Promise<void> => {
  if (ids.length === 0) return;
  await deleteMatchingRecords<JournalEntry>(JOURNAL_STORE, ids, () => true);
  notifySyncQueue(false);
};

export const clearJournal = async (): Promise<void> => {
  await clearStore(JOURNAL_STORE, UNTRACKED);
  notifySyncQueue(false);
};
