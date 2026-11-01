import type { Layer } from "../types/layer";
import type { Production } from "../types/production";
import { previewSceneOf } from "./productionFactory";

export interface SceneItem {
  layer: Layer;
  sceneId: string;
  sceneName: string;
  isLive: boolean;
  isInPreview: boolean;
}

export const holdsLayer = (layers: Layer[], layerId: string): boolean =>
  layers.some((layer) => layer.id === layerId);

export const findSceneItem = (
  production: Production | null,
  layerId: string | null,
): SceneItem | null => {
  if (!production || !layerId) return null;
  const scene = production.scenes.find((entry) =>
    holdsLayer(entry.layers, layerId),
  );
  if (!scene) return null;
  const liveLayer = production.program?.layers.find(
    (layer) => layer.id === layerId,
  );
  const sceneLayer = scene.layers.find((layer) => layer.id === layerId);
  const layer = liveLayer ?? sceneLayer;
  if (!layer) return null;
  return {
    layer,
    sceneId: scene.id,
    sceneName: scene.name,
    isLive: Boolean(liveLayer),
    isInPreview: previewSceneOf(production).id === scene.id,
  };
};

export const findItemLayer = (
  production: Production | null,
  layerId: string | null,
): Layer | null => {
  if (!production || !layerId) return null;
  const isWanted = (layer: Layer) => layer.id === layerId;
  return (
    production.program?.layers.find(isWanted) ??
    production.scenes.flatMap((scene) => scene.layers).find(isWanted) ??
    null
  );
};
