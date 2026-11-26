import { isAccountsAvailable } from "../../lib/apiServer";
import { isQuotaError } from "../../lib/fileStore";
import { now } from "../../lib/id";
import { ApiRequestError } from "../../lib/jsonApi";
import { withWebLockIfFree } from "../../lib/webLocks";
import { signedInAccount } from "../account/session/authStore";
import { isSessionEnded } from "../account/session/sessionManager";
import { retryDelayAfter } from "./syncDecisions";
import { subscribeJournal, type JournalEvent } from "./syncJournal";
import { refreshPendingCount } from "./syncPending";
import { pullRemoteChanges } from "./syncPull";
import { pushPendingChanges } from "./syncPush";
import { queueLibraryIfNeeded } from "./syncScope";
import {
  readSyncSettings,
  subscribeSyncSettings,
  updateSyncSettings,
  type SyncSettings,
} from "./syncSettings";
import { showSyncActivity, useSyncStore, type SyncPhase } from "./syncStore";

const SYNC_LOCK = "gospelstudio-sync";
const POLL_INTERVAL_MS = 60 * 1000;
const CHANGE_DELAY_MS = 3 * 1000;
const COUNT_DELAY_MS = 1500;
const STALE_AFTER_MS = 30 * 1000;

const OUT_OF_SPACE_MESSAGE =
  "This device ran out of storage space while downloading your library. Free up some space, then sync again.";
const UNEXPECTED_MESSAGE =
  "Sync stopped because of an unexpected problem. It will try again shortly.";

let started = false;
let timer: number | undefined;
let countTimer: number | undefined;
let running: Promise<void> | null = null;
let rerunDelayMs: number | null = null;
let controller: AbortController | null = null;
let failures = 0;
let lastSettingsKey = "";
let stopListening: (() => void) | null = null;

const settingsKeyOf = ({
  accountId,
  enabled,
  deviceId,
  awaitingDecision,
}: SyncSettings): string =>
  `${accountId}|${enabled}|${deviceId}|${awaitingDecision}`;

const blockedPhase = (): SyncPhase | null => {
  const account = signedInAccount();
  if (!isAccountsAvailable() || !account) return "off";
  const settings = readSyncSettings();
  const isLinkedAndOn =
    settings.accountId === account.id &&
    settings.enabled &&
    !settings.awaitingDecision;
  if (!isLinkedAndOn) return "paused";
  if (!navigator.onLine) return "offline";
  return null;
};

const schedule = (delayMs: number): void => {
  if (!started) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void runCycle(), delayMs);
};

const scheduleCount = (): void => {
  window.clearTimeout(countTimer);
  countTimer = window.setTimeout(
    () => void refreshPendingCount(),
    COUNT_DELAY_MS,
  );
};

const failureState = (
  error: unknown,
): { phase: SyncPhase; problem: string } => {
  if (isQuotaError(error))
    return { phase: "error", problem: OUT_OF_SPACE_MESSAGE };
  if (error instanceof ApiRequestError)
    return { phase: "error", problem: error.message };
  return { phase: "error", problem: UNEXPECTED_MESSAGE };
};

const cycle = async (): Promise<void> => {
  const blocked = blockedPhase();
  const account = signedInAccount();
  if (blocked || !account) {
    useSyncStore.setState({ phase: blocked ?? "off", activity: null });
    void refreshPendingCount();
    return;
  }
  const { deviceId } = readSyncSettings();
  const cycleController = new AbortController();
  controller = cycleController;
  const { signal } = cycleController;
  useSyncStore.setState({ phase: "syncing", problem: null });

  try {
    const summary = await withWebLockIfFree(SYNC_LOCK, async () => {
      await queueLibraryIfNeeded();
      const pushed = await pushPendingChanges({
        deviceId,
        signal,
        onActivity: showSyncActivity,
      });
      await pullRemoteChanges({
        accountId: account.id,
        deviceId,
        signal,
        onActivity: showSyncActivity,
      });
      return pushed;
    });
    failures = 0;
    if (summary) {
      const lastSyncedAt = now();
      updateSyncSettings({ lastSyncedAt });
      useSyncStore.setState({
        phase: "idle",
        lastSyncedAt,
        tooLargeCount: summary.tooLarge,
      });
    } else useSyncStore.setState({ phase: "idle" });
    schedule(POLL_INTERVAL_MS);
  } catch (error) {
    if (signal.aborted) return;
    if (isSessionEnded(error)) {
      useSyncStore.setState({ phase: "off" });
      return;
    }
    failures += 1;
    useSyncStore.setState(failureState(error));
    schedule(retryDelayAfter(failures));
  } finally {
    if (controller === cycleController) controller = null;
    showSyncActivity(null);
    void refreshPendingCount();
  }
};

const requestRerun = (delayMs: number): void => {
  rerunDelayMs =
    rerunDelayMs === null ? delayMs : Math.min(rerunDelayMs, delayMs);
};

const runCycle = (): Promise<void> => {
  window.clearTimeout(timer);
  if (running) {
    requestRerun(0);
    return running;
  }
  running = cycle().finally(() => {
    running = null;
    if (rerunDelayMs === null) return;
    const delayMs = rerunDelayMs;
    rerunDelayMs = null;
    schedule(delayMs);
  });
  return running;
};

const abortRunningCycle = (): void => {
  controller?.abort();
  controller = null;
};

const onJournalEvent = (event: JournalEvent): void => {
  scheduleCount();
  if (event !== "added") return;
  if (running) requestRerun(CHANGE_DELAY_MS);
  else schedule(CHANGE_DELAY_MS);
};

const onSettingsChanged = (): void => {
  const key = settingsKeyOf(readSyncSettings());
  if (key === lastSettingsKey) return;
  lastSettingsKey = key;
  abortRunningCycle();
  schedule(0);
};

const onOnline = (): void => schedule(0);

const onOffline = (): void => {
  abortRunningCycle();
  useSyncStore.setState({ phase: "offline", activity: null });
};

const onVisibilityChange = (): void => {
  if (document.visibilityState !== "visible") return;
  const { lastSyncedAt } = readSyncSettings();
  const isStale =
    !lastSyncedAt || Date.now() - Date.parse(lastSyncedAt) > STALE_AFTER_MS;
  if (isStale) schedule(0);
};

export const requestSync = (): void => schedule(0);

export const startSyncEngine = (): void => {
  if (started) return;
  started = true;
  failures = 0;
  lastSettingsKey = settingsKeyOf(readSyncSettings());
  useSyncStore.setState({ lastSyncedAt: readSyncSettings().lastSyncedAt });
  const unsubscribeJournal = subscribeJournal(onJournalEvent);
  const unsubscribeSettings = subscribeSyncSettings(onSettingsChanged);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisibilityChange);
  stopListening = () => {
    unsubscribeJournal();
    unsubscribeSettings();
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
  schedule(0);
};

export const stopSyncEngine = (): void => {
  if (!started) return;
  started = false;
  rerunDelayMs = null;
  window.clearTimeout(timer);
  window.clearTimeout(countTimer);
  abortRunningCycle();
  stopListening?.();
  stopListening = null;
  useSyncStore.setState({ phase: "off", activity: null, problem: null });
};

export const flushSync = async (timeoutMs: number): Promise<void> => {
  if (!started || blockedPhase()) return;
  await Promise.race([
    runCycle(),
    new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
};
