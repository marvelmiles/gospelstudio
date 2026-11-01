import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";

type MonitorTone = "live" | "idle";

const BADGE_TONES: Record<MonitorTone, string> = {
  live: "bg-destructive text-white",
  idle: "bg-secondary text-muted-foreground",
};

interface MonitorBadge {
  tone: MonitorTone;
  label: string;
}

interface MonitorFrameProps {
  label: string;
  description: string;
  badge?: MonitorBadge;
  sceneName?: string;
  className?: string;
  children: ReactNode;
}

export const MonitorFrame = ({
  label,
  description,
  badge,
  sceneName,
  className,
  children,
}: MonitorFrameProps) => (
  <section
    aria-label={`${label}: ${description}`}
    className={cn("flex min-h-0 min-w-0 flex-col gap-2", className)}
  >
    <header className="flex h-8 min-w-0 shrink-0 items-center gap-2">
      {badge && (
        <span
          title={description}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-[0.08em] uppercase",
            BADGE_TONES[badge.tone],
          )}
        >
          {badge.tone === "live" && (
            <span
              aria-hidden
              className="size-1.5 animate-pulse rounded-full bg-white"
            />
          )}
          {badge.label}
        </span>
      )}
      {sceneName && (
        <span
          title={badge ? undefined : description}
          className="min-w-0 truncate text-[13px] font-semibold text-foreground"
        >
          {sceneName}
        </span>
      )}
    </header>
    {children}
  </section>
);
