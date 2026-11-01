import { useEffect, useEffectEvent } from "react";
import { targetOwnsKey } from "../../../lib/mediaKeys";
import { useUndoRedoShortcuts } from "../../../hooks/useUndoRedoShortcuts";
import { selectLayer, useEditorStore } from "../store/editorStore";
import { deleteLayer, duplicateLayer, nudgeLayer } from "../store/layerActions";
import {
  flushSave,
  redo,
  undo,
  useProductionStore,
} from "../store/productionStore";

const NUDGE = 1;
const NUDGE_FAST = 10;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const isInsideDialog = (event: KeyboardEvent): boolean =>
  Boolean((event.target as HTMLElement | null)?.closest?.('[role="dialog"]'));

export const useStudioShortcuts = (): void => {
  const canUndo = useProductionStore((state) => state.past.length > 0);
  const canRedo = useProductionStore((state) => state.future.length > 0);
  useUndoRedoShortcuts({ canUndo, canRedo, undo, redo });

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || isInsideDialog(event)) return;
    const isCommand = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (isCommand && key === "s") {
      event.preventDefault();
      void flushSave();
      return;
    }
    if (targetOwnsKey(event)) return;

    const { selectedLayerId } = useEditorStore.getState();
    if (!selectedLayerId) return;

    if (isCommand && key === "d") {
      event.preventDefault();
      duplicateLayer(selectedLayerId);
      return;
    }
    if (isCommand || event.altKey) return;

    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const step = event.shiftKey ? NUDGE_FAST : NUDGE;
      nudgeLayer(selectedLayerId, arrow[0] * step, arrow[1] * step);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteLayer(selectedLayerId);
      return;
    }
    if (event.key === "Escape") selectLayer(null);
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
