import { cn } from "../../../lib/utils";
import type { PeerStatus } from "./peerStatus";

export type StreamBadgeStatus =
  | "waiting"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "live"
  | "liveOnDisplay";

export const statusPillClassName = (isSmall: boolean): string =>
  cn(
    "inline-flex items-center rounded-full font-extrabold tracking-[0.4px] whitespace-nowrap",
    isSmall
      ? "gap-1 px-2 py-0.75 text-[10px]"
      : "gap-1.5 px-2.75 py-1.25 text-[11px]",
  );

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
