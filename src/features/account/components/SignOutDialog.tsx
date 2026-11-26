import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCountLabel } from "../../../lib/formatNumber";
import { useSyncStore } from "../../sync/syncStore";
import type { SignOutFlow } from "../hooks/useSignOut";

const STAYS_HERE =
  "Your library stays on this device and GospelStudio keeps working offline. Next time you sign in, you can sync anything you change while signed out.";

interface SignOutDialogProps {
  flow: SignOutFlow;
}

export const SignOutDialog = ({ flow }: SignOutDialogProps) => {
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const phase = useSyncStore((state) => state.phase);

  const waitingNote =
    pendingCount === 0
      ? ""
      : phase === "paused" || phase === "offline"
        ? ` ${formatCountLabel(pendingCount, "change")} ${pendingCount === 1 ? "hasn't" : "haven't"} synced yet and will wait on this device.`
        : ` ${formatCountLabel(pendingCount, "change")} will try to sync first.`;

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
