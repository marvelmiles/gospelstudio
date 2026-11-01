import { useCallback } from "react";
import { useAnnouncedGoLive } from "../../../hooks/useAnnouncedGoLive";
import { studioOutputWindow } from "../lib/outputChannel";

export const useOpenProjector = (): (() => void) => {
  const open = useAnnouncedGoLive(studioOutputWindow, "Projector screen");
  return useCallback(() => {
    void open();
  }, [open]);
};
