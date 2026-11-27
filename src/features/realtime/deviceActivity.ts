import {
  MAX_LIVE_PLATFORMS,
  type DeviceActivity,
  type LiveStreamActivity,
  type RecordingActivity,
} from "@/contracts/realtimeContract";
import type { DestinationState, SessionSnapshot } from "@/contracts/liveRelay";
import type { StreamDestination } from "../liveStream/lib/liveStreamSettings";
import type { LiveStreamState } from "../liveStream/lib/liveStreamStore";

type PlatformState = LiveStreamActivity["platforms"][number]["state"];

interface RecordingSnapshot {
  status: "idle" | RecordingActivity["status"];
  elapsedMs: number;
  runningSince: number | null;
}

interface ActivitySources {
  live: Pick<
    LiveStreamState,
    "phase" | "startedAt" | "relay" | "includedDestinationIds"
  >;
  destinations: readonly Pick<StreamDestination, "id" | "platform">[];
  recording: RecordingSnapshot;
  toServerTime: (localMs: number) => string;
}

const platformStateOf = (
  state: DestinationState | undefined,
): PlatformState => {
  if (state === "live") return "live";
  if (state === "retrying" || state === "failed") return "problem";
  return "connecting";
};

const relayStateOf = (
  relay: SessionSnapshot | null,
  destinationId: string,
): DestinationState | undefined =>
  relay?.destinations.find((destination) => destination.id === destinationId)
    ?.state;

/* Only the platform and how it is going are shared: stream keys, server addresses and labels never leave this device. */
const liveStreamOf = ({
  live,
  destinations,
  toServerTime: serverTimeOf,
}: ActivitySources): LiveStreamActivity | null => {
  if (live.phase === "idle") return null;
  const included = new Set(live.includedDestinationIds);
  return {
    status: live.phase,
    startedAt: live.startedAt === null ? null : serverTimeOf(live.startedAt),
    platforms: destinations
      .filter((destination) => included.has(destination.id))
      .slice(0, MAX_LIVE_PLATFORMS)
      .map((destination) => ({
        platform: destination.platform,
        state: platformStateOf(relayStateOf(live.relay, destination.id)),
      })),
  };
};

const recordingOf = ({
  recording,
  toServerTime: serverTimeOf,
}: ActivitySources): RecordingActivity | null =>
  recording.status === "idle"
    ? null
    : {
        status: recording.status,
        elapsedMs: Math.max(0, Math.round(recording.elapsedMs)),
        runningSince:
          recording.runningSince === null
            ? null
            : serverTimeOf(recording.runningSince),
      };

export const deviceActivityOf = (sources: ActivitySources): DeviceActivity => ({
  liveStream: liveStreamOf(sources),
  recording: recordingOf(sources),
});
