import { z } from "zod";
import { deviceIdSchema } from "./syncContract";

export const REALTIME_PATH = "/v1/realtime";

export const REALTIME_EVENTS = {
  ready: "realtime:ready",
  libraryChanged: "library:changed",
  accountChanged: "account:changed",
  sessionsChanged: "sessions:changed",
  sessionEnded: "session:ended",
  presenceChanged: "presence:changed",
  setActivity: "activity:set",
} as const;

export const REALTIME_ERRORS = {
  unauthorized: "unauthorized",
  unavailable: "unavailable",
} as const;

export const MAX_LIVE_PLATFORMS = 10;

const isoTimeSchema = z.string().datetime();

export const realtimeAuthSchema = z.object({
  token: z.string().min(1).max(4096),
  deviceId: deviceIdSchema,
});

export type RealtimeAuth = z.infer<typeof realtimeAuthSchema>;

export const realtimeReadySchema = z.object({
  sessionId: z.string().min(1),
  serverTime: isoTimeSchema,
});

export type RealtimeReady = z.infer<typeof realtimeReadySchema>;

export const libraryChangedSchema = z.object({
  sequence: z.number().int().positive(),
  deviceId: z.string(),
  serverTime: isoTimeSchema,
});

export type LibraryChanged = z.infer<typeof libraryChangedSchema>;

export const accountChangedSchema = z.object({
  logoChanged: z.boolean(),
});

export type AccountChanged = z.infer<typeof accountChangedSchema>;

export const SESSION_END_REASONS = [
  "signed-out",
  "password-changed",
  "account-deleted",
] as const;

export const sessionEndedSchema = z.object({
  reason: z.enum(SESSION_END_REASONS),
});

export type SessionEnded = z.infer<typeof sessionEndedSchema>;

export const LIVE_PLATFORM_STATES = ["connecting", "live", "problem"] as const;

export const liveStreamActivitySchema = z.object({
  status: z.enum(["starting", "live", "stopping"]),
  startedAt: isoTimeSchema.nullable(),
  platforms: z
    .array(
      z.object({
        platform: z.string().regex(/^[a-z0-9-]{1,32}$/),
        state: z.enum(LIVE_PLATFORM_STATES),
      }),
    )
    .max(MAX_LIVE_PLATFORMS),
});

export type LiveStreamActivity = z.infer<typeof liveStreamActivitySchema>;

export const recordingActivitySchema = z.object({
  status: z.enum(["starting", "recording", "paused", "saving"]),
  elapsedMs: z.number().int().min(0),
  runningSince: isoTimeSchema.nullable(),
});

export type RecordingActivity = z.infer<typeof recordingActivitySchema>;

export const deviceActivitySchema = z.object({
  liveStream: liveStreamActivitySchema.nullable(),
  recording: recordingActivitySchema.nullable(),
});

export type DeviceActivity = z.infer<typeof deviceActivitySchema>;

export const IDLE_DEVICE_ACTIVITY: DeviceActivity = {
  liveStream: null,
  recording: null,
};

export const presentDeviceSchema = z.object({
  sessionId: z.string().min(1),
  deviceName: z.string(),
  connectedAt: isoTimeSchema,
  activity: deviceActivitySchema,
});

export type PresentDevice = z.infer<typeof presentDeviceSchema>;

export const presenceSchema = z.object({
  devices: z.array(presentDeviceSchema),
  serverTime: isoTimeSchema,
});

export type Presence = z.infer<typeof presenceSchema>;
