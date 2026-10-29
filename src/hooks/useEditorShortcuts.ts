import { useEffect, useEffectEvent } from "react";
import { matchEditorCommand, type EditorCommand } from "../lib/shortcuts";

type EditorCommandHandlers = Partial<
  Record<EditorCommand, (() => void) | undefined>
>;

interface EditorShortcutOptions extends EditorCommandHandlers {
  enabled?: boolean;
}

export const useEditorShortcuts = ({
  enabled = true,
  ...handlers
}: EditorShortcutOptions): void => {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!enabled || event.defaultPrevented) return;
    const command = matchEditorCommand(event);
    if (!command) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[role="dialog"]')) return;

    const run = handlers[command];
    if (!run && command !== "save") return;
    event.preventDefault();
    run?.();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
