import { useShallow } from "zustand/react/shallow";
import { describeSyncStatus, type SyncStatusView } from "./syncStatusView";
import { useSyncStore } from "./syncStore";

export const useSyncStatus = (): SyncStatusView =>
  describeSyncStatus(
    useSyncStore(
      useShallow((state) => ({
        phase: state.phase,
        pendingCount: state.pendingCount,
        lastSyncedAt: state.lastSyncedAt,
        problem: state.problem,
        activity: state.activity,
      })),
    ),
  );
