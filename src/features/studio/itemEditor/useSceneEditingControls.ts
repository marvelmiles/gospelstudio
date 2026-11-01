import { useMemo } from "react";
import type { SceneEditing } from "../../editor/sceneEditing";
import { useProductionStore } from "../store/productionStore";
import { updateSettings } from "../store/productionActions";

export type SceneEditingControls = Omit<SceneEditing<unknown>, "commit">;

export const useSceneEditingControls = (
  itemId: string,
): SceneEditingControls => {
  const autoUpdate = useProductionStore(
    (state) => state.production?.settings.autoUpdateScene ?? true,
  );
  return useMemo(
    () => ({
      itemId,
      autoUpdate,
      onAutoUpdateChange: (autoUpdateScene: boolean) =>
        updateSettings({ autoUpdateScene }),
    }),
    [itemId, autoUpdate],
  );
};
