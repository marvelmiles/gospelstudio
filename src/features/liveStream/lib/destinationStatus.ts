import type {
  DestinationState as RelayDestinationState,
  SessionSnapshot,
} from "@/contracts/liveRelay";

export type DestinationState = "idle" | RelayDestinationState;

export interface DestinationStatus {
  state: DestinationState;
  error: string | null;
}

const IDLE: DestinationStatus = { state: "idle", error: null };
const WAITING: DestinationStatus = { state: "waiting", error: null };

export const destinationStatusOf = (
  destinationId: string,
  relay: SessionSnapshot | null,
  isIncluded: boolean,
): DestinationStatus => {
  if (!isIncluded) return IDLE;
  const reported = relay?.destinations.find(
    (destination) => destination.id === destinationId,
  );
  return reported ? { state: reported.state, error: reported.error } : WAITING;
};
