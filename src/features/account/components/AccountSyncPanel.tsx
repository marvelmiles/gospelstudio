import { CloudUpload, Pause, RefreshCw, TriangleAlert } from "lucide-react";
import type { StorageUsage } from "@/contracts/accountContract";
import { cn } from "../../../lib/utils";
import { formatCountLabel } from "../../../lib/formatNumber";
import { formatBytes } from "../../../lib/storageStats";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { requestSync } from "../../sync/syncEngine";
import { pauseSync, turnOnSync } from "../../sync/syncControls";
import { useSyncStore } from "../../sync/syncStore";
import { useSyncStatus } from "../../sync/useSyncStatus";

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
  const isOnline = useOnlineStatus();
  const phase = useSyncStore((state) => state.phase);
  const tooLargeCount = useSyncStore((state) => state.tooLargeCount);
  const status = useSyncStatus();
  const StatusIcon = status.icon;

  return (
    <Panel>
      <PanelTitle
        title="Sync"
        icon={RefreshCw}
        info="Everything you create or change on this device, from manuscripts and Bible passages to pictures, videos, themes and Studio productions, is saved here first and then synced to your account in the background. GospelStudio keeps working offline either way."
      />
      <div className="flex items-start gap-3" aria-live="polite">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            phase === "error"
              ? "bg-destructive/14 text-destructive"
              : "bg-primary/14 text-primary-soft",
          )}
        >
          <StatusIcon
            size={18}
            aria-hidden
            className={cn(phase === "syncing" && "animate-spin")}
          />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-foreground">
            {status.title}
          </div>
          <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
            {status.detail}
          </p>
        </div>
      </div>

      {tooLargeCount > 0 && (
        <p className="mt-3 mb-0 flex items-start gap-2 text-[12.5px] leading-relaxed text-warning-foreground">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {formatCountLabel(tooLargeCount, "item")}{" "}
          {tooLargeCount === 1 ? "is" : "are"} too large to sync and will stay
          on this device only.
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        {phase === "paused" ? (
          <Button onClick={() => turnOnSync(accountId)}>
            <CloudUpload size={15} />
            Turn on sync
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={requestSync}
              disabled={!isOnline || phase === "syncing"}
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
      </div>

      {storage && <StorageMeter {...storage} />}
    </Panel>
  );
};
