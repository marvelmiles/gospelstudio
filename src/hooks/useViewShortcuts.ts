import { useEffect, useRef } from "react";
import { targetOwnsKey } from "../lib/mediaKeys";
import { matchViewCommand } from "../lib/viewCommands";

interface ViewShortcutOptions {
  onTogglePopOut?: () => void;
  onToggleFullscreen?: () => void;
  isArmed?: () => boolean;
}

export const useViewShortcuts = (options: ViewShortcutOptions): void => {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (targetOwnsKey(event)) return;
      const { onTogglePopOut, onToggleFullscreen, isArmed } = latest.current;
      if (isArmed && !isArmed()) return;
      const command = matchViewCommand(event);
      const run =
        command === "popOut"
          ? onTogglePopOut
          : command === "fullscreen"
            ? onToggleFullscreen
            : undefined;
      if (!run) return;
      event.preventDefault();
      run();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
