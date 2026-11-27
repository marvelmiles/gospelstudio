import { SYNC_FILE_STORE, type SyncStore } from "@/contracts/syncContract";
import type {
  AudioItem,
  Background,
  MediaItem,
  SlideDeckDoc,
  Theme,
} from "../../types";
import type { DownloadEntry } from "./syncDownloads";
import { isFailureActive, type SyncFailure } from "./syncFailure";
import {
  baseFileId,
  syncItemKeyOf,
  type SyncDirection,
  type SyncItemRef,
} from "./syncItems";
import { journalKey, type JournalEntry } from "./syncJournal";

export type SyncItemKind =
  | "manuscript"
  | "scripture"
  | "media"
  | "image"
  | "video"
  | "sound"
  | "background"
  | "theme"
  | "production"
  | "layout"
  | "settings"
  | "file";

type SyncItemStatus = "active" | "failed" | "waiting" | "paused";

export interface SyncItemDetails {
  kind: SyncItemKind;
  name: string;
  bytes: number | null;
}

export interface SyncLibraryIndex {
  records: ReadonlyMap<string, SyncItemDetails>;
  files: ReadonlyMap<string, SyncItemDetails>;
}

export interface SyncLibrarySnapshot {
  manuscripts: readonly Pick<SlideDeckDoc, "id" | "title">[];
  scriptures: readonly Pick<SlideDeckDoc, "id" | "title">[];
  media: readonly MediaItem[];
  backgrounds: readonly Background[];
  themes: readonly Pick<Theme, "id" | "name">[];
  audio: readonly AudioItem[];
}

export interface SyncActivityItem extends SyncItemRef {
  id: string;
  kind: SyncItemKind;
  name: string | null;
  isRemoval: boolean;
  bytes: number | null;
  status: SyncItemStatus;
  failure: SyncFailure | null;
  changedAt: string;
}

export interface SyncActivity {
  uploads: SyncActivityItem[];
  downloads: SyncActivityItem[];
}

interface SyncActivityInput {
  uploads: readonly JournalEntry[];
  downloads: readonly DownloadEntry[];
  pausedItems: readonly string[];
  activeTransferId: string | null;
  index: SyncLibraryIndex;
  nowMs: number;
}

interface QueuedEntry {
  id: string;
  store: SyncStore;
  recordId: string;
  changedAt: string;
  failure?: SyncFailure;
  size?: number;
}

const PREFS_RECORD_KEY = journalKey("prefs", "app");

const STORE_KINDS: Record<SyncStore, SyncItemKind> = {
  manuscripts: "manuscript",
  scriptures: "scripture",
  media: "media",
  backgrounds: "background",
  themes: "theme",
  audio: "sound",
  prefs: "settings",
  productions: "production",
  sceneLayouts: "layout",
  files: "file",
};

const STATUS_ORDER: Record<SyncItemStatus, number> = {
  active: 0,
  failed: 1,
  waiting: 2,
  paused: 3,
};

export const syncActivityIdOf = (
  direction: SyncDirection,
  key: string,
): string => `${direction}:${key}`;

const fileOwnerSize = (
  blobId: string | undefined,
  id: string,
  size?: number,
) => (blobId === id ? (size ?? null) : null);

export const buildLibraryIndex = (
  library: SyncLibrarySnapshot,
  studio: ReadonlyMap<string, SyncItemDetails>,
): SyncLibraryIndex => {
  const records = new Map<string, SyncItemDetails>(studio);
  const files = new Map<string, SyncItemDetails>();
  const addRecord = (store: SyncStore, id: string, details: SyncItemDetails) =>
    records.set(journalKey(store, id), details);
  const addFile = (fileId: string | undefined, details: SyncItemDetails) => {
    if (fileId && !files.has(fileId)) files.set(fileId, details);
  };

  for (const { id, title } of library.manuscripts)
    addRecord("manuscripts", id, {
      kind: "manuscript",
      name: title,
      bytes: null,
    });
  for (const { id, title } of library.scriptures)
    addRecord("scriptures", id, {
      kind: "scripture",
      name: title,
      bytes: null,
    });
  for (const { id, name } of library.themes)
    addRecord("themes", id, { kind: "theme", name, bytes: null });
  for (const item of library.media) {
    const details: SyncItemDetails = {
      kind: item.kind,
      name: item.name,
      bytes: item.size,
    };
    addRecord("media", item.id, details);
    addFile(item.id, details);
  }
  for (const background of library.backgrounds) {
    const details: SyncItemDetails = {
      kind: "background",
      name: background.name,
      bytes: fileOwnerSize(background.blobId, background.id, background.size),
    };
    addRecord("backgrounds", background.id, details);
    addFile(background.blobId, details);
  }
  for (const sound of library.audio) {
    const details: SyncItemDetails = {
      kind: "sound",
      name: sound.name,
      bytes: fileOwnerSize(sound.blobId, sound.id, sound.size),
    };
    addRecord("audio", sound.id, details);
    addFile(sound.blobId, details);
  }
  records.set(PREFS_RECORD_KEY, {
    kind: "settings",
    name: "App settings",
    bytes: null,
  });
  return { records, files };
};

const detailsOf = (
  entry: QueuedEntry,
  index: SyncLibraryIndex,
): SyncItemDetails | undefined =>
  entry.store === SYNC_FILE_STORE
    ? index.files.get(baseFileId(entry.recordId))
    : index.records.get(journalKey(entry.store, entry.recordId));

const groupByKey = (
  entries: readonly QueuedEntry[],
): Map<string, QueuedEntry[]> => {
  const groups = new Map<string, QueuedEntry[]>();
  for (const entry of entries) {
    const key = syncItemKeyOf(entry.store, entry.recordId);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return groups;
};

const recordEntriesFirst = (entries: readonly QueuedEntry[]): QueuedEntry[] =>
  [...entries].sort(
    (a, b) =>
      Number(a.store === SYNC_FILE_STORE) - Number(b.store === SYNC_FILE_STORE),
  );

const statusOf = (
  id: string,
  key: string,
  failure: SyncFailure | null,
  {
    activeTransferId,
    pausedItems,
  }: Pick<SyncActivityInput, "activeTransferId" | "pausedItems">,
): SyncItemStatus => {
  if (activeTransferId === id) return "active";
  if (pausedItems.includes(key)) return "paused";
  return failure ? "failed" : "waiting";
};

const buildItems = (
  direction: SyncDirection,
  entries: readonly QueuedEntry[],
  input: SyncActivityInput,
  bytesOf: (
    group: readonly QueuedEntry[],
    details?: SyncItemDetails,
  ) => number | null,
): SyncActivityItem[] =>
  [...groupByKey(entries)]
    .map(([key, group]): SyncActivityItem => {
      const ordered = recordEntriesFirst(group);
      const primary = ordered[0];
      const details = ordered
        .map((entry) => detailsOf(entry, input.index))
        .find((found) => found !== undefined);
      const failure =
        group.find((entry) => isFailureActive(entry.failure, input.nowMs))
          ?.failure ?? null;
      const id = syncActivityIdOf(direction, key);
      return {
        id,
        key,
        direction,
        entryIds: group.map((entry) => entry.id),
        kind: details?.kind ?? STORE_KINDS[primary?.store ?? SYNC_FILE_STORE],
        name: details?.name ?? null,
        isRemoval: direction === "upload" && details === undefined,
        bytes: bytesOf(group, details),
        status: statusOf(id, key, failure, input),
        failure,
        changedAt: group.reduce(
          (latest, entry) =>
            entry.changedAt > latest ? entry.changedAt : latest,
          "",
        ),
      };
    })
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.changedAt.localeCompare(b.changedAt),
    );

export const buildSyncActivity = (input: SyncActivityInput): SyncActivity => ({
  uploads: buildItems(
    "upload",
    input.uploads,
    input,
    (_group, details) => details?.bytes ?? null,
  ),
  downloads: buildItems(
    "download",
    input.downloads.map(({ id, size, changedAt, failure }) => ({
      id,
      store: SYNC_FILE_STORE,
      recordId: id,
      changedAt,
      failure,
      size,
    })),
    input,
    (group) => group.reduce((total, entry) => total + (entry.size ?? 0), 0),
  ),
});
