import { applyRemoteChanges } from "./applyRemoteChanges";
import { fetchChanges } from "./syncApi";
import { rememberServerTime } from "./syncClock";
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
    const sentAtMs = Date.now();
    const page = await fetchChanges(settings.cursor, signal);
    if (page.serverTime)
      rememberServerTime({
        serverTime: page.serverTime,
        sentAtMs,
        receivedAtMs: Date.now(),
      });
    await applyRemoteChanges(page.changes, { deviceId });
    signal.throwIfAborted();
    updateSyncSettings({ cursor: page.cursor });
    if (!page.hasMore) return;
  }
};
