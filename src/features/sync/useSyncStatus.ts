import { useShallow } from "zustand/react/shallow";
import {
  describeSyncStatus,
  transferPercent,
  type SyncStatusView,
} from "./syncStatusView";
import { useSyncStore } from "./syncStore";
import { useRealtimeStore } from "../realtime/realtimeStore";

/* Selects plain values, not the transfer object, so the header re-renders when the shown percentage changes rather than on every downloaded chunk. */
export const useSyncStatus = (): SyncStatusView => {
  const live = useRealtimeStore((state) => state.status === "connected");
  const { transferDirection, transferTotalBytes, transferProgress, ...status } =
    useSyncStore(
      useShallow((state) => ({
        phase: state.phase,
        queue: state.queue,
        lastSyncedAt: state.lastSyncedAt,
        problem: state.problem,
        activity: state.activity,
        transferDirection: state.transfer?.direction ?? null,
        transferTotalBytes: state.transfer?.totalBytes ?? null,
        transferProgress: state.transfer
          ? transferPercent(state.transfer)
          : null,
      })),
    );
  return describeSyncStatus({
    ...status,
    live,
    transfer: transferDirection
      ? {
          direction: transferDirection,
          totalBytes: transferTotalBytes,
          percent: transferProgress,
        }
      : null,
  });
};
