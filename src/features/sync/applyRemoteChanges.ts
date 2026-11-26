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
import { deleteFileBlob, getFileBlob, putFileBlob } from "../../lib/fileStore";
import { ApiRequestError } from "../../lib/jsonApi";
import { deleteRecord, readRecord, saveRecord } from "../../lib/storage";
import { LIBRARY_RECORD_STORES, prefsFrom } from "../../store/libraryState";
import { useStore } from "../../store/useStore";
import { refreshStudioRecords } from "../studio/store/productionActions";
import { announceToOtherTabs } from "../account/session/accountChannel";
import { downloadFile } from "./syncApi";
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
const NOT_FOUND_STATUS = 404;

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

const applyFile = async (
  change: RemoteChange,
  applied: AppliedChanges,
  signal: AbortSignal,
): Promise<void> => {
  const { recordId } = change;
  if (change.deleted) {
    await deleteFileBlob(recordId, UNTRACKED);
    markApplied(applied, SYNC_FILE_STORE, recordId);
    return;
  }
  const metadata = fileMetadataSchema.safeParse(change.data);
  if (!metadata.success) return;
  const local = await getFileBlob(recordId);
  if (local && local.size === metadata.data.size) return;
  try {
    const blob = await downloadFile(
      recordId,
      metadata.data.contentType,
      signal,
    );
    await putFileBlob(recordId, blob, UNTRACKED);
    markApplied(applied, SYNC_FILE_STORE, recordId);
  } catch (error) {
    const removedSince =
      error instanceof ApiRequestError && error.status === NOT_FOUND_STATUS;
    if (!removedSince) throw error;
  }
};

const fileSizeOf = (change: RemoteChange): number => {
  const metadata = fileMetadataSchema.safeParse(change.data);
  return metadata.success ? metadata.data.size : 0;
};

const isRecordChange = (
  change: RemoteChange,
): change is RemoteChange & { store: SyncRecordStore } =>
  change.store !== SYNC_FILE_STORE;

interface ApplyOptions {
  deviceId: string;
  signal: AbortSignal;
  onActivity: (activity: string | null) => void;
}

/* Records land and show first; files follow smallest first so thumbnails appear before large videos finish downloading. */
export const applyRemoteChanges = async (
  changes: readonly RemoteChange[],
  { deviceId, signal, onActivity }: ApplyOptions,
): Promise<void> => {
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

  const files = accepted
    .filter((change) => !isRecordChange(change))
    .sort((a, b) => fileSizeOf(a) - fileSizeOf(b));
  const filesApplied = emptyChanges();
  for (const [index, change] of files.entries()) {
    signal.throwIfAborted();
    onActivity(`Downloading file ${index + 1} of ${files.length}`);
    await applyFile(change, filesApplied, signal);
  }
  await publish(filesApplied);
};
