import {
  SYNC_FILE_STORE,
  fileMetadataSchema,
  type RemoteChange,
  type SyncRecordStore,
  type SyncStore,
} from "@/contracts/syncContract";
import type { Prefs } from "../../types";
import { invalidateBlobUrls } from "../../lib/blobUrls";
import { deepEqual } from "../../lib/equality";
import { deleteFileBlob, getFileBlob } from "../../lib/fileStore";
import { deleteRecord, readRecord, saveRecord } from "../../lib/storage";
import { LIBRARY_RECORD_STORES, prefsFrom } from "../../store/libraryState";
import { useStore } from "../../store/useStore";
import { refreshStudioRecords } from "../studio/store/productionActions";
import { announceToOtherTabs } from "../account/session/accountChannel";
import {
  queueDownloads,
  removeDownloads,
  type DownloadEntry,
} from "./syncDownloads";
import { shouldApplyRemote } from "./syncDecisions";
import {
  acknowledgeEntries,
  journalKey,
  readJournal,
  type JournalEntry,
} from "./syncJournal";
import {
  mergeRemotePrefs,
  parseRemoteRecord,
  type StoredRecord,
} from "./remoteRecords";

const UNTRACKED = { tracked: false } as const;

interface AppliedChanges {
  stores: Set<SyncStore>;
  productionIds: Set<string>;
  layoutIds: Set<string>;
  fileIds: Set<string>;
}

export interface LibraryChange {
  stores: string[];
  productionIds: string[];
  layoutIds: string[];
  fileIds: string[];
}

const emptyChanges = (): AppliedChanges => ({
  stores: new Set(),
  productionIds: new Set(),
  layoutIds: new Set(),
  fileIds: new Set(),
});

const markApplied = (
  applied: AppliedChanges,
  store: SyncStore,
  recordId: string,
): void => {
  applied.stores.add(store);
  if (store === "productions") applied.productionIds.add(recordId);
  if (store === "sceneLayouts") applied.layoutIds.add(recordId);
  if (store === SYNC_FILE_STORE) applied.fileIds.add(recordId);
};

const toLibraryChange = (applied: AppliedChanges): LibraryChange => ({
  stores: [...applied.stores],
  productionIds: [...applied.productionIds],
  layoutIds: [...applied.layoutIds],
  fileIds: [...applied.fileIds],
});

export const refreshAppAfterSync = async (
  change: LibraryChange,
): Promise<void> => {
  const changedStores = new Set(change.stores);
  const libraryStores = LIBRARY_RECORD_STORES.filter((store) =>
    changedStores.has(store),
  );
  await useStore.getState().reloadLibrary(libraryStores);
  if (change.productionIds.length > 0 || change.layoutIds.length > 0)
    await refreshStudioRecords({
      productionIds: change.productionIds,
      layoutIds: change.layoutIds,
    });
  if (change.fileIds.length > 0) invalidateBlobUrls(change.fileIds);
};

const publish = async (applied: AppliedChanges): Promise<void> => {
  if (applied.stores.size === 0) return;
  const change = toLibraryChange(applied);
  await refreshAppAfterSync(change);
  announceToOtherTabs({ type: "library-changed", ...change });
};

export const announceFilesArrived = (fileIds: readonly string[]) => {
  const applied = emptyChanges();
  for (const fileId of fileIds) markApplied(applied, SYNC_FILE_STORE, fileId);
  return publish(applied);
};

const incomingRecord = async (
  store: SyncRecordStore,
  data: unknown,
): Promise<StoredRecord | null> => {
  if (store !== "prefs") return parseRemoteRecord(store, data);
  const local = prefsFrom(await readRecord<Prefs>("prefs", "app"));
  return mergeRemotePrefs(local, data);
};

const applyRecord = async (
  change: RemoteChange & { store: SyncRecordStore },
  applied: AppliedChanges,
): Promise<void> => {
  const { store, recordId } = change;
  if (change.deleted || !change.data) {
    if (store === "prefs") return;
    await deleteRecord(store, recordId, UNTRACKED);
    markApplied(applied, store, recordId);
    return;
  }
  const record = await incomingRecord(store, change.data);
  if (!record || record.id !== recordId) return;
  if (deepEqual(await readRecord(store, recordId), record)) return;
  await saveRecord(store, record, UNTRACKED);
  markApplied(applied, store, recordId);
};

interface FilePlan {
  removedIds: string[];
  settledIds: string[];
  downloads: DownloadEntry[];
}

/* Files are only queued here so the cursor can move on at once: a large or failing download then never holds back the rest of the account's changes. */
const planFiles = async (
  changes: readonly RemoteChange[],
): Promise<FilePlan> => {
  const plan: FilePlan = { removedIds: [], settledIds: [], downloads: [] };
  for (const change of changes) {
    if (change.deleted) {
      plan.removedIds.push(change.recordId);
      continue;
    }
    const metadata = fileMetadataSchema.safeParse(change.data);
    if (!metadata.success) continue;
    const local = await getFileBlob(change.recordId);
    if (local && local.size === metadata.data.size)
      plan.settledIds.push(change.recordId);
    else
      plan.downloads.push({
        id: change.recordId,
        size: metadata.data.size,
        contentType: metadata.data.contentType,
        changedAt: change.changedAt,
      });
  }
  return plan;
};

const applyFiles = async (changes: readonly RemoteChange[]): Promise<void> => {
  if (changes.length === 0) return;
  const plan = await planFiles(changes);
  const removed = emptyChanges();
  for (const fileId of plan.removedIds) {
    await deleteFileBlob(fileId, UNTRACKED);
    markApplied(removed, SYNC_FILE_STORE, fileId);
  }
  await removeDownloads([...plan.removedIds, ...plan.settledIds]);
  await queueDownloads(plan.downloads);
  await publish(removed);
};

const isRecordChange = (
  change: RemoteChange,
): change is RemoteChange & { store: SyncRecordStore } =>
  change.store !== SYNC_FILE_STORE;

interface ApplyOptions {
  deviceId: string;
}

export const applyRemoteChanges = async (
  changes: readonly RemoteChange[],
  { deviceId }: ApplyOptions,
): Promise<void> => {
  if (changes.length === 0) return;
  const pending = new Map(
    (await readJournal()).map((entry) => [entry.id, entry]),
  );
  const accepted = changes.filter((change) =>
    shouldApplyRemote(
      change,
      pending.get(journalKey(change.store, change.recordId)),
      deviceId,
    ),
  );
  const overtaken = accepted.flatMap((change): JournalEntry[] => {
    const entry = pending.get(journalKey(change.store, change.recordId));
    return entry ? [entry] : [];
  });
  await acknowledgeEntries(overtaken);

  const recordsApplied = emptyChanges();
  for (const change of accepted.filter(isRecordChange))
    await applyRecord(change, recordsApplied);
  await publish(recordsApplied);

  await applyFiles(accepted.filter((change) => !isRecordChange(change)));
};
