import { useCallback } from "react";
import { useStore } from "../../../store/useStore";
import { useGoLive } from "../../../hooks/useGoLive";
import { useAnnouncedGoLive } from "../../../hooks/useAnnouncedGoLive";
import { streamLiveWindow } from "./streamLive";

export const useStreamGoLive = () => {
  const pushToast = useStore((s) => s.pushToast);
  const { isLive, endLive } = useGoLive(streamLiveWindow);
  const goLive = useAnnouncedGoLive(streamLiveWindow, "Projection window");

  const toggleLive = useCallback(() => {
    if (isLive) {
      endLive();
      pushToast("Ended the live projection.");
      return;
    }
    void goLive();
  }, [endLive, goLive, isLive, pushToast]);

  return { isLive, toggleLive };
};
