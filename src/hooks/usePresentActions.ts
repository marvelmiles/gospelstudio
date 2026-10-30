import { useCallback } from "react";
import { presentLiveWindow } from "../lib/liveWindow";
import { useAnnouncedGoLive } from "./useAnnouncedGoLive";

export interface PresentOptions {
  live: boolean;
}

export interface PresentActions {
  startLive: () => void;
  startPreview: () => void;
}

export const usePresentActions = (
  onPresent: (options: PresentOptions) => void,
): PresentActions => {
  const goLive = useAnnouncedGoLive(presentLiveWindow, "Presentation window");

  const startLive = useCallback(() => {
    void goLive().then((result) => {
      if (result.ok) onPresent({ live: true });
    });
  }, [goLive, onPresent]);

  const startPreview = useCallback(
    () => onPresent({ live: false }),
    [onPresent],
  );

  return { startLive, startPreview };
};
