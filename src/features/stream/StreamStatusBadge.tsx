import { Wifi, WifiOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "@/components/ui/badge";
import { statusPillClassName, type StreamBadgeStatus } from "./lib/streamBadge";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border border-border bg-secondary text-muted-foreground",
  success: "bg-success/90 text-primary-foreground",
  warning: "bg-warning/92 text-primary-foreground",
  danger: "bg-destructive/92 text-primary-foreground",
};

const BADGE_CONFIG: Record<
  StreamBadgeStatus,
  { label: string; tone: BadgeTone }
> = {
  waiting: { label: "Waiting", tone: "neutral" },
  connecting: { label: "Connecting", tone: "neutral" },
  connected: { label: "Connected", tone: "success" },
  reconnecting: { label: "Reconnecting", tone: "warning" },
  disconnected: { label: "Disconnected", tone: "danger" },
  live: { label: "Live", tone: "danger" },
  liveOnDisplay: { label: "Live on display", tone: "danger" },
};

interface StreamStatusBadgeProps {
  status: StreamBadgeStatus;
  label?: string;
  size?: "sm" | "md";
}

export const StreamStatusBadge = ({
  status,
  label,
  size = "md",
}: StreamStatusBadgeProps) => {
  const config = BADGE_CONFIG[status];
  const isSmall = size === "sm";
  const Icon = status === "disconnected" ? WifiOff : Wifi;

  return (
    <Badge
      className={cn(
        statusPillClassName(isSmall),
        TONE_CLASSES[config.tone],
        isSmall ? "[&>svg]:size-2.75" : "[&>svg]:size-3",
      )}
    >
      <Icon /> {label ?? config.label}
    </Badge>
  );
};
