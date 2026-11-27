import { announceToOtherTabs } from "../account/session/accountChannel";

export interface SyncQueueEvent {
  needsSync: boolean;
}

type SyncQueueListener = (event: SyncQueueEvent) => void;

const listeners = new Set<SyncQueueListener>();

export const subscribeSyncQueue = (
  listener: SyncQueueListener,
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const tellListeners = (event: SyncQueueEvent): void => {
  for (const listener of listeners) listener(event);
};

export const notifySyncQueue = (needsSync: boolean): void => {
  tellListeners({ needsSync });
  announceToOtherTabs({ type: "sync-queue-changed", needsSync });
};

export const receiveSyncQueueFromOtherTab = (event: SyncQueueEvent): void =>
  tellListeners(event);
