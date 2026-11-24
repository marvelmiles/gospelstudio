import { cn } from "../../../lib/utils";
import { HEALTH_TONE_CLASS, useStreamHealth } from "../hooks/useStreamHealth";
import type { SessionSnapshot } from "@/contracts/liveRelay";
import { useLiveStreamStore } from "../lib/liveStreamStore";
import { LiveClock } from "./LiveClock";

const formatMegabits = (kbps: number): string =>
  `${(kbps / 1000).toFixed(kbps >= 10_000 ? 0 : 1)} Mbps`;

const relayMessage = (relay: SessionSnapshot | null): string => {
  const destinations = relay?.destinations ?? [];
  const live = destinations.filter((item) => item.state === "live").length;
  if (relay?.ingest === "interrupted")
    return "The relay lost this computer for a moment. Your platforms resume when the connection is back.";
  if (destinations.length > 0 && live === destinations.length)
    return live === 1
      ? "Your service is live. Check the platform's preview to see what viewers see."
      : `Your service is live on all ${live} platforms. Check each platform's preview to see what viewers see.`;
  if (live > 0)
    return `Live on ${live} of ${destinations.length} platforms. The others are connecting or need attention below.`;
  return "Starting the stream to your platforms. This can take a few seconds.";
};

export const LiveStatusPanel = () => {
  const health = useStreamHealth();
  const startedAt = useLiveStreamStore((state) => state.startedAt);
  const relay = useLiveStreamStore((state) => state.relay);
  const phase = useLiveStreamStore((state) => state.phase);
  const sentKbps = useLiveStreamStore((state) => state.stats?.sentKbps ?? null);
  const HealthIcon = health.icon;
  const isHealthy = health.tone === "good" || health.tone === "neutral";

  return (
    <section
      aria-label="Live stream status"
      className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-destructive/35 bg-destructive/8 p-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold tracking-[0.08em] text-destructive-foreground">
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-full bg-destructive",
              phase === "live" && "animate-pulse",
            )}
          />
          {phase === "starting" ? "GOING LIVE" : "LIVE"}
        </span>
        <LiveClock
          startedAt={startedAt}
          className="text-[13px] text-foreground"
        />
        {sentKbps !== null && (
          <span className="text-[12px] text-muted-foreground tabular-nums">
            Sending {formatMegabits(sentKbps)}
          </span>
        )}
        <span
          aria-live="polite"
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold",
            HEALTH_TONE_CLASS[health.tone],
          )}
        >
          <HealthIcon
            size={15}
            aria-hidden
            className={cn(health.isReconnecting && "animate-spin")}
          />
          {health.label}
        </span>
      </div>
      <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
        {isHealthy ? relayMessage(relay) : health.detail}
      </p>
    </section>
  );
};
