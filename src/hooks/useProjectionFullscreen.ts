import { useCallback, useEffect, useState } from "react";
import { fillProjector } from "../lib/screens";

const isDocumentFullscreen = (): boolean => Boolean(document.fullscreenElement);

interface ProjectionFullscreen {
  isFullscreen: boolean;
  toggle: () => void;
}

export const useProjectionFullscreen = (): ProjectionFullscreen => {
  const [isFullscreen, setIsFullscreen] = useState(isDocumentFullscreen);

  useEffect(() => {
    const onChange = () => setIsFullscreen(isDocumentFullscreen());
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!window.opener || isDocumentFullscreen()) return;
    void fillProjector(document.documentElement);
  }, []);

  const toggle = useCallback(() => {
    if (isDocumentFullscreen()) {
      void document.exitFullscreen?.().catch(() => {});
      return;
    }
    void fillProjector(document.documentElement);
  }, []);

  return { isFullscreen, toggle };
};
