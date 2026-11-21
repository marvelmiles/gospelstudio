import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { HEALTH_TONE_CLASS, useStreamHealth } from "../hooks/useStreamHealth";
import { useLiveStreamStore } from "../lib/liveStreamStore";
import { LiveClock } from "./LiveClock";

export const OnAirButton = ({ onOpen }: { onOpen: () => void }) => {
  const health = useStreamHealth();
  const startedAt = useLiveStreamStore((state) => state.startedAt);
  const HealthIcon = health.icon;

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={onOpen}
      title={`Live stream: ${health.label.toLowerCase()}. Open the stream controls.`}
      className="border-destructive/40 bg-destructive/12 enabled:hover:bg-destructive/18"
    >
      <span
        aria-hidden
        className="size-2 animate-pulse rounded-full bg-destructive"
      />
      <span className="font-extrabold tracking-[0.08em] text-destructive-foreground">
        LIVE
      </span>
      <LiveClock startedAt={startedAt} className="text-foreground" />
      <HealthIcon
        aria-label={health.label}
        className={cn(
          HEALTH_TONE_CLASS[health.tone],
          health.isReconnecting && "animate-spin",
        )}
      />
    </Button>
  );
};
