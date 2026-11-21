import { useElapsedTime } from "../../../hooks/useElapsedTime";
import { formatDuration } from "../../../lib/media";
import { cn } from "../../../lib/utils";

interface LiveClockProps {
  startedAt: number | null;
  className?: string;
}

export const LiveClock = ({ startedAt, className }: LiveClockProps) => {
  const elapsedMs = useElapsedTime(startedAt);
  return (
    <span
      aria-label="Time live"
      className={cn("font-bold tabular-nums", className)}
    >
      {formatDuration(Math.floor(elapsedMs / 1000))}
    </span>
  );
};
