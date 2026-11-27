import { SYNC_FILE_STORE, type SyncStore } from "@/contracts/syncContract";
import { thumbId } from "../../lib/fileStore";
import { isFailureActive, type SyncFailure } from "./syncFailure";

export type SyncDirection = "upload" | "download";

export interface SyncItemRef {
  direction: SyncDirection;
  key: string;
  entryIds: readonly string[];
}

const THUMB_SUFFIX = thumbId("");
const FILE_OWNER_STORES: ReadonlySet<SyncStore> = new Set([
  "media",
  "backgrounds",
  "audio",
]);

export const baseFileId = (fileId: string): string =>
  fileId.endsWith(THUMB_SUFFIX)
    ? fileId.slice(0, -THUMB_SUFFIX.length)
    : fileId;

/* A picture, video or sound syncs as its details plus its file and preview, so all three share one key and are paused or stopped together. */
export const syncItemKeyOf = (store: SyncStore, recordId: string): string => {
  if (store === SYNC_FILE_STORE) return `item:${baseFileId(recordId)}`;
  if (FILE_OWNER_STORES.has(store)) return `item:${recordId}`;
  return `${store}:${recordId}`;
};

export const isReadyToTransfer = (
  key: string,
  failure: SyncFailure | undefined,
  pausedItems: ReadonlySet<string>,
  nowMs: number,
): boolean => !pausedItems.has(key) && !isFailureActive(failure, nowMs);
