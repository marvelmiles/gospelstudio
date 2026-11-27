import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CircleStop,
  ListChecks,
  Pause,
  Play,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import type { StorageUsage } from "@/contracts/accountContract";
import { formatCount, formatCountLabel } from "../../../lib/formatNumber";
import { formatBytes } from "../../../lib/storageStats";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import routes from "../../../routes";
import { LiveSyncBadge } from "../../sync/components/LiveSyncBadge";
import { StopSyncDialog } from "../../sync/components/StopSyncDialog";
import { SyncStatusSummary } from "../../sync/components/SyncStatusSummary";
import { requestSync } from "../../sync/syncEngine";
import { pauseSync, stopAllSyncing, turnOnSync } from "../../sync/syncControls";
import { queuedItemCount, useSyncStore } from "../../sync/syncStore";

interface AccountSyncPanelProps {
  accountId: string;
  storage: StorageUsage | null;
}

const StorageMeter = ({ usedBytes, quotaBytes }: StorageUsage) => {
  const percent = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
  return (
    <div className="mt-4 border-t pt-3.5">
      <div className="mb-1.5 flex flex-wrap justify-between gap-2 text-[12.5px] text-muted-foreground">
        <span>Cloud storage</span>
        <span className="tabular-nums">
          {formatBytes(usedBytes)} of {formatBytes(quotaBytes)}
        </span>
      </div>
      <Progress
        value={Math.min(100, percent)}
        aria-label={`Cloud storage ${Math.round(percent)}% used`}
      />
    </div>
  );
};

export const AccountSyncPanel = ({
  accountId,
  storage,
}: AccountSyncPanelProps) => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const phase = useSyncStore((state) => state.phase);
  const queue = useSyncStore((state) => state.queue);
  const [isStopping, setIsStopping] = useState(false);
  const itemCount = queuedItemCount(queue);

  const confirmStop = () => {
    void stopAllSyncing();
    setIsStopping(false);
  };

  return (
    <Panel>
      <PanelTitle
        title="Sync"
        icon={RefreshCw}
        info="Everything you create or change on this device, from manuscripts and Bible passages to pictures, videos, themes and Studio productions, is saved here first and then synced to your account in the background. Changes from your other devices arrive the same way, and removing something on one device removes it everywhere. GospelStudio keeps working offline either way."
        trailing={<LiveSyncBadge />}
      />
      <SyncStatusSummary />

      {queue.failed > 0 && (
        <p className="mt-3 mb-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-warning-foreground">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {formatCountLabel(queue.failed, "item")}{" "}
          {queue.failed === 1 ? "needs" : "need"} your attention. Open sync
          activity to see why and try again.
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {phase === "paused" ? (
          <Button onClick={() => turnOnSync(accountId)}>
            <Play size={15} />
            Resume sync
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
              Pause sync
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => navigate(routes.syncActivity())}>
          <ListChecks size={15} />
          Sync activity
          {itemCount > 0 && (
            <span className="rounded-full bg-primary/14 px-1.75 py-px text-[11.5px] text-primary-soft tabular-nums">
              {formatCount(itemCount)}
            </span>
          )}
        </Button>
        {itemCount > 0 && (
          <Button
            variant="ghost"
            className="enabled:hover:text-destructive"
            onClick={() => setIsStopping(true)}
          >
            <CircleStop size={15} />
            Stop sync
          </Button>
        )}
      </div>

      {storage && <StorageMeter {...storage} />}

      <StopSyncDialog
        open={isStopping}
        itemCount={itemCount}
        onConfirm={confirmStop}
        onCancel={() => setIsStopping(false)}
      />
    </Panel>
  );
};
