import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  MonitorSmartphone,
  PackageCheck,
  QrCode,
  RefreshCw,
  ScanLine,
  Share2,
  Unlink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { usePageMeta } from "../../hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { Spinner } from "@/components/ui/spinner";
import {
  pickedSelection,
  shareCatalog,
  type PickedShareItems,
} from "../../lib/shareCatalog";
import { IncomingShareDialog } from "./components/IncomingShareDialog";
import { PairDeviceDialog } from "./components/PairDeviceDialog";
import { ReceiveCodeDialog } from "./components/ReceiveCodeDialog";
import { ShareDeviceList } from "./components/ShareDeviceList";
import { ShareItemPicker } from "./components/ShareItemPicker";
import { ShareSendFab } from "./components/ShareSendFab";
import { useBackupSource } from "./lib/useBackupSource";
import { useIncomingShare } from "./lib/useIncomingShare";
import { canSendSelection, useQuickShare } from "./lib/useQuickShare";
import { useStopSharePrompt } from "./lib/useStopSharePrompt";
import { deviceListHint, type LobbyStatus } from "./lib/useShareLobby";
import type { PairedSender } from "./lib/useIncomingShare";

const SHARE_SUBTITLE =
  "Send your library straight to another device on this WiFi, with or without internet.";

type Step = "devices" | "items";

export const QuickSharePage = () => {
  usePageMeta("share");
  const source = useBackupSource();

  const [step, setStep] = useState<Step>("devices");
  const [picked, setPicked] = useState<PickedShareItems>({});
  const [isPairing, setIsPairing] = useState(false);
  const [isReceivingCode, setIsReceivingCode] = useState(false);

  const startOver = () => {
    setPicked({});
    setStep("devices");
  };
  const quickShare = useQuickShare({ onSent: startOver, onReset: startOver });
  const incoming = useIncomingShare(quickShare.room, quickShare.deviceId);
  const stopPrompt = useStopSharePrompt({
    isBusy: quickShare.isBusy,
    stopDevice: quickShare.stopDevice,
    stopAll: quickShare.stopAll,
    refresh: quickShare.refresh,
  });

  const tabs = useMemo(() => shareCatalog(source), [source]);
  const selection = useMemo(() => pickedSelection(picked), [picked]);
  const canSend = canSendSelection(quickShare, selection);

  const targetNames = quickShare.devices
    .filter((device) => quickShare.selectedDeviceIds.includes(device.id))
    .map((device) => device.name)
    .join(", ");

  return (
    <div className={pageClassName}>
      <PageHeader title="Quick Share" subtitle={SHARE_SUBTITLE} />

      <div
        className={cn(
          "mx-auto flex flex-col gap-4",
          step === "items" ? "max-w-215 pb-24" : "max-w-155",
        )}
      >
        <Panel>
          <PanelTitle
            icon={Share2}
            title="This device"
            info="While this page is open, other devices running Quick Share on the same WiFi can see this one and send it data. With no internet, choose Receive with a code and read the sending device's code instead. Close the page and it disappears from their list."
          />
          <div className="flex items-center gap-2.75">
            <DeviceBadge />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {quickShare.deviceName}
              </div>
              <LobbyStatusLine status={quickShare.status} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReceivingCode(true)}
            >
              <ScanLine size={14} />
              Receive with a code
            </Button>
            {quickShare.status !== "unavailable" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={stopPrompt.askForRefresh}
              >
                <RefreshCw size={14} />
                Refresh
              </Button>
            )}
          </div>
          <PairedSenderList
            senders={incoming.pairedSenders}
            onDisconnect={incoming.disconnectSender}
          />
        </Panel>

        {step === "devices" ? (
          <>
            <Panel>
              <PanelTitle
                icon={MonitorSmartphone}
                title="Devices here now"
                info="Open Quick Share on the other device. With internet, devices on the same WiFi show up here on their own. Without it, pair with a code: the two devices only need the same WiFi or hotspot, and nothing leaves it."
                trailing={
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={quickShare.isBusy}
                    onClick={() => setIsPairing(true)}
                  >
                    <QrCode size={14} />
                    Pair with a code
                  </Button>
                }
              />
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
            </Panel>

            <div className="flex justify-end">
              <Button
                disabled={quickShare.selectedDeviceIds.length === 0}
                onClick={() => setStep("items")}
                title={
                  quickShare.selectedDeviceIds.length === 0
                    ? "Choose at least one device first"
                    : "Choose what to send them"
                }
              >
                Choose what to send
                <ArrowRight size={15} />
              </Button>
            </div>
          </>
        ) : (
          <Panel>
            <PanelTitle
              icon={PackageCheck}
              title="What to send"
              info="Pick from any module; what you tick is kept as you move between them. Whatever arrives is merged into the other device's library, so nothing it already has is lost."
              trailing={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep("devices")}
                >
                  <ArrowLeft size={14} />
                  Devices
                </Button>
              }
            />
            <p className="mt-0 mb-3 text-[12.5px] text-subtle-foreground">
              Sending to{" "}
              <span className="text-foreground">
                {targetNames || "no device yet"}
              </span>
            </p>
            <ShareItemPicker
              tabs={tabs}
              picked={picked}
              disabled={quickShare.isBusy}
              onChange={setPicked}
            />
          </Panel>
        )}
      </div>

      {step === "items" && (
        <ShareSendFab
          canSend={canSend}
          isBusy={quickShare.isBusy}
          progress={quickShare.progress}
          onSend={() => void quickShare.send(selection)}
          onStop={stopPrompt.askForEverything}
        />
      )}

      <ConfirmDialog
        open={stopPrompt.prompt !== null}
        title={stopPrompt.prompt?.title ?? ""}
        message={stopPrompt.prompt?.message ?? ""}
        confirmLabel={stopPrompt.prompt?.confirmLabel ?? "Stop"}
        onConfirm={stopPrompt.confirm}
        onCancel={stopPrompt.cancel}
      />

      <PairDeviceDialog
        open={isPairing}
        deviceName={quickShare.deviceName}
        onClose={() => setIsPairing(false)}
        onPaired={(device) => quickShare.selectDevice(device.id)}
      />

      <ReceiveCodeDialog
        open={isReceivingCode}
        deviceName={quickShare.deviceName}
        onClose={() => setIsReceivingCode(false)}
        onConnected={incoming.adoptPairedLink}
      />

      <IncomingShareDialog
        incoming={incoming.incoming}
        onAccept={incoming.accept}
        onDecline={incoming.decline}
        onStop={incoming.stop}
      />
    </div>
  );
};

const DeviceBadge = () => (
  <span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-primary/14 text-primary-soft">
    <MonitorSmartphone size={19} />
  </span>
);

const statusLineClassName =
  "mt-0.75 flex items-center gap-1.5 text-xs text-subtle-foreground";

const LobbyStatusLine = ({ status }: { status: LobbyStatus }) => {
  if (status === "starting") {
    return (
      <span className={statusLineClassName}>
        <Spinner size={12} />
        Joining this network
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className={cn(statusLineClassName, "text-primary-soft")}>
        <Wifi size={13} />
        Visible to other devices here
      </span>
    );
  }
  return (
    <span className={statusLineClassName}>
      <WifiOff size={13} />
      {status === "offline"
        ? "No internet. Pair with a code to share over this WiFi."
        : "Pair with a code to share over this WiFi."}
    </span>
  );
};

interface PairedSenderListProps {
  senders: PairedSender[];
  onDisconnect: (senderId: string) => void;
}

const PairedSenderList = ({ senders, onDisconnect }: PairedSenderListProps) => {
  if (senders.length === 0) return null;
  return (
    <ul
      aria-label="Devices paired with a code"
      className="mt-3 mb-0 flex list-none flex-col gap-1.5 p-0"
    >
      {senders.map((sender) => (
        <li
          key={sender.id}
          className="flex items-center gap-2 rounded-[10px] border border-border bg-background py-1.5 pr-1.5 pl-2.75 text-[12.5px] text-muted-foreground"
        >
          <span className="min-w-0 flex-1 truncate">
            Can receive from{" "}
            <span className="font-semibold text-foreground">{sender.name}</span>
          </span>
          <IconButton
            icon={Unlink}
            size="sm"
            title={`Disconnect ${sender.name}`}
            onClick={() => onDisconnect(sender.id)}
          />
        </li>
      ))}
    </ul>
  );
};
