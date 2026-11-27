import { SYNC_FILE_STORE } from "@/contracts/syncContract";
import { isAccountsAvailable } from "../../lib/apiServer";
import { isQuotaError } from "../../lib/fileStore";
import { now } from "../../lib/id";
import { ApiRequestError } from "../../lib/jsonApi";
import { signedInAccount } from "../account/session/authStore";
import { isSessionEnded } from "../account/session/sessionManager";
import { onRealtime } from "../realtime/realtimeEvents";
import { syncNow } from "./syncClock";
import { askToContinueSync } from "./syncDecision";
import { readDownloads } from "./syncDownloads";
import { nextRetryDelayMs } from "./syncFailure";
import { syncItemKeyOf } from "./syncItems";
import { readJournal } from "./syncJournal";
import { createSyncLane } from "./syncLane";
import { pullRemoteChanges } from "./syncPull";
import { pushRecordChanges } from "./syncPush";
import { subscribeSyncQueue, type SyncQueueEvent } from "./syncQueueEvents";
import { refreshSyncQueue } from "./syncQueueSummary";
import { pendingJournal, queueLibraryIfNeeded } from "./syncScope";
import {
  readSyncSettings,
  subscribeSyncSettings,
  updateSyncSettings,
  type SyncSettings,
} from "./syncSettings";
import { showSyncActivity, useSyncStore, type SyncPhase } from "./syncStore";
import { cancelTransfers, transferFiles } from "./syncTransfers";

const RECORDS_LOCK = "gospelstudio-sync";
const FILES_LOCK = "gospelstudio-sync-files";
const CHANGE_DELAY_MS = 1000;
const SUMMARY_DELAY_MS = 400;

const OUT_OF_SPACE_MESSAGE =
  "This device ran out of storage space while downloading your library. Free up some space, then sync again.";
const UNEXPECTED_MESSAGE =
  "Sync stopped because of an unexpected problem. It will try again shortly.";

let started = false;
let summaryTimer: number | undefined;
let lastSettingsKey = "";
let lastPausedKey = "";
let stopListening: (() => void) | null = null;
let checkingOfflineChanges: Promise<void> | null = null;

const settingsKeyOf = ({
  accountId,
  enabled,
  deviceId,
  awaitingDecision,
  offlineSince,
}: SyncSettings): string =>
  `${accountId}|${enabled}|${deviceId}|${awaitingDecision}|${offlineSince !== null}`;

const pausedKeyOf = ({ pausedItems }: SyncSettings): string =>
  pausedItems.join("|");

const isSyncOnFor = (settings: SyncSettings, accountId: string): boolean =>
  settings.accountId === accountId &&
  settings.enabled &&
  !settings.awaitingDecision;

/* While changes made offline wait to be checked, sync stays held so nothing made offline goes out before the user is asked. */
const blockedPhase = (): SyncPhase | null => {
  const account = signedInAccount();
  if (!isAccountsAvailable() || !account) return "off";
  const settings = readSyncSettings();
  if (!isSyncOnFor(settings, account.id)) return "paused";
  if (!navigator.onLine || settings.offlineSince) return "offline";
  return null;
};

const problemOf = (error: unknown): string => {
  if (isQuotaError(error)) return OUT_OF_SPACE_MESSAGE;
  if (error instanceof ApiRequestError) return error.message;
  return UNEXPECTED_MESSAGE;
};

const updatePhase = (): void => {
  const blocked = started ? blockedPhase() : "off";
  const lanes = [records, files];
  const failed = lanes.find((lane) => lane.state === "error");
  const phase: SyncPhase =
    blocked ??
    (lanes.some((lane) => lane.state === "busy")
      ? "syncing"
      : failed
        ? "error"
        : lanes.some((lane) => lane.state === "off")
          ? "off"
          : "idle");
  useSyncStore.setState({
    phase,
    problem: failed && !blocked ? problemOf(failed.error) : null,
  });
};

/* Pulling still runs when pushing hit a problem, so a device that can't send its own changes keeps receiving everyone else's. */
const syncRecords = async (signal: AbortSignal): Promise<void> => {
  const account = signedInAccount();
  if (blockedPhase() || !account) return;
  const { deviceId } = readSyncSettings();
  let pushProblem: unknown = null;
  try {
    await queueLibraryIfNeeded();
    try {
      await pushRecordChanges({
        deviceId,
        signal,
        onActivity: showSyncActivity,
      });
    } catch (error) {
      if (signal.aborted || isSessionEnded(error)) throw error;
      pushProblem = error;
    }
    await pullRemoteChanges({
      accountId: account.id,
      deviceId,
      signal,
      onActivity: showSyncActivity,
    });
  } finally {
    showSyncActivity(null);
    if (!signal.aborted) files.schedule(0);
  }
  if (pushProblem) throw pushProblem;
  const lastSyncedAt = now();
  updateSyncSettings({ lastSyncedAt });
  useSyncStore.setState({ lastSyncedAt });
};

const syncFiles = async (signal: AbortSignal): Promise<void> => {
  if (blockedPhase()) return;
  await transferFiles({ deviceId: readSyncSettings().deviceId, signal });
};

const recordsRetryDelayMs = async (): Promise<number | null> => {
  if (blockedPhase()) return null;
  const journal = await readJournal();
  return nextRetryDelayMs(
    journal.map((entry) => entry.failure),
    Date.now(),
  );
};

const filesRetryDelayMs = async (): Promise<number | null> => {
  if (blockedPhase()) return null;
  const [journal, downloads] = await Promise.all([
    readJournal(),
    readDownloads(),
  ]);
  return nextRetryDelayMs(
    [
      ...journal
        .filter((entry) => entry.store === SYNC_FILE_STORE)
        .map((entry) => entry.failure),
      ...downloads.map((entry) => entry.failure),
    ],
    Date.now(),
  );
};

const records = createSyncLane({
  lockName: RECORDS_LOCK,
  work: syncRecords,
  nextRunDelayMs: recordsRetryDelayMs,
  onStateChange: updatePhase,
});

const files = createSyncLane({
  lockName: FILES_LOCK,
  work: syncFiles,
  nextRunDelayMs: filesRetryDelayMs,
  onStateChange: updatePhase,
});

const scheduleSummary = (): void => {
  window.clearTimeout(summaryTimer);
  summaryTimer = window.setTimeout(
    () => void refreshSyncQueue(),
    SUMMARY_DELAY_MS,
  );
};

const scheduleBothLanes = (delayMs: number): void => {
  records.schedule(delayMs);
  files.schedule(delayMs);
};

const rememberGoingOffline = (): void => {
  const account = signedInAccount();
  const settings = readSyncSettings();
  if (!account || !isSyncOnFor(settings, account.id) || settings.offlineSince)
    return;
  updateSyncSettings({ offlineSince: syncNow() });
};

/* Asks before sending anything changed while offline. The question is stored before the hold is lifted, so no lane can slip in between. */
const inspectOfflineChanges = async (): Promise<void> => {
  const { offlineSince } = readSyncSettings();
  if (!offlineSince || !navigator.onLine) return;
  const account = signedInAccount();
  const changedOffline = account
    ? (await pendingJournal()).filter(
        (entry) => entry.changedAt >= offlineSince,
      )
    : [];
  const itemCount = new Set(
    changedOffline.map((entry) => syncItemKeyOf(entry.store, entry.recordId)),
  ).size;
  if (account && itemCount > 0)
    askToContinueSync(account.id, itemCount, "offline");
  updateSyncSettings({ offlineSince: null });
};

const checkOfflineChanges = (): Promise<void> => {
  checkingOfflineChanges ??= inspectOfflineChanges().finally(() => {
    checkingOfflineChanges = null;
  });
  return checkingOfflineChanges;
};

const onQueueEvent = ({ needsSync }: SyncQueueEvent): void => {
  scheduleSummary();
  if (needsSync) scheduleBothLanes(CHANGE_DELAY_MS);
};

const onLibraryChanged = ({ sequence }: { sequence: number }): void => {
  if (sequence > readSyncSettings().cursor) records.schedule(0);
};

const onSettingsChanged = (): void => {
  const settings = readSyncSettings();
  const pausedKey = pausedKeyOf(settings);
  if (pausedKey !== lastPausedKey) {
    lastPausedKey = pausedKey;
    cancelTransfers(new Set(settings.pausedItems));
    files.schedule(0);
    scheduleSummary();
  }
  const key = settingsKeyOf(settings);
  if (key === lastSettingsKey) return;
  lastSettingsKey = key;
  records.abort();
  files.abort();
  updatePhase();
  scheduleSummary();
  scheduleBothLanes(0);
};

const onOnline = (): void => {
  void checkOfflineChanges();
  updatePhase();
  scheduleBothLanes(0);
};

const onOffline = (): void => {
  records.abort();
  files.abort();
  showSyncActivity(null);
  rememberGoingOffline();
  updatePhase();
};

export const requestSync = (): void => scheduleBothLanes(0);

/* Changes from other devices arrive through the realtime connection: every connect catches up, and every save elsewhere triggers a pull, so nothing checks on a timer. */
export const startSyncEngine = (): void => {
  if (started) return;
  started = true;
  const settings = readSyncSettings();
  lastSettingsKey = settingsKeyOf(settings);
  lastPausedKey = pausedKeyOf(settings);
  useSyncStore.setState({ lastSyncedAt: settings.lastSyncedAt });
  records.start();
  files.start();
  const unsubscribers = [
    subscribeSyncQueue(onQueueEvent),
    subscribeSyncSettings(onSettingsChanged),
    onRealtime("connected", () => scheduleBothLanes(0)),
    onRealtime("libraryChanged", onLibraryChanged),
  ];
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  stopListening = () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
  if (navigator.onLine) void checkOfflineChanges();
  else rememberGoingOffline();
  updatePhase();
  scheduleSummary();
  scheduleBothLanes(0);
};

export const stopSyncEngine = (): void => {
  if (!started) return;
  started = false;
  window.clearTimeout(summaryTimer);
  records.stop();
  files.stop();
  stopListening?.();
  stopListening = null;
  useSyncStore.setState({
    phase: "off",
    activity: null,
    problem: null,
    transfer: null,
  });
};

export const flushSync = async (timeoutMs: number): Promise<void> => {
  if (!started || blockedPhase()) return;
  await Promise.race([
    Promise.all([records.run(), files.run()]),
    new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
};
