import { useCallback, useEffect, useState } from "react";
import {
  isExtendedDisplay,
  pickProjectorScreen,
  readScreenDetails,
  screenAccess,
  screenLabel,
  type ScreenAccess,
  type ScreenDetails,
} from "../lib/screens";

export interface DisplayInfo {
  id: string;
  label: string;
  size: string;
  isProjector: boolean;
  isCurrent: boolean;
}

export interface ScreenAccessState {
  access: ScreenAccess;
  isExtended: boolean;
  displays: DisplayInfo[];
  isAsking: boolean;
  allowDisplays: () => void;
}

const describeDisplays = (details: ScreenDetails): DisplayInfo[] => {
  const projector = pickProjectorScreen(details);
  return details.screens.map((screen, index) => ({
    id: `${screenLabel(screen, index)}-${index}`,
    label: screenLabel(screen, index),
    size: `${screen.width} by ${screen.height}`,
    isProjector: screen === projector,
    isCurrent: screen === details.currentScreen,
  }));
};

const watchScreenChange = (onChange: () => void): (() => void) => {
  const screen = window.screen as unknown as {
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
  screen.addEventListener?.("change", onChange);
  return () => screen.removeEventListener?.("change", onChange);
};

export const useScreenAccess = (enabled = true): ScreenAccessState => {
  const [access, setAccess] = useState<ScreenAccess>("prompt");
  const [isExtended, setIsExtended] = useState(isExtendedDisplay);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const refresh = useCallback(async () => {
    const state = await screenAccess();
    const details = state === "granted" ? await readScreenDetails() : null;
    setAccess(state);
    setIsExtended(isExtendedDisplay());
    setDisplays(details ? describeDisplays(details) : []);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    return watchScreenChange(() => void refresh());
  }, [enabled, refresh]);

  const allowDisplays = useCallback(() => {
    setIsAsking(true);
    void readScreenDetails()
      .then(() => refresh())
      .finally(() => setIsAsking(false));
  }, [refresh]);

  return { access, isExtended, displays, isAsking, allowDisplays };
};
