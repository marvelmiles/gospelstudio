import {
  formatDuration,
  videoPosition,
  type VideoProgress,
} from "../../lib/media";
import { cn } from "../../lib/utils";

interface VideoTimecodeProps {
  progress: VideoProgress;
  className?: string;
}

export const VideoTimecode = ({ progress, className }: VideoTimecodeProps) => (
  <span className={cn("whitespace-nowrap tabular-nums", className)}>
    {formatDuration(videoPosition(progress) - progress.start)} /{" "}
    {formatDuration(Math.max(progress.end - progress.start, 0))}
  </span>
);
