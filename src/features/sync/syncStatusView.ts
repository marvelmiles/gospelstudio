import {
  CircleAlert,
  CircleCheck,
  CircleUserRound,
  CloudOff,
  RefreshCw,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { formatCountLabel } from "../../lib/formatNumber";
import { timeAgo } from "../../lib/id";
import type { SyncPhase } from "./syncStore";

export interface SyncStatusInput {
  phase: SyncPhase;
  pendingCount: number;
  lastSyncedAt: string | null;
  problem: string | null;
  activity: string | null;
}

export interface SyncStatusView {
  title: string;
  detail: string;
  icon: LucideIcon;
}

const waitingDetail = (pendingCount: number): string =>
  pendingCount > 0
    ? `${formatCountLabel(pendingCount, "change")} on this device ${pendingCount === 1 ? "is" : "are"} waiting.`
    : "Changes you make stay on this device until you turn it on.";

export const describeSyncStatus = ({
  phase,
  pendingCount,
  lastSyncedAt,
  problem,
  activity,
}: SyncStatusInput): SyncStatusView => {
  switch (phase) {
    case "syncing":
      return {
        title: "Syncing",
        detail: activity ?? "Saving your changes and checking for new ones.",
        icon: RefreshCw,
      };
    case "paused":
      return {
        title: "Sync is off on this device",
        detail: waitingDetail(pendingCount),
        icon: CloudOff,
      };
    case "offline":
      return {
        title: "Offline",
        detail:
          "Keep working. Changes are saved on this device and sync when you're back online.",
        icon: WifiOff,
      };
    case "error":
      return {
        title: "Sync needs attention",
        detail: problem ?? "Sync will try again shortly.",
        icon: CircleAlert,
      };
    case "idle":
      return {
        title: pendingCount > 0 ? "Waiting to sync" : "Up to date",
        detail:
          pendingCount > 0
            ? `${formatCountLabel(pendingCount, "change")} will sync in a moment.`
            : lastSyncedAt
              ? `Last synced ${timeAgo(lastSyncedAt)}.`
              : "Your library is in sync.",
        icon: CircleCheck,
      };
    case "off":
      return {
        title: "Signed in",
        detail: "Sync starts in a moment.",
        icon: CircleUserRound,
      };
  }
};
