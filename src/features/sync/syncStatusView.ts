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
import { formatBytes } from "../../lib/storageStats";
import type { SyncDirection } from "./syncItems";
import {
  movingItemCount,
  type SyncPhase,
  type SyncQueueSummary,
  type SyncTransfer,
} from "./syncStore";

export interface SyncTransferView {
  direction: SyncDirection;
  totalBytes: number | null;
  percent: number | null;
}

export interface SyncStatusInput {
  phase: SyncPhase;
  queue: SyncQueueSummary;
  lastSyncedAt: string | null;
  problem: string | null;
  activity: string | null;
  transfer: SyncTransferView | null;
  live: boolean;
}

export interface SyncStatusView {
  title: string;
  detail: string;
  icon: LucideIcon;
}

const itemCount = (count: number): string => formatCountLabel(count, "item");

const isOrAre = (count: number): string => (count === 1 ? "is" : "are");

export const transferPercent = ({
  loadedBytes,
  totalBytes,
}: SyncTransfer): number | null =>
  totalBytes && totalBytes > 0
    ? Math.min(100, Math.floor((loadedBytes / totalBytes) * 100))
    : null;

export const describeTransfer = ({
  direction,
  totalBytes,
  percent,
}: SyncTransferView): string => {
  const size = totalBytes ? ` (${formatBytes(totalBytes)})` : "";
  if (direction === "upload") return `Uploading a file${size}.`;
  return percent === null
    ? `Downloading a file${size}.`
    : `Downloading a file${size}, ${percent}% done.`;
};

const waitingDetail = ({ uploads }: SyncQueueSummary): string =>
  uploads > 0
    ? `${itemCount(uploads)} on this device ${isOrAre(uploads)} waiting.`
    : "Changes you make stay on this device until you turn it on.";

const upToDateDetail = (lastSyncedAt: string | null, live: boolean): string => {
  const synced = lastSyncedAt
    ? `Last synced ${timeAgo(lastSyncedAt)}.`
    : "Your library is in sync.";
  return live
    ? `${synced} Changes from your other devices arrive as they happen.`
    : synced;
};

const idleStatus = (
  queue: SyncQueueSummary,
  lastSyncedAt: string | null,
  live: boolean,
): SyncStatusView => {
  const moving = movingItemCount(queue);
  if (queue.failed > 0)
    return {
      title: "Some items need attention",
      detail: `${itemCount(queue.failed)} couldn't sync. Open sync activity to see why.`,
      icon: CircleAlert,
    };
  if (moving > 0)
    return {
      title: "Waiting to sync",
      detail: `${itemCount(moving)} will sync in a moment.`,
      icon: RefreshCw,
    };
  return {
    title: "Up to date",
    detail:
      queue.paused > 0
        ? `${itemCount(queue.paused)} you paused ${isOrAre(queue.paused)} waiting for you.`
        : upToDateDetail(lastSyncedAt, live),
    icon: CircleCheck,
  };
};

export const describeSyncStatus = ({
  phase,
  queue,
  lastSyncedAt,
  problem,
  activity,
  transfer,
  live,
}: SyncStatusInput): SyncStatusView => {
  switch (phase) {
    case "syncing":
      return {
        title: "Syncing",
        detail: transfer
          ? describeTransfer(transfer)
          : (activity ?? "Saving your changes and checking for new ones."),
        icon: RefreshCw,
      };
    case "paused":
      return {
        title: "Sync is paused on this device",
        detail: waitingDetail(queue),
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
      return idleStatus(queue, lastSyncedAt, live);
    case "off":
      return {
        title: "Signed in",
        detail: "Sync starts in a moment.",
        icon: CircleUserRound,
      };
  }
};
