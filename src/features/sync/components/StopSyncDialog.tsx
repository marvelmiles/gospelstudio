import { CircleStop } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCountLabel } from "../../../lib/formatNumber";

interface StopSyncDialogProps {
  open: boolean;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const StopSyncDialog = ({
  open,
  itemCount,
  onConfirm,
  onCancel,
}: StopSyncDialogProps) => (
  <ConfirmDialog
    open={open}
    icon={CircleStop}
    title={`Stop syncing ${formatCountLabel(itemCount, "item")}?`}
    message="Changes on this device that haven't uploaded yet stay on this device only, and files that haven't downloaded won't be here. Changes you make after this still sync."
    confirmLabel="Stop all"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
