import { useEffect, useState } from "react";
import { Circle, LoaderCircle, Pause, Play, Square } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { formatDuration } from "../../../lib/media";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { useProductionStore } from "../store/productionStore";
import {
  isRecordingSupported,
  pauseRecording,
  resumeRecording,
  startRecording,
  stopRecording,
  useRecordingStore,
} from "./programRecorder";

const CLOCK_TICK_MS = 500;

const useRecordingClock = (): number => {
  const elapsedMs = useRecordingStore((state) => state.elapsedMs);
  const runningSince = useRecordingStore((state) => state.runningSince);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (runningSince === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, [runningSince]);

  return (
    elapsedMs + (runningSince === null ? 0 : Math.max(0, now - runningSince))
  );
};

export const RecordControl = () => {
  const status = useRecordingStore((state) => state.status);
  const productionName = useProductionStore(
    (state) => state.production?.name ?? "Studio",
  );
  const pushToast = useStore((state) => state.pushToast);
  if (!isRecordingSupported()) return null;

  const start = async () => {
    if ((await startRecording(productionName)) === "failed")
      pushToast("Recording could not start in this browser.", "error");
  };

  if (status === "idle" || status === "starting")
    return (
      <Button
        size="sm"
        variant="secondary"
        busy={status === "starting"}
        onClick={() => void start()}
        title="Record the live screen. Your browser asks what to record: pick the projector screen window."
      >
        <Circle className="fill-destructive text-destructive" />
        Record
      </Button>
    );

  if (status === "saving")
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"
      >
        <LoaderCircle size={14} className="animate-spin" />
        Saving recording
      </span>
    );

  const isPaused = status === "paused";
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-destructive/35 bg-destructive/10 py-0.5 pr-0.5 pl-2.5">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full bg-destructive",
          !isPaused && "animate-pulse",
        )}
      />
      <RecordingClock isPaused={isPaused} />
      <IconButton
        icon={isPaused ? Play : Pause}
        title={isPaused ? "Resume recording" : "Pause recording"}
        size="sm"
        onClick={isPaused ? resumeRecording : pauseRecording}
      />
      <IconButton
        icon={Square}
        title="Stop and download the recording"
        size="sm"
        onClick={stopRecording}
      />
    </div>
  );
};

const RecordingClock = ({ isPaused }: { isPaused: boolean }) => {
  const elapsedMs = useRecordingClock();
  return (
    <span
      aria-label={isPaused ? "Recording paused at" : "Recording time"}
      className={cn(
        "min-w-12 px-1.5 text-center text-[12.5px] font-bold tabular-nums",
        isPaused ? "text-muted-foreground" : "text-foreground",
      )}
    >
      {formatDuration(Math.floor(elapsedMs / 1000))}
    </span>
  );
};
