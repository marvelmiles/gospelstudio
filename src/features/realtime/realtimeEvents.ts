import type { LibraryChanged } from "@/contracts/realtimeContract";

interface RealtimeListeners {
  connected: () => void;
  libraryChanged: (change: LibraryChanged) => void;
  sessionsChanged: () => void;
}

type RealtimeEventName = keyof RealtimeListeners;

const listeners: {
  [Name in RealtimeEventName]: Set<RealtimeListeners[Name]>;
} = {
  connected: new Set(),
  libraryChanged: new Set(),
  sessionsChanged: new Set(),
};

export const onRealtime = <Name extends RealtimeEventName>(
  name: Name,
  listener: RealtimeListeners[Name],
): (() => void) => {
  listeners[name].add(listener);
  return () => {
    listeners[name].delete(listener);
  };
};

export const emitRealtime = <Name extends RealtimeEventName>(
  name: Name,
  ...payload: Parameters<RealtimeListeners[Name]>
): void => {
  for (const listener of listeners[name])
    (listener as (...args: Parameters<RealtimeListeners[Name]>) => void)(
      ...payload,
    );
};
