import { LogOut, TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCountLabel } from "../../../lib/formatNumber";
import { movingItemCount, useSyncStore } from "../../sync/syncStore";
import type { SignOutFlow } from "../hooks/useSignOut";

const STAYS_HERE =
  "Your library stays on this device and GospelStudio keeps working offline. Next time you sign in, you can sync anything you change while signed out.";

interface SignOutDialogProps {
  flow: SignOutFlow;
}

const itemCount = (count: number): string => formatCountLabel(count, "item");

export const SignOutDialog = ({ flow }: SignOutDialogProps) => {
  const phase = useSyncStore((state) => state.phase);
  const queue = useSyncStore((state) => state.queue);
  const isTransferring = useSyncStore((state) => state.transfer !== null);

  const isSyncOn = phase !== "paused" && phase !== "offline" && phase !== "off";
  const moving = movingItemCount(queue);
  const isSyncInProgress = isSyncOn && (isTransferring || moving > 0);

  if (isSyncInProgress) {
    const count = Math.max(1, moving);
    return (
      <ConfirmDialog
        open={flow.confirming}
        tone="default"
        icon={TriangleAlert}
        title="Sync is in progress"
        message={`${itemCount(count)} ${count === 1 ? "is" : "are"} still syncing between this device and your account. If you sign out now, sync gets a few seconds to finish, then anything left waits on this device until you sign in again. Your library stays here and keeps working offline.`}
        confirmLabel="Sign out anyway"
        cancelLabel="Keep syncing"
        onConfirm={flow.confirm}
        onCancel={flow.cancel}
      />
    );
  }

  const waitingNote =
    queue.uploads > 0
      ? ` ${itemCount(queue.uploads)} ${queue.uploads === 1 ? "hasn't" : "haven't"} synced yet and will wait on this device.`
      : "";

  return (
    <ConfirmDialog
      open={flow.confirming}
      tone="default"
      icon={LogOut}
      title="Sign out of this device?"
      message={`${STAYS_HERE}${waitingNote}`}
      confirmLabel="Sign out"
      onConfirm={flow.confirm}
      onCancel={flow.cancel}
    />
  );
};
