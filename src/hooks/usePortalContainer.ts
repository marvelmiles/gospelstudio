import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
};

const fullscreenContainer = (): HTMLElement | undefined =>
  document.fullscreenElement instanceof HTMLDivElement
    ? document.fullscreenElement
    : undefined;

const noContainer = (): undefined => undefined;

export const usePortalContainer = (): HTMLElement | undefined =>
  useSyncExternalStore(subscribe, fullscreenContainer, noContainer);
