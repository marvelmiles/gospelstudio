import { CircleStop, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { pauseSync, resumeAllSyncing } from "../syncControls";
import { requestSync } from "../syncEngine";
import { useSyncStore } from "../syncStore";
import { LiveSyncBadge } from "./LiveSyncBadge";
import { SyncStatusSummary } from "./SyncStatusSummary";

interface SyncActivityOverviewProps {
  accountId: string;
  itemCount: number;
  onStopAll: () => void;
}

export const SyncActivityOverview = ({
  accountId,
  itemCount,
  onStopAll,
}: SyncActivityOverviewProps) => {
  const isOnline = useOnlineStatus();
  const phase = useSyncStore((state) => state.phase);
  const pausedCount = useSyncStore((state) => state.queue.paused);
  const isPaused = phase === "paused";

  return (
    <Panel>
      <PanelTitle
        title="This device"
        icon={RefreshCw}
        info="Pause holds everything until you resume, and nothing is lost. Stop takes items off this device's list: changes that haven't uploaded stay on this device only, and files that haven't downloaded are skipped."
        trailing={<LiveSyncBadge />}
      />
      <SyncStatusSummary />
      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {isPaused ? (
          <Button onClick={() => resumeAllSyncing(accountId)}>
            <Play size={15} />
            Resume all
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={requestSync}
              disabled={!isOnline}
            >
              <RefreshCw size={15} />
              Sync now
            </Button>
            <Button variant="ghost" onClick={pauseSync}>
              <Pause size={15} />
              Pause all
            </Button>
            {pausedCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => resumeAllSyncing(accountId)}
              >
                <Play size={15} />
                Resume all
              </Button>
            )}
          </>
        )}
        {itemCount > 0 && (
          <Button
            variant="ghost"
            className="enabled:hover:text-destructive"
            onClick={onStopAll}
          >
            <CircleStop size={15} />
            Stop all
          </Button>
        )}
      </div>
    </Panel>
  );
};
