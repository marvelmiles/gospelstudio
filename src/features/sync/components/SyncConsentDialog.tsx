import { CloudUpload } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCountLabel } from "../../../lib/formatNumber";
import { keepSyncPaused, turnOnSync } from "../syncControls";
import { useSyncStore, type SyncConsentRequest } from "../syncStore";

const messageFor = ({ pendingCount, joiningAccount }: SyncConsentRequest) =>
  joiningAccount
    ? `Add ${formatCountLabel(pendingCount, "item")} from this device to your account and bring your library here.`
    : `Sync ${formatCountLabel(pendingCount, "change")} you made while signed out to your account.`;

export const SyncConsentDialog = () => {
  const consent = useSyncStore((state) => state.consent);
  if (!consent) return null;

  return (
    <ConfirmDialog
      open
      tone="default"
      icon={CloudUpload}
      title="Sync this device?"
      message={messageFor(consent)}
      confirmLabel="Sync now"
      cancelLabel="Not now"
      onConfirm={() => turnOnSync(consent.accountId)}
      onCancel={() => void keepSyncPaused(consent.accountId)}
    />
  );
};
