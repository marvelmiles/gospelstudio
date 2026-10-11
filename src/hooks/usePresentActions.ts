import { useCallback } from "react";
import { presentLiveWindow } from "../lib/liveWindow";
import { useGoLiveToast } from "./useGoLiveToast";

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
  const announceGoLive = useGoLiveToast("Presentation window");

  const startLive = useCallback(() => {
    void presentLiveWindow.goLive().then((result) => {
      announceGoLive(result);
      if (result.ok) onPresent({ live: true });
    });
  }, [announceGoLive, onPresent]);

  const startPreview = useCallback(
    () => onPresent({ live: false }),
    [onPresent],
  );

  return { startLive, startPreview };
};
