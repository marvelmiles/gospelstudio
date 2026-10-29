import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, RefObject } from "react";

interface FullscreenTarget extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

export interface FullscreenControls {
  isFullscreen: boolean;
  fillStyle: CSSProperties | null;
  toggle: () => void;
}

const FILL_Z_INDEX = 500;

const FILL_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  width: "100vw",
  height: "100dvh",
  zIndex: FILL_Z_INDEX,
  background: "#000",
};

const fullscreenDocument = (): FullscreenDocument => document;

const activeFullscreenElement = (): Element | null =>
  document.fullscreenElement ??
  fullscreenDocument().webkitFullscreenElement ??
  null;

const requestFullscreen = async (
  element: FullscreenTarget,
): Promise<boolean> => {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    }
    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return true;
    }
  } catch {}
  return false;
};

const leaveFullscreen = (): void => {
  const doc = fullscreenDocument();
  try {
    if (document.exitFullscreen) void document.exitFullscreen().catch(() => {});
    else doc.webkitExitFullscreen?.();
  } catch {}
};

export const useFullscreen = (
  ref: RefObject<HTMLElement | null>,
): FullscreenControls => {
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isFilling, setIsFilling] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      const active = Boolean(activeFullscreenElement());
      setIsBrowserFullscreen(active);
      if (active) setIsFilling(false);
    };
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isFilling) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isFilling]);

  const toggle = useCallback(() => {
    if (isFilling) {
      setIsFilling(false);
      return;
    }
    if (activeFullscreenElement()) {
      leaveFullscreen();
      return;
    }
    const element = ref.current as FullscreenTarget | null;
    if (!element) return;
    void requestFullscreen(element).then((granted) => {
      if (!granted) setIsFilling(true);
    });
  }, [isFilling, ref]);

  return {
    isFullscreen: isBrowserFullscreen || isFilling,
    fillStyle: isFilling ? FILL_STYLE : null,
    toggle,
  };
};
