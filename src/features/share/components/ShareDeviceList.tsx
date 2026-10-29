import {
  Check,
  CircleCheck,
  MonitorSmartphone,
  Square,
  Unlink,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { IconButton } from "@/components/shared/IconButton";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Spinner } from "@/components/ui/spinner";
import { formatBytes } from "../../../lib/storageStats";
import {
  isTransferActive,
  transferPercent,
  type OutgoingShare,
  type OutgoingShareMap,
} from "../lib/useOutgoingShares";
import type { ShareDevice } from "../lib/shareSignaling";

interface ShareDeviceListProps {
  devices: ShareDevice[];
  selectedIds: readonly string[];
  transfers: OutgoingShareMap;
  isSearching: boolean;
  emptyHint: string;
  disabled: boolean;
  onToggle: (deviceId: string) => void;
  onStop: (device: ShareDevice) => void;
  onForget: (device: ShareDevice) => void;
}

export const ShareDeviceList = ({
  devices,
  selectedIds,
  transfers,
  isSearching,
  emptyHint,
  disabled,
  onToggle,
  onStop,
  onForget,
}: ShareDeviceListProps) => {
  const selected = new Set(selectedIds);

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6.5 text-center">
        {isSearching && <Spinner size={20} />}
        <span className="max-w-80 text-[13px] leading-[1.6] text-muted-foreground">
          {isSearching ? "Looking for devices on this WiFi" : emptyHint}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {devices.map((device) => (
        <ShareDeviceRow
          key={device.id}
          device={device}
          transfer={transfers[device.id]}
          isSelected={selected.has(device.id)}
          disabled={disabled}
          onToggle={() => onToggle(device.id)}
          onStop={() => onStop(device)}
          onForget={() => onForget(device)}
        />
      ))}
    </div>
  );
};

const STATUS_LABEL: Partial<Record<OutgoingShare["state"], string>> = {
  queued: "Waiting",
  connecting: "Connecting",
  asking: "Connecting",
  importing: "Finishing",
  done: "Sent",
};

interface ShareDeviceRowProps {
  device: ShareDevice;
  transfer: OutgoingShare | undefined;
  isSelected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onStop: () => void;
  onForget: () => void;
}

const ShareDeviceRow = ({
  device,
  transfer,
  isSelected,
  disabled,
  onToggle,
  onStop,
  onForget,
}: ShareDeviceRowProps) => {
  const isActive = transfer ? isTransferActive(transfer.state) : false;
  const isDone = transfer?.state === "done";
  const isPickable = !transfer && !disabled;
  const highlighted = isSelected && !transfer;

  const status =
    transfer?.state === "sending"
      ? `${formatBytes(transfer.sentBytes)} of ${formatBytes(transfer.totalBytes)}`
      : transfer
        ? (STATUS_LABEL[transfer.state] ?? "")
        : device.isPaired
          ? "Paired with a code"
          : "";

  return (
    <div
      className={cn(
        "flex items-center gap-2.75 rounded-xl border px-3 py-2.75 transition-opacity duration-150",
        highlighted
          ? "border-primary bg-primary/12"
          : "border-border bg-background",
        disabled && !transfer && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={device.name}
        disabled={!isPickable}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2.75 border-none bg-transparent p-0 text-left disabled:cursor-default"
      >
        <span className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-primary/14 text-primary-soft">
          <MonitorSmartphone size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-foreground">
            {device.name}
          </span>
          {status && (
            <span
              className={cn(
                "mt-0.5 block truncate text-[11.5px] tabular-nums",
                isDone ? "text-primary-soft" : "text-subtle-foreground",
              )}
            >
              {status}
            </span>
          )}
        </span>
        {!transfer && (
          <span
            aria-hidden
            className={cn(
              "grid size-5 shrink-0 place-items-center rounded-[7px] border text-primary-foreground",
              isSelected
                ? "border-primary bg-primary"
                : "border-input bg-transparent",
            )}
          >
            {isSelected && <Check size={13} strokeWidth={3} />}
          </span>
        )}
      </button>

      {isActive ? (
        <span className="flex items-center gap-1.5">
          <ProgressRing
            size={26}
            thickness={2.5}
            label={`Sending to ${device.name}`}
            indeterminate={transfer?.state !== "sending"}
            value={transfer ? transferPercent(transfer) : 0}
          />
          <IconButton
            icon={Square}
            size="sm"
            danger
            title={`Stop sending to ${device.name}`}
            onClick={onStop}
          />
        </span>
      ) : isDone ? (
        <CircleCheck size={19} className="shrink-0 text-primary" />
      ) : device.isPaired && !disabled ? (
        <IconButton
          icon={Unlink}
          size="sm"
          title={`Forget ${device.name}`}
          onClick={onForget}
        />
      ) : null}
    </div>
  );
};
