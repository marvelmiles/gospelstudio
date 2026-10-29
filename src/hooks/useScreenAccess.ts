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

interface ScreenSnapshot {
  access: ScreenAccess;
  isExtended: boolean;
  displays: DisplayInfo[];
}

const readScreenSnapshot = async (): Promise<ScreenSnapshot> => {
  const access = await screenAccess();
  const details = access === "granted" ? await readScreenDetails() : null;
  return {
    access,
    isExtended: isExtendedDisplay(),
    displays: details ? describeDisplays(details) : [],
  };
};

export const useScreenAccess = (enabled = true): ScreenAccessState => {
  const [access, setAccess] = useState<ScreenAccess>("prompt");
  const [isExtended, setIsExtended] = useState(isExtendedDisplay);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const applySnapshot = useCallback((snapshot: ScreenSnapshot) => {
    setAccess(snapshot.access);
    setIsExtended(snapshot.isExtended);
    setDisplays(snapshot.displays);
  }, []);

  const refresh = useCallback(
    () => readScreenSnapshot().then(applySnapshot),
    [applySnapshot],
  );

  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;
    const load = () =>
      void readScreenSnapshot().then((snapshot) => {
        if (!isCancelled) applySnapshot(snapshot);
      });
    load();
    const stopWatching = watchScreenChange(load);
    return () => {
      isCancelled = true;
      stopWatching();
    };
  }, [enabled, applySnapshot]);

  const allowDisplays = useCallback(() => {
    setIsAsking(true);
    void readScreenDetails()
      .then(() => refresh())
      .finally(() => setIsAsking(false));
  }, [refresh]);

  return { access, isExtended, displays, isAsking, allowDisplays };
};
