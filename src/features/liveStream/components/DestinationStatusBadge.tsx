import { CircleAlert, Clock, LoaderCircle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DestinationState } from "../lib/destinationStatus";

const BADGE_CLASS =
  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold";

interface BadgeLook {
  label: string;
  icon: LucideIcon | null;
  spin: boolean;
  className: string;
}

const LOOKS: Record<Exclude<DestinationState, "idle">, BadgeLook> = {
  waiting: {
    label: "Waiting for picture",
    icon: Clock,
    spin: false,
    className: "border-border bg-secondary text-muted-foreground",
  },
  connecting: {
    label: "Connecting",
    icon: LoaderCircle,
    spin: true,
    className: "border-info/40 bg-info/12 text-info-foreground",
  },
  live: {
    label: "Live",
    icon: null,
    spin: false,
    className:
      "border-destructive/45 bg-destructive/14 text-destructive-foreground",
  },
  retrying: {
    label: "Reconnecting",
    icon: RefreshCw,
    spin: true,
    className: "border-warning/45 bg-warning/14 text-warning-foreground",
  },
  failed: {
    label: "Not receiving",
    icon: CircleAlert,
    spin: false,
    className: "border-warning/45 bg-warning/14 text-warning-foreground",
  },
};

export const DestinationStatusBadge = ({
  state,
}: {
  state: DestinationState;
}) => {
  if (state === "idle") return null;
  const look = LOOKS[state];
  const Icon = look.icon;
  return (
    <span className={cn(BADGE_CLASS, look.className)}>
      {Icon ? (
        <Icon
          size={11}
          aria-hidden
          className={cn(look.spin && "animate-spin")}
        />
      ) : (
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-destructive"
        />
      )}
      {look.label}
    </span>
  );
};
