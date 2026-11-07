import { useCallback, useEffect, useRef } from "react";
import {
  trackEvent,
  type EventWithoutProps,
} from "../lib/analytics/trackEvent";

export const useTrackEventOnce = (
  event: EventWithoutProps,
): ((occurrenceKey?: string) => void) => {
  const trackedKeyRef = useRef<string | null>(null);

  return useCallback(
    (occurrenceKey = "") => {
      if (trackedKeyRef.current === occurrenceKey) return;
      trackedKeyRef.current = occurrenceKey;
      trackEvent(event);
    },
    [event],
  );
};

export const useTrackEventWhen = (
  event: EventWithoutProps,
  isReady: boolean,
  occurrenceKey = "",
): void => {
  const track = useTrackEventOnce(event);

  useEffect(() => {
    if (isReady) track(occurrenceKey);
  }, [track, isReady, occurrenceKey]);
};
