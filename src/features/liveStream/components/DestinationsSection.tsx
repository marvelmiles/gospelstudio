import { useState } from "react";
import { Plus, RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { destinationStatusOf } from "../lib/destinationStatus";
import { MAX_STREAM_DESTINATIONS } from "../lib/liveRelayContract";
import {
  destinationName,
  removeDestination,
  setDestinationEnabled,
  useLiveStreamSettings,
  type StreamDestination,
} from "../lib/liveStreamSettings";
import {
  excludeDestination,
  includeDestination,
  retryDestination,
} from "../lib/liveStreamSession";
import { useLiveStreamStore } from "../lib/liveStreamStore";
import { DestinationRow } from "./DestinationRow";

interface DestinationsSectionProps {
  onAdd: () => void;
  onEdit: (destination: StreamDestination) => void;
}

const switchHintFor = (
  isLive: boolean,
  isIncluded: boolean,
  isLastIncluded: boolean,
): string => {
  if (!isLive) return "Stream here when going live";
  if (!isIncluded) return "Start streaming here too";
  return isLastIncluded
    ? "Keep at least one platform, or end the stream"
    : "Stop streaming here";
};

export const DestinationsSection = ({
  onAdd,
  onEdit,
}: DestinationsSectionProps) => {
  const destinations = useLiveStreamSettings((state) => state.destinations);
  const phase = useLiveStreamStore((state) => state.phase);
  const relay = useLiveStreamStore((state) => state.relay);
  const included = useLiveStreamStore((state) => state.includedDestinationIds);
  const busy = useLiveStreamStore((state) => state.busyDestinationIds);
  const [removing, setRemoving] = useState<StreamDestination | null>(null);
  const isLive = phase === "live";
  const isSettling = phase === "starting" || phase === "stopping";
  const canAdd = destinations.length < MAX_STREAM_DESTINATIONS;

  if (destinations.length === 0)
    return (
      <EmptyState
        icon={RadioTower}
        compact
        title="Reach viewers everywhere"
        message="Add YouTube, Facebook or another platform, and your service streams to all of them at once."
        action={
          <Button onClick={onAdd}>
            <Plus />
            Add a platform
          </Button>
        }
      />
    );

  const switchDestination = (destination: StreamDestination, on: boolean) => {
    setDestinationEnabled(destination.id, on);
    if (!isLive) return;
    void (on
      ? includeDestination(destination)
      : excludeDestination(destination.id));
  };

  return (
    <>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {destinations.map((destination) => {
          const isIncluded = included.includes(destination.id);
          const isLastIncluded = isIncluded && included.length === 1;
          return (
            <DestinationRow
              key={destination.id}
              destination={destination}
              status={destinationStatusOf(destination.id, relay, isIncluded)}
              isOn={isLive ? isIncluded : destination.enabled}
              switchHint={switchHintFor(isLive, isIncluded, isLastIncluded)}
              canSwitch={!isSettling && !isLastIncluded}
              canEdit={!isSettling && !(isLive && isIncluded)}
              isBusy={busy.includes(destination.id)}
              onSwitch={(on) => switchDestination(destination, on)}
              onEdit={() => onEdit(destination)}
              onRemove={() => setRemoving(destination)}
              onRetry={() => void retryDestination(destination.id)}
            />
          );
        })}
      </ul>
      <Button
        size="sm"
        variant="secondary"
        disabled={!canAdd}
        onClick={onAdd}
        title={
          canAdd
            ? "Add another platform"
            : `You can stream to up to ${MAX_STREAM_DESTINATIONS} platforms at once`
        }
        className="mt-2 self-start"
      >
        <Plus />
        Add a platform
      </Button>
      <ConfirmDialog
        open={removing !== null}
        title="Remove this platform?"
        message={`${removing ? destinationName(removing) : "This platform"} and its stream key will be removed from this device.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) removeDestination(removing.id);
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      />
    </>
  );
};
