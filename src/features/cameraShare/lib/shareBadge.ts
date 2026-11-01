import type { ConnectionBadgeStatus } from "../../pairing/lib/connectionBadge";
import type { ConnectionPhase } from "../../pairing/lib/useConnectionLifecycle";

export type BroadcastPhase =
  "starting" | "waiting" | "connecting" | "live" | "reconnecting" | "failed";

export const broadcastPhaseBadge = (
  phase: BroadcastPhase,
  isViewerLive: boolean,
): ConnectionBadgeStatus => {
  switch (phase) {
    case "connecting":
      return "connecting";
    case "live":
      return isViewerLive ? "liveOnDisplay" : "connected";
    case "reconnecting":
      return "reconnecting";
    case "failed":
      return "disconnected";
    default:
      return "waiting";
  }
};

export const connectionPhaseBadge = (
  phase: ConnectionPhase,
  isViewerLive: boolean,
): ConnectionBadgeStatus => {
  switch (phase) {
    case "connected":
      return isViewerLive ? "liveOnDisplay" : "connected";
    case "reconnecting":
      return "reconnecting";
    case "disconnected":
      return "disconnected";
    default:
      return "waiting";
  }
};
