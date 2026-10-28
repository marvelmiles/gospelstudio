import { Wifi, WifiOff } from "lucide-react";
import { cn } from "../../lib/cn";
import type { PeerStatus } from "./lib/peerStatus";

export type StreamBadgeStatus =
  | "waiting"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "live"
  | "liveOnDisplay";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border border-line bg-raise text-sub",
  success: "bg-success/90 text-on-accent",
  warning: "bg-warning/92 text-on-accent",
  danger: "bg-danger/92 text-on-accent",
};

export const statusPillClassName = (isSmall: boolean): string =>
  cn(
    "inline-flex items-center rounded-full font-extrabold tracking-[0.4px] whitespace-nowrap",
    isSmall
      ? "gap-1 px-2 py-0.75 text-[10px]"
      : "gap-1.5 px-2.75 py-1.25 text-[11px]",
  );

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

export const connectionBadgeStatus = (
  status: PeerStatus,
  isProjecting: boolean,
): StreamBadgeStatus => {
  switch (status) {
    case "failed":
      return "disconnected";
    case "reconnecting":
      return "reconnecting";
    case "live":
      return isProjecting ? "liveOnDisplay" : "connected";
    default:
      return "connecting";
  }
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
    <span
      className={cn(statusPillClassName(isSmall), TONE_CLASSES[config.tone])}
    >
      <Icon size={isSmall ? 11 : 12} /> {label ?? config.label}
    </span>
  );
};
