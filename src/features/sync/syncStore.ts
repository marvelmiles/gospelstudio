import { create } from "zustand";
import type { SyncDirection } from "./syncItems";
import type { SyncResumeReason } from "./syncSettings";

export type SyncPhase =
  "off" | "paused" | "offline" | "idle" | "syncing" | "error";

interface SyncConsentRequest {
  accountId: string;
  pendingCount: number;
  reason: SyncResumeReason;
}

export interface SyncTransfer {
  key: string;
  direction: SyncDirection;
  loadedBytes: number;
  totalBytes: number | null;
}

export interface SyncQueueSummary {
  uploads: number;
  downloads: number;
  paused: number;
  failed: number;
}

interface SyncState {
  phase: SyncPhase;
  queue: SyncQueueSummary;
  lastSyncedAt: string | null;
  problem: string | null;
  activity: string | null;
  transfer: SyncTransfer | null;
  consent: SyncConsentRequest | null;
}

export const EMPTY_SYNC_QUEUE: SyncQueueSummary = {
  uploads: 0,
  downloads: 0,
  paused: 0,
  failed: 0,
};

export const useSyncStore = create<SyncState>()(() => ({
  phase: "off",
  queue: EMPTY_SYNC_QUEUE,
  lastSyncedAt: null,
  problem: null,
  activity: null,
  transfer: null,
  consent: null,
}));

export const showSyncActivity = (activity: string | null): void =>
  useSyncStore.setState({ activity });

export const showSyncTransfer = (transfer: SyncTransfer | null): void =>
  useSyncStore.setState({ transfer });

export const queuedItemCount = ({ uploads, downloads }: SyncQueueSummary) =>
  uploads + downloads;

export const movingItemCount = (queue: SyncQueueSummary): number =>
  Math.max(0, queuedItemCount(queue) - queue.paused - queue.failed);
