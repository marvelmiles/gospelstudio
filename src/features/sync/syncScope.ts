import {
  SYNC_FILE_STORE,
  SYNC_RECORD_STORES,
  type SyncStore,
} from "@/contracts/syncContract";
import { deepEqual } from "../../lib/equality";
import { SYNCED_RECORD_SCHEMAS } from "../../lib/schema";
import { readAllKeys, readAllRecords, readRecord } from "../../lib/storage";
import { DEFAULT_PREFS } from "../../store/slices/prefsSlice";
import {
  acknowledgeEntries,
  addToJournal,
  journalKey,
  readJournal,
  type JournalEntry,
  type JournalInput,
} from "./syncJournal";
import { readSyncSettings, updateSyncSettings } from "./syncSettings";

export interface SyncedRecordShape {
  id: string;
  builtIn?: boolean;
  quick?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SEEDED_STORES = new Set<SyncStore>(["manuscripts", "themes"]);

/* Files never change under the same id, and some records carry no timestamps, so their first upload claims the oldest possible time: a copy already in the account, or a later delete there, wins. */
const BASELINE_CHANGED_AT = new Date(0).toISOString();

export const isDeviceOnlyRecord = (
  store: SyncStore,
  record: SyncedRecordShape,
): boolean => store === "scriptures" && record.quick === true;

const isUntouchedDefault = (
  store: SyncStore,
  record: SyncedRecordShape,
): boolean =>
  (SEEDED_STORES.has(store) && record.builtIn === true) ||
  (store === "productions" && record.createdAt === record.updatedAt);

const userPrefsOf = (prefs: unknown) =>
  SYNCED_RECORD_SCHEMAS.prefs.safeParse(prefs).data ?? null;

const hasCustomPrefs = (prefs: unknown): boolean =>
  !deepEqual(userPrefsOf(prefs), userPrefsOf(DEFAULT_PREFS));

const validTime = (value: string | undefined): string | undefined =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toISOString()
    : undefined;

const belongsInFirstUpload = (
  store: SyncStore,
  record: SyncedRecordShape,
): boolean => {
  if (isDeviceOnlyRecord(store, record) || isUntouchedDefault(store, record))
    return false;
  return store !== "prefs" || hasCustomPrefs(record);
};

const planLibraryUpload = async (): Promise<JournalInput[]> => {
  const planned: JournalInput[] = [];
  for (const store of SYNC_RECORD_STORES) {
    const records = await readAllRecords<SyncedRecordShape>(store);
    for (const record of records) {
      if (!belongsInFirstUpload(store, record)) continue;
      planned.push({
        store,
        recordId: record.id,
        changedAt:
          validTime(record.updatedAt) ??
          validTime(record.createdAt) ??
          BASELINE_CHANGED_AT,
      });
    }
  }
  for (const fileId of await readAllKeys(SYNC_FILE_STORE))
    planned.push({
      store: SYNC_FILE_STORE,
      recordId: fileId,
      changedAt: BASELINE_CHANGED_AT,
    });
  return planned;
};

const isDeviceOnlyEntry = async (entry: JournalEntry): Promise<boolean> => {
  if (entry.store !== "scriptures") return false;
  const record = await readRecord<SyncedRecordShape>(
    "scriptures",
    entry.recordId,
  );
  return record !== undefined && isDeviceOnlyRecord(entry.store, record);
};

export const pendingJournal = async (): Promise<JournalEntry[]> => {
  const entries = await readJournal();
  const deviceOnly: JournalEntry[] = [];
  for (const entry of entries)
    if (await isDeviceOnlyEntry(entry)) deviceOnly.push(entry);
  await acknowledgeEntries(deviceOnly);
  return entries.filter((entry) => !deviceOnly.includes(entry));
};

/* Runs inside a sync cycle rather than when sync is turned on, so closing the tab midway only delays it. Changes already queued keep their own times. */
export const queueLibraryIfNeeded = async (): Promise<void> => {
  if (readSyncSettings().libraryQueued) return;
  const queued = new Set((await readJournal()).map((entry) => entry.id));
  const plan = await planLibraryUpload();
  await addToJournal(
    plan.filter(
      (input) => !queued.has(journalKey(input.store, input.recordId)),
    ),
  );
  updateSyncSettings({ libraryQueued: true });
};

export const countLibraryUpload = async (
  journal: readonly JournalEntry[],
): Promise<number> => {
  const keys = new Set(journal.map((entry) => entry.id));
  for (const input of await planLibraryUpload())
    keys.add(journalKey(input.store, input.recordId));
  return keys.size;
};
