import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { readRecord } from "../../../lib/storage";
import { useStore } from "../../../store/useStore";
import {
  buildLibraryIndex,
  buildSyncActivity,
  syncActivityIdOf,
  type SyncActivity,
  type SyncItemDetails,
} from "../syncActivity";
import { readDownloads, type DownloadEntry } from "../syncDownloads";
import { journalKey, type JournalEntry } from "../syncJournal";
import { subscribeSyncQueue } from "../syncQueueEvents";
import { pendingJournal } from "../syncScope";
import { useSyncSettings } from "../syncSettings";
import { useSyncStore } from "../syncStore";

const RELOAD_DELAY_MS = 150;

const STUDIO_STORES = {
  productions: "production",
  sceneLayouts: "layout",
} as const;

type StudioStore = keyof typeof STUDIO_STORES;

interface LoadedQueue {
  uploads: JournalEntry[];
  downloads: DownloadEntry[];
  studio: Map<string, SyncItemDetails>;
  loadedAtMs: number;
}

const isStudioEntry = (
  entry: JournalEntry,
): entry is JournalEntry & { store: StudioStore } =>
  entry.store in STUDIO_STORES;

/* Productions and layouts are only loaded when the Studio opens, so their names are read straight from storage for the few that are syncing. */
const readStudioDetails = async (
  uploads: readonly JournalEntry[],
): Promise<Map<string, SyncItemDetails>> => {
  const details = new Map<string, SyncItemDetails>();
  for (const entry of uploads.filter(isStudioEntry)) {
    const record = await readRecord<{ id: string; name?: string }>(
      entry.store,
      entry.recordId,
    );
    if (record)
      details.set(journalKey(entry.store, entry.recordId), {
        kind: STUDIO_STORES[entry.store],
        name: record.name ?? "",
        bytes: null,
      });
  }
  return details;
};

const loadQueue = async (): Promise<LoadedQueue> => {
  const [uploads, downloads] = await Promise.all([
    pendingJournal(),
    readDownloads(),
  ]);
  return {
    uploads,
    downloads,
    studio: await readStudioDetails(uploads),
    loadedAtMs: Date.now(),
  };
};

export const useSyncActivity = (): SyncActivity | null => {
  const [queue, setQueue] = useState<LoadedQueue | null>(null);
  const { pausedItems } = useSyncSettings();
  const activeTransferId = useSyncStore((state) =>
    state.transfer
      ? syncActivityIdOf(state.transfer.direction, state.transfer.key)
      : null,
  );
  const library = useStore(
    useShallow((state) => ({
      manuscripts: state.manuscripts,
      scriptures: state.scriptures,
      media: state.media,
      builtInMedia: state.builtInMedia,
      backgrounds: state.backgrounds,
      themes: state.themes,
      audio: state.audio,
    })),
  );

  useEffect(() => {
    let isCurrent = true;
    let timer: number | undefined;
    const load = async () => {
      const loaded = await loadQueue();
      if (isCurrent) setQueue(loaded);
    };
    const scheduleLoad = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void load(), RELOAD_DELAY_MS);
    };
    void load();
    const unsubscribe = subscribeSyncQueue(scheduleLoad);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return useMemo(() => {
    if (!queue) return null;
    const index = buildLibraryIndex(
      { ...library, media: [...library.media, ...library.builtInMedia] },
      queue.studio,
    );
    return buildSyncActivity({
      uploads: queue.uploads,
      downloads: queue.downloads,
      pausedItems,
      activeTransferId,
      index,
      nowMs: queue.loadedAtMs,
    });
  }, [queue, library, pausedItems, activeTransferId]);
};
