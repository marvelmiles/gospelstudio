import { readSyncSettings, updateSyncSettings } from "./syncSettings";

const MAX_TRUSTED_ROUND_TRIP_MS = 10 * 1000;
const MIN_OFFSET_CHANGE_MS = 500;

interface ClockSample {
  serverTime: string;
  sentAtMs: number;
  receivedAtMs: number;
}

/* The server stamped its time somewhere during the round trip, so the midpoint is the best guess of when, and a slow answer is too vague to trust. */
export const measureClockOffset = ({
  serverTime,
  sentAtMs,
  receivedAtMs,
}: ClockSample): number | null => {
  const serverMs = Date.parse(serverTime);
  const roundTripMs = receivedAtMs - sentAtMs;
  if (Number.isNaN(serverMs)) return null;
  if (roundTripMs < 0 || roundTripMs > MAX_TRUSTED_ROUND_TRIP_MS) return null;
  return Math.round(serverMs - (sentAtMs + roundTripMs / 2));
};

export const toServerTime = (localMs: number): string =>
  new Date(localMs + readSyncSettings().clockOffsetMs).toISOString();

export const toLocalTime = (serverTime: string): number =>
  Date.parse(serverTime) - readSyncSettings().clockOffsetMs;

/* Change times decide which device wins, so they are kept on the server's clock: a device whose clock runs slow would otherwise lose every edit. */
export const syncNow = (): string => toServerTime(Date.now());

export const rememberServerTime = (sample: ClockSample): void => {
  const offset = measureClockOffset(sample);
  if (offset === null) return;
  const { clockOffsetMs } = readSyncSettings();
  if (Math.abs(offset - clockOffsetMs) < MIN_OFFSET_CHANGE_MS) return;
  updateSyncSettings({ clockOffsetMs: offset });
};
