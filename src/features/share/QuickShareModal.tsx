import { useMemo, useState } from "react";
import {
  QrCode,
  RefreshCw,
  SendHorizontal,
  Share2,
  Square,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button, IconButton } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { describeSelection, selectionBytes } from "../../lib/backupPayload";
import { selectionFrom, type BackupRecordRef } from "../../lib/shareSelection";
import { formatBytes } from "../../lib/storageStats";
import { PairDeviceDialog } from "./components/PairDeviceDialog";
import { ShareDeviceList } from "./components/ShareDeviceList";
import { useBackupSource } from "./lib/useBackupSource";
import { canSendSelection, useQuickShare } from "./lib/useQuickShare";
import { useStopSharePrompt } from "./lib/useStopSharePrompt";
import { deviceListHint } from "./lib/useShareLobby";

interface QuickShareModalProps {
  records: BackupRecordRef[];
  title: string;
  onClose: () => void;
}

export const QuickShareModal = ({
  records,
  title,
  onClose,
}: QuickShareModalProps) => {
  const source = useBackupSource();
  const quickShare = useQuickShare({ announce: false, onSent: onClose });
  const [isPairing, setIsPairing] = useState(false);
  const stopPrompt = useStopSharePrompt({
    isBusy: quickShare.isBusy,
    stopDevice: quickShare.stopDevice,
    stopAll: quickShare.stopAll,
    refresh: quickShare.refresh,
  });

  const selection = useMemo(() => selectionFrom(records), [records]);
  const summary = useMemo(
    () => describeSelection(source, selection),
    [selection, source],
  );
  const bytes = useMemo(
    () => selectionBytes(source, selection),
    [selection, source],
  );

  const canSend = canSendSelection(quickShare, selection);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        dismissible={!quickShare.isBusy}
        title="Quick Share"
        width={460}
        headerActions={
          quickShare.status === "unavailable" ? undefined : (
            <IconButton
              icon={RefreshCw}
              title="Look again for devices"
              onClick={stopPrompt.askForRefresh}
            />
          )
        }
        footer={
          quickShare.isBusy ? (
            <Button variant="danger" onClick={stopPrompt.askForEverything}>
              <Square size={14} />
              Stop
            </Button>
          ) : (
            <>
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!canSend}
                onClick={() => void quickShare.send(selection)}
              >
                <SendHorizontal size={15} />
                {quickShare.selectedDeviceIds.length > 1
                  ? `Send to ${quickShare.selectedDeviceIds.length}`
                  : "Send"}
              </Button>
            </>
          )
        }
      >
        <p className="mt-0 mb-3 text-[12.5px] leading-[1.6] text-sub">
          Sending <strong className="text-fg">{title}</strong>: {summary}
          {bytes > 0 ? ` (about ${formatBytes(bytes)})` : ""}. Anything it
          needs, such as its background or sound, travels with it.
        </p>

        <p className="mt-0 mb-2 text-[12.5px] leading-[1.6] text-sub">
          <Share2 size={13} className="inline align-[-2px]" /> The other device
          needs the Quick Share page open.
        </p>
        <ShareDeviceList
          devices={quickShare.devices}
          selectedIds={quickShare.selectedDeviceIds}
          transfers={quickShare.transfers}
          isSearching={quickShare.isSearching}
          emptyHint={deviceListHint(quickShare.status)}
          disabled={quickShare.isBusy}
          onToggle={quickShare.toggleDevice}
          onStop={stopPrompt.askForDevice}
          onForget={(device) => quickShare.forgetDevice(device.id)}
        />
        <div className="mt-2.5">
          <Button
            variant="ghost"
            size="sm"
            disabled={quickShare.isBusy}
            onClick={() => setIsPairing(true)}
          >
            <QrCode size={14} />
            Pair with a code
          </Button>
        </div>
      </Modal>

      <PairDeviceDialog
        open={isPairing}
        deviceName={quickShare.deviceName}
        onClose={() => setIsPairing(false)}
        onPaired={(device) => quickShare.selectDevice(device.id)}
      />

      <ConfirmDialog
        open={stopPrompt.prompt !== null}
        title={stopPrompt.prompt?.title ?? ""}
        message={stopPrompt.prompt?.message ?? ""}
        confirmLabel={stopPrompt.prompt?.confirmLabel ?? "Stop"}
        onConfirm={stopPrompt.confirm}
        onCancel={stopPrompt.cancel}
      />
    </>
  );
};
