import { Circle, Radio, TriangleAlert } from "lucide-react";
import type {
  DeviceActivity,
  LiveStreamActivity,
  RecordingActivity,
} from "@/contracts/realtimeContract";
import { useElapsedTime } from "../../../hooks/useElapsedTime";
import { formatDuration } from "../../../lib/media";
import { cn } from "../../../lib/utils";
import { toLocalTime } from "../../sync/syncClock";
import { platformListOf, platformNameOf } from "../deviceActivityText";

interface DeviceActivityLineProps {
  activity: DeviceActivity;
  className?: string;
}

const localTimeOf = (serverTime: string | null): number | null =>
  serverTime === null ? null : toLocalTime(serverTime);

const runtimeOf = (elapsedMs: number): string =>
  formatDuration(Math.floor(elapsedMs / 1000));

const LiveStreamLine = ({ liveStream }: { liveStream: LiveStreamActivity }) => {
  const elapsedMs = useElapsedTime(localTimeOf(liveStream.startedAt));
  const platforms = platformListOf(liveStream);
  const troubled = liveStream.platforms.filter(
    (entry) => entry.state === "problem",
  );
  const text =
    liveStream.status === "starting"
      ? `Going live on ${platforms}`
      : liveStream.status === "stopping"
        ? "Ending the live stream"
        : `Live on ${platforms} · ${runtimeOf(elapsedMs)}`;

  return (
    <span className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
        <Radio size={13} aria-hidden className="shrink-0" />
        <span className="tabular-nums">{text}</span>
      </span>
      {troubled.length > 0 && (
        <span className="inline-flex items-center gap-1.5 text-warning-foreground">
          <TriangleAlert size={12} aria-hidden className="shrink-0" />
          {troubled
            .map((entry) => platformNameOf(entry.platform))
            .join(", ")}{" "}
          {troubled.length === 1 ? "is" : "are"} having trouble
        </span>
      )}
    </span>
  );
};

const RecordingLine = ({ recording }: { recording: RecordingActivity }) => {
  const elapsedMs = useElapsedTime(
    localTimeOf(recording.runningSince),
    recording.elapsedMs,
  );
  const text =
    recording.status === "starting"
      ? "Starting a recording"
      : recording.status === "saving"
        ? "Saving a recording"
        : `${recording.status === "paused" ? "Recording paused" : "Recording"} · ${runtimeOf(elapsedMs)}`;

  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
      <Circle size={11} aria-hidden className="shrink-0 fill-current" />
      <span className="tabular-nums">{text}</span>
    </span>
  );
};

export const DeviceActivityLine = ({
  activity,
  className,
}: DeviceActivityLineProps) => {
  const { liveStream, recording } = activity;
  return (
    <span className={cn("flex flex-col gap-0.5 text-xs", className)}>
      {liveStream && <LiveStreamLine liveStream={liveStream} />}
      {recording && <RecordingLine recording={recording} />}
      {!liveStream && !recording && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full bg-success" />
          Online now
        </span>
      )}
    </span>
  );
};
