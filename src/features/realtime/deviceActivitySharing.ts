import {
  IDLE_DEVICE_ACTIVITY,
  type DeviceActivity,
} from "@/contracts/realtimeContract";
import { deepEqual } from "../../lib/equality";
import { useLiveStreamSettings } from "../liveStream/lib/liveStreamSettings";
import { useLiveStreamStore } from "../liveStream/lib/liveStreamStore";
import { useRecordingStore } from "../studio/recording/programRecorder";
import { toServerTime } from "../sync/syncClock";
import { deviceActivityOf } from "./deviceActivity";

const SHARE_DELAY_MS = 400;

export const currentDeviceActivity = (): DeviceActivity =>
  deviceActivityOf({
    live: useLiveStreamStore.getState(),
    destinations: useLiveStreamSettings.getState().destinations,
    recording: useRecordingStore.getState(),
    toServerTime,
  });

/* Calls share whenever this device's live stream or recording changes, skipping repeats such as encoder statistics that other devices don't show. */
export const watchDeviceActivity = (
  share: (activity: DeviceActivity) => void,
): (() => void) => {
  let shared: DeviceActivity = IDLE_DEVICE_ACTIVITY;
  let timer: number | undefined;

  const shareIfChanged = (): void => {
    const next = currentDeviceActivity();
    if (deepEqual(next, shared)) return;
    shared = next;
    share(next);
  };

  const scheduleShare = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(shareIfChanged, SHARE_DELAY_MS);
  };

  const unsubscribers = [
    useLiveStreamStore.subscribe(scheduleShare),
    useRecordingStore.subscribe(scheduleShare),
  ];
  shareIfChanged();
  return () => {
    window.clearTimeout(timer);
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
};
