import { useId } from "react";
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IconButton } from "@/components/shared/IconButton";
import type { DestinationStatus } from "../lib/destinationStatus";
import {
  destinationName,
  type StreamDestination,
} from "../lib/liveStreamSettings";
import { streamKeyEnding } from "../lib/streamUrl";
import { DestinationStatusBadge } from "./DestinationStatusBadge";
import { PlatformIcon } from "./PlatformIcon";

interface DestinationRowProps {
  destination: StreamDestination;
  status: DestinationStatus;
  isOn: boolean;
  switchHint: string;
  canSwitch: boolean;
  canEdit: boolean;
  isBusy: boolean;
  onSwitch: (on: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
  onRetry: () => void;
}

const hostOf = (serverUrl: string): string => {
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return serverUrl;
  }
};

export const DestinationRow = ({
  destination,
  status,
  isOn,
  switchHint,
  canSwitch,
  canEdit,
  isBusy,
  onSwitch,
  onEdit,
  onRemove,
  onRetry,
}: DestinationRowProps) => {
  const switchId = useId();
  const name = destinationName(destination);

  return (
    <li
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border bg-background p-2.5 transition-opacity",
        !isOn && "opacity-75",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary">
          <PlatformIcon platform={destination.platform} />
        </span>
        <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-foreground">
              {name}
            </span>
            <DestinationStatusBadge state={status.state} />
          </span>
          <span className="block truncate text-[11.5px] text-subtle-foreground">
            {hostOf(destination.serverUrl)}, key ending in{" "}
            <span className="font-mono">
              {streamKeyEnding(destination.streamKey)}
            </span>
          </span>
        </label>
        <Switch
          id={switchId}
          checked={isOn}
          disabled={!canSwitch || isBusy}
          onCheckedChange={onSwitch}
          aria-label={`${switchHint}: ${name}`}
          title={switchHint}
        />
        <IconButton
          icon={Pencil}
          size="sm"
          title={canEdit ? `Edit ${name}` : "Take it off the stream to edit it"}
          disabled={!canEdit}
          onClick={onEdit}
        />
        <IconButton
          icon={Trash2}
          size="sm"
          danger
          title={
            canEdit ? `Remove ${name}` : "Take it off the stream to remove it"
          }
          disabled={!canEdit}
          onClick={onRemove}
        />
      </div>
      {status.state === "retrying" && status.error && (
        <p className="m-0 pl-11.5 text-[12px] leading-snug text-muted-foreground">
          {status.error} Trying again by itself.
        </p>
      )}
      {status.state === "failed" && (
        <div className="flex flex-wrap items-center gap-2 pl-11.5">
          <p
            role="alert"
            className="m-0 min-w-0 flex-1 text-[12px] leading-snug text-warning-foreground"
          >
            {status.error ??
              "The platform is not receiving the stream. Check that the stream key is current and the platform is waiting for a stream."}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={isBusy}
            onClick={onRetry}
          >
            <RotateCcw />
            Try again
          </Button>
        </div>
      )}
    </li>
  );
};
