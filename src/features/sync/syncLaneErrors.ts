import { isSessionEnded } from "../account/session/sessionManager";
import { itemFailureFor, type SyncFailure } from "./syncFailure";

/* Turns an error into a failure recorded on the item, or rethrows it when it belongs to the whole lane: a cancel, a sign-out, or the device or server being unreachable. */
export const failureOrRethrow = (
  error: unknown,
  signal: AbortSignal,
): SyncFailure => {
  if (signal.aborted || isSessionEnded(error)) throw error;
  const itemFailure = itemFailureFor(error, Date.now());
  if (!itemFailure) throw error;
  return itemFailure;
};
