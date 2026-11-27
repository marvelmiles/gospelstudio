import { useSyncExternalStore } from "react";
import { z } from "zod";
import { deviceIdSchema } from "@/contracts/syncContract";
import {
  readDeviceSetting,
  writeDeviceSetting,
} from "../../lib/deviceSettings";
import { uid } from "../../lib/id";
import { clearStore } from "../../lib/storage";

const SYNC_RESUME_REASONS = [
  "joining",
  "signed-out",
  "offline",
] as const;

export type SyncResumeReason = (typeof SYNC_RESUME_REASONS)[number];

const SETTING_NAME = "sync";
const STORAGE_KEY = `gospelstudio:${SETTING_NAME}`;

const syncSettingsSchema = z.object({
  deviceId: deviceIdSchema,
  accountId: z.string().nullable(),
  enabled: z.boolean(),
  cursor: z.number().int().min(0),
  lastSyncedAt: z.string().nullable(),
  libraryQueued: z.boolean(),
  awaitingDecision: z.boolean().default(false),
  clockOffsetMs: z.number().finite().default(0),
  pausedItems: z.array(z.string()).default([]),
  offlineSince: z.string().datetime().nullable().default(null),
  pendingDecision: z
    .enum(SYNC_RESUME_REASONS)
    .nullable()
    .catch(null)
    .default(null),
});

export type SyncSettings = z.output<typeof syncSettingsSchema>;

const newDeviceId = (): string => `${uid()}${uid()}`;

const freshSettings = (): SyncSettings => ({
  deviceId: newDeviceId(),
  accountId: null,
  enabled: false,
  cursor: 0,
  lastSyncedAt: null,
  libraryQueued: false,
  awaitingDecision: false,
  clockOffsetMs: 0,
  pausedItems: [],
  offlineSince: null,
  pendingDecision: null,
});

let cached: SyncSettings | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) listener();
};

if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    cached = null;
    notify();
  });

export const readSyncSettings = (): SyncSettings => {
  if (cached) return cached;
  const stored = readDeviceSetting(
    SETTING_NAME,
    syncSettingsSchema.nullable(),
    null,
  );
  cached = stored ?? freshSettings();
  if (!stored) writeDeviceSetting(SETTING_NAME, cached);
  return cached;
};

export const updateSyncSettings = (
  changes: Partial<SyncSettings>,
): SyncSettings => {
  cached = { ...readSyncSettings(), ...changes };
  writeDeviceSetting(SETTING_NAME, cached);
  notify();
  return cached;
};

export const subscribeSyncSettings = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useSyncSettings = (): SyncSettings =>
  useSyncExternalStore(subscribeSyncSettings, readSyncSettings);

/* A new device id after a reset lets this device download what it uploaded before, instead of skipping it as its own echo. */
export const restartDeviceSync = async (): Promise<void> => {
  await Promise.all([
    clearStore("syncChanges", { tracked: false }),
    clearStore("syncDownloads", { tracked: false }),
  ]);
  updateSyncSettings({
    deviceId: newDeviceId(),
    cursor: 0,
    lastSyncedAt: null,
    pausedItems: [],
  });
};
