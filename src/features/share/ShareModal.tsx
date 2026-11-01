import { useMemo, useState } from "react";
import {
  QrCode,
  RefreshCw,
  SendHorizontal,
  Share2,
  Square,
} from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { describeSelection, selectionBytes } from "../../lib/backupPayload";
import { selectionFrom, type BackupRecordRef } from "../../lib/shareSelection";
import { formatBytes } from "../../lib/storageStats";
import { PairDeviceDialog } from "./components/PairDeviceDialog";
import { ShareDeviceList } from "./components/ShareDeviceList";
import { useBackupSource } from "./lib/useBackupSource";
import { canSendSelection, useShareSession } from "./lib/useShareSession";
import { useStopSharePrompt } from "./lib/useStopSharePrompt";
import { deviceListHint } from "./lib/useShareLobby";

interface ShareModalProps {
  records: BackupRecordRef[];
  title: string;
  onClose: () => void;
}

export const ShareModal = ({ records, title, onClose }: ShareModalProps) => {
  const source = useBackupSource();
  const sharing = useShareSession({ announce: false, onSent: onClose });
  const [isPairing, setIsPairing] = useState(false);
  const stopPrompt = useStopSharePrompt({
    isBusy: sharing.isBusy,
    stopDevice: sharing.stopDevice,
    stopAll: sharing.stopAll,
    refresh: sharing.refresh,
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

  const canSend = canSendSelection(sharing, selection);

  return (
    <>
      <Modal
        open
        onClose={onClose}
        dismissible={!sharing.isBusy}
        title="Share"
        width={460}
        headerActions={
          sharing.status === "unavailable" ? undefined : (
            <IconButton
              icon={RefreshCw}
              title="Look again for devices"
              onClick={stopPrompt.askForRefresh}
            />
          )
        }
        footer={
          sharing.isBusy ? (
            <Button variant="destructive" onClick={stopPrompt.askForEverything}>
              <Square size={14} />
              Stop
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={!canSend}
                onClick={() => void sharing.send(selection)}
              >
                <SendHorizontal size={15} />
                {sharing.selectedDeviceIds.length > 1
                  ? `Send to ${sharing.selectedDeviceIds.length}`
                  : "Send"}
              </Button>
            </>
          )
        }
      >
        <p className="mt-0 mb-3 text-[12.5px] leading-[1.6] text-muted-foreground">
          Sending <strong className="text-foreground">{title}</strong>:{" "}
          {summary}
          {bytes > 0 ? ` (about ${formatBytes(bytes)})` : ""}. Anything it
          needs, such as its background or sound, travels with it.
        </p>

        <p className="mt-0 mb-2 text-[12.5px] leading-[1.6] text-muted-foreground">
          <Share2 size={13} className="inline align-[-2px]" /> The other device
          needs the Share page open.
        </p>
        <ShareDeviceList
          devices={sharing.devices}
          selectedIds={sharing.selectedDeviceIds}
          transfers={sharing.transfers}
          isSearching={sharing.isSearching}
          emptyHint={deviceListHint(sharing.status)}
          disabled={sharing.isBusy}
          onToggle={sharing.toggleDevice}
          onStop={stopPrompt.askForDevice}
          onForget={(device) => sharing.forgetDevice(device.id)}
        />
        <div className="mt-2.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={sharing.isBusy}
            onClick={() => setIsPairing(true)}
          >
            <QrCode size={14} />
            Pair with a code
          </Button>
        </div>
      </Modal>

      <PairDeviceDialog
        open={isPairing}
        deviceName={sharing.deviceName}
        onClose={() => setIsPairing(false)}
        onPaired={(device) => sharing.selectDevice(device.id)}
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
