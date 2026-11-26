import { CloudUpload } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCountLabel } from "../../../lib/formatNumber";
import { keepSyncPaused, turnOnSync } from "../syncControls";
import { useSyncStore, type SyncConsentRequest } from "../syncStore";

const LATER_HINT = "You can also turn sync on later from Account.";

const messageFor = ({ pendingCount, joiningAccount }: SyncConsentRequest) => {
  const them = pendingCount === 1 ? "it" : "them";
  return joiningAccount
    ? `This device has ${formatCountLabel(pendingCount, "item")} that ${pendingCount === 1 ? "isn't" : "aren't"} in your account yet. Syncing adds ${them} to your account and brings your account's library to this device. It runs in the background while you keep working. ${LATER_HINT}`
    : `You made ${formatCountLabel(pendingCount, "change")} on this device while you were signed out. Sync ${them} to your account now? It runs in the background while you keep working. ${LATER_HINT}`;
};

export const SyncConsentDialog = () => {
  const consent = useSyncStore((state) => state.consent);
  if (!consent) return null;

  return (
    <ConfirmDialog
      open
      tone="default"
      icon={CloudUpload}
      title="Sync this device with your account?"
      message={messageFor(consent)}
      confirmLabel="Sync now"
      cancelLabel="Not now"
      onConfirm={() => turnOnSync(consent.accountId)}
      onCancel={() => void keepSyncPaused(consent.accountId)}
    />
  );
};
