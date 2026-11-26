import { applyRemoteChanges } from "./applyRemoteChanges";
import { fetchChanges } from "./syncApi";
import { readSyncSettings, updateSyncSettings } from "./syncSettings";

interface PullOptions {
  accountId: string;
  deviceId: string;
  signal: AbortSignal;
  onActivity: (activity: string | null) => void;
}

/* The cursor only moves after a page is fully applied, so an interrupted sync repeats that page instead of skipping it. */
export const pullRemoteChanges = async ({
  accountId,
  deviceId,
  signal,
  onActivity,
}: PullOptions): Promise<void> => {
  for (;;) {
    signal.throwIfAborted();
    const settings = readSyncSettings();
    if (settings.accountId !== accountId) return;
    onActivity("Checking for changes");
    const page = await fetchChanges(settings.cursor, signal);
    await applyRemoteChanges(page.changes, { deviceId, signal, onActivity });
    signal.throwIfAborted();
    updateSyncSettings({ cursor: page.cursor });
    if (!page.hasMore) return;
  }
};
