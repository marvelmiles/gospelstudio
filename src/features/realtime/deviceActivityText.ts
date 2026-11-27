import type {
  LiveStreamActivity,
  PresentDevice,
} from "@/contracts/realtimeContract";
import {
  STREAM_PLATFORMS,
  streamPlatformIdSchema,
} from "../liveStream/lib/streamPlatforms";

const UNKNOWN_PLATFORM = "a streaming service";

export const platformNameOf = (platform: string): string => {
  const known = streamPlatformIdSchema.safeParse(platform);
  return known.success ? STREAM_PLATFORMS[known.data].name : UNKNOWN_PLATFORM;
};

const joinNames = (names: readonly string[]): string => {
  if (names.length <= 1) return names[0] ?? UNKNOWN_PLATFORM;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export const platformListOf = ({
  platforms,
}: Pick<LiveStreamActivity, "platforms">): string =>
  joinNames([
    ...new Set(platforms.map((entry) => platformNameOf(entry.platform))),
  ]);

const isLive = (device: PresentDevice | undefined): boolean =>
  device?.activity.liveStream?.status === "live";

/* Announces another device starting or ending a live stream, so everyone on the account knows the moment it happens. This device's own stream is left out. */
export const liveTransitionsOf = (
  previous: readonly PresentDevice[],
  next: readonly PresentDevice[],
  ownSessionId: string | null,
): string[] => {
  const before = new Map(previous.map((device) => [device.sessionId, device]));
  const after = new Map(next.map((device) => [device.sessionId, device]));
  const messages: string[] = [];
  for (const device of next) {
    const liveStream = device.activity.liveStream;
    if (device.sessionId === ownSessionId || !liveStream) continue;
    if (isLive(device) && !isLive(before.get(device.sessionId)))
      messages.push(
        `${device.deviceName} is live on ${platformListOf(liveStream)}.`,
      );
  }
  for (const device of previous) {
    if (device.sessionId === ownSessionId || !isLive(device)) continue;
    const now = after.get(device.sessionId);
    if (!now)
      messages.push(
        `${device.deviceName} went offline during its live stream.`,
      );
    else if (!now.activity.liveStream)
      messages.push(`${device.deviceName} ended its live stream.`);
  }
  return messages;
};
