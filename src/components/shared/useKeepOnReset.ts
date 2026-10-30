import { Shield, ShieldCheck } from "lucide-react";
import { useStore } from "../../store/useStore";
import {
  MAX_KEPT_ITEMS,
  canKeep,
  keptCount,
  type KeepableKind,
} from "../../lib/keepOnReset";
import type { MenuItem } from "./menuItem";

export interface KeepableItem {
  id: string;
  keepOnReset?: boolean;
  builtIn?: boolean;
  deleted?: boolean;
}

interface KeepOnResetState {
  available: boolean;
  kept: boolean;
  full: boolean;
  title: string;
  toggle: () => void;
}

export const useKeepOnResetState = (
  kind: KeepableKind,
  item: KeepableItem,
): KeepOnResetState => {
  const used = useStore((s) => keptCount(s.manuscripts, s.themes));
  const toggleKeepOnReset = useStore((s) => s.toggleKeepOnReset);

  const kept = Boolean(item.keepOnReset);
  const full = !kept && used >= MAX_KEPT_ITEMS;

  return {
    available: canKeep(item),
    kept,
    full,
    title: kept
      ? "Kept: survives a reset. Click to stop keeping it."
      : full
        ? `All ${MAX_KEPT_ITEMS} keep-on-reset slots are used. Unkeep another item first.`
        : `Keep on reset: survives "Reset App to Defaults" (${used} of ${MAX_KEPT_ITEMS} used).`,
    toggle: () => toggleKeepOnReset(kind, item.id),
  };
};

export const useKeepOnResetAction = (
  kind: KeepableKind,
  item: KeepableItem,
): MenuItem | null => {
  const state = useKeepOnResetState(kind, item);
  if (!state.available) return null;
  return {
    label: state.kept ? "Stop keeping on reset" : "Keep on reset",
    icon: state.kept ? ShieldCheck : Shield,
    disabled: state.full,
    title: state.title,
    onClick: state.toggle,
  };
};
