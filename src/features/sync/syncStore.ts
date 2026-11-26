import { create } from "zustand";

export type SyncPhase =
  "off" | "paused" | "offline" | "idle" | "syncing" | "error";

export interface SyncConsentRequest {
  accountId: string;
  pendingCount: number;
  joiningAccount: boolean;
}

interface SyncState {
  phase: SyncPhase;
  pendingCount: number;
  tooLargeCount: number;
  lastSyncedAt: string | null;
  problem: string | null;
  activity: string | null;
  consent: SyncConsentRequest | null;
}

export const useSyncStore = create<SyncState>()(() => ({
  phase: "off",
  pendingCount: 0,
  tooLargeCount: 0,
  lastSyncedAt: null,
  problem: null,
  activity: null,
  consent: null,
}));

export const showSyncActivity = (activity: string | null): void =>
  useSyncStore.setState({ activity });
