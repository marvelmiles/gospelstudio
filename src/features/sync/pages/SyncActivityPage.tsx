import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CircleCheck,
  CircleStop,
  CloudDownload,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import routes from "../../../routes";
import { OfflineNotice } from "../../account/components/OfflineNotice";
import { useAuthStore } from "../../account/session/authStore";
import type { SyncItemActions } from "../components/SyncActivityRow";
import { StopSyncDialog } from "../components/StopSyncDialog";
import { SyncActivityOverview } from "../components/SyncActivityOverview";
import { SyncQueueSection } from "../components/SyncQueueSection";
import { useSyncActivity } from "../hooks/useSyncActivity";
import type { SyncActivityItem } from "../syncActivity";
import {
  pauseSyncItems,
  resumeSyncItems,
  retrySyncItems,
  stopAllSyncing,
  stopSyncItems,
} from "../syncControls";
import { stopItemMessage, syncItemTitle } from "../syncItemLabels";

export const SyncActivityPage = () => {
  useDocumentTitle("Sync activity");
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const account = useAuthStore((state) => state.account);
  const activity = useSyncActivity();
  const [stoppingItem, setStoppingItem] = useState<SyncActivityItem | null>(
    null,
  );
  const [isStoppingAll, setIsStoppingAll] = useState(false);

  const actions = useMemo<SyncItemActions>(
    () => ({
      pause: (item) => pauseSyncItems([item]),
      resume: (item) => resumeSyncItems([item]),
      retry: (item) => void retrySyncItems([item]),
      stop: setStoppingItem,
    }),
    [],
  );

  if (status === "restoring") return <LoadingArea />;
  if (status === "unavailable")
    return <Navigate to={routes.dashboard()} replace />;
  if (status !== "signedIn" || !account)
    return <Navigate to={routes.signIn(routes.syncActivity())} replace />;

  const itemCount = activity
    ? activity.uploads.length + activity.downloads.length
    : 0;

  const confirmStopItem = () => {
    if (stoppingItem) void stopSyncItems([stoppingItem]);
    setStoppingItem(null);
  };

  const confirmStopAll = () => {
    void stopAllSyncing();
    setIsStoppingAll(false);
  };

  return (
    <div className={pageClassName}>
      <div className="mx-auto max-w-180">
        <PageHeader
          title="Sync activity"
          subtitle={`Everything moving between this device and ${account.churchName}`}
          actions={
            <Button variant="ghost" onClick={() => navigate(routes.account())}>
              <ArrowLeft />
              Account
            </Button>
          }
        />
        <OfflineNotice message="You're offline. Everything here waits on this device and syncs when you're back online." />
        <div className="grid gap-3.5">
          <SyncActivityOverview
            accountId={account.id}
            itemCount={itemCount}
            onStopAll={() => setIsStoppingAll(true)}
          />
          {!activity ? (
            <LoadingArea />
          ) : itemCount === 0 ? (
            <EmptyState
              compact
              icon={CircleCheck}
              title="Everything is in sync"
              message="When you change something here or on another device, it shows up on this page until it has synced."
            />
          ) : (
            <>
              <SyncQueueSection
                title="Sending from this device"
                icon={CloudUpload}
                info="Things you added, changed or removed on this device that your account and your other devices haven't received yet."
                items={activity.uploads}
                emptyMessage="Nothing is waiting to upload."
                actions={actions}
              />
              <SyncQueueSection
                title="Getting from your account"
                icon={CloudDownload}
                info="Pictures, videos and sounds from your other devices that this device is still downloading."
                items={activity.downloads}
                emptyMessage="Nothing is waiting to download."
                actions={actions}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={stoppingItem !== null}
        icon={CircleStop}
        title={
          stoppingItem
            ? `Stop syncing "${syncItemTitle(stoppingItem)}"?`
            : "Stop syncing?"
        }
        message={stoppingItem ? stopItemMessage(stoppingItem) : ""}
        confirmLabel="Stop"
        onConfirm={confirmStopItem}
        onCancel={() => setStoppingItem(null)}
      />
      <StopSyncDialog
        open={isStoppingAll}
        itemCount={itemCount}
        onConfirm={confirmStopAll}
        onCancel={() => setIsStoppingAll(false)}
      />
    </div>
  );
};
