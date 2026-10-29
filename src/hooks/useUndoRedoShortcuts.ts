import { useEffect, useEffectEvent } from "react";

interface UndoRedoShortcutOptions {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  enabled?: boolean;
}

export const useUndoRedoShortcuts = ({
  canUndo,
  canRedo,
  undo,
  redo,
  enabled = true,
}: UndoRedoShortcutOptions): void => {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!enabled || event.defaultPrevented || event.altKey) return;
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[role="dialog"]')) return;

    const redoing = key === "y" || event.shiftKey;
    if (redoing ? !canRedo : !canUndo) return;
    event.preventDefault();
    if (redoing) redo();
    else undo();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
