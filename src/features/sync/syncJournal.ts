import { SYNC_STORES, type SyncStore } from "@/contracts/syncContract";
import { now } from "../../lib/id";
import {
  clearStore,
  deleteMatchingRecords,
  onRecordsChanged,
  readAllRecords,
  saveRecords,
  type RecordChange,
} from "../../lib/storage";

export interface JournalEntry {
  id: string;
  store: SyncStore;
  recordId: string;
  changedAt: string;
}

export interface JournalInput {
  store: SyncStore;
  recordId: string;
  changedAt?: string;
}

export type JournalEvent = "added" | "removed";

const SYNC_STORE_NAMES = new Set<string>(SYNC_STORES);
const UNTRACKED = { tracked: false } as const;
const listeners = new Set<(event: JournalEvent) => void>();

const isSyncStore = (store: string): store is SyncStore =>
  SYNC_STORE_NAMES.has(store);

export const journalKey = (store: SyncStore, recordId: string): string =>
  `${store}/${recordId}`;

const notify = (event: JournalEvent): void => {
  for (const listener of listeners) listener(event);
};

export const subscribeJournal = (
  listener: (event: JournalEvent) => void,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const addToJournal = async (
  inputs: readonly JournalInput[],
): Promise<void> => {
  if (inputs.length === 0) return;
  const changedAt = now();
  await saveRecords<JournalEntry>(
    "syncChanges",
    inputs.map((input) => ({
      id: journalKey(input.store, input.recordId),
      store: input.store,
      recordId: input.recordId,
      changedAt: input.changedAt ?? changedAt,
    })),
    UNTRACKED,
  );
  notify("added");
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

const isJournalEntry = (entry: JournalEntry): boolean =>
  isSyncStore(entry.store) &&
  typeof entry.recordId === "string" &&
  typeof entry.changedAt === "string";

export const readJournal = async (): Promise<JournalEntry[]> =>
  (await readAllRecords<JournalEntry>("syncChanges"))
    .filter(isJournalEntry)
    .sort((a, b) => a.changedAt.localeCompare(b.changedAt));

/* Only entries that still hold the pushed change time are removed, so an edit made while a push was in flight stays queued. */
export const acknowledgeEntries = async (
  entries: readonly JournalEntry[],
): Promise<void> => {
  if (entries.length === 0) return;
  const pushedAt = new Map(entries.map((entry) => [entry.id, entry.changedAt]));
  await deleteMatchingRecords<JournalEntry>(
    "syncChanges",
    [...pushedAt.keys()],
    (record) => record.changedAt === pushedAt.get(record.id),
  );
  notify("removed");
};

export const clearJournal = async (): Promise<void> => {
  await clearStore("syncChanges", UNTRACKED);
  notify("removed");
};
