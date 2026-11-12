import { uid } from "../../../lib/id";
import { useStore } from "../../../store/useStore";
import type { Layer, LayerFrame, LayerPatch } from "../types/layer";
import { clampFrame } from "../lib/canvasCoordinates";
import { copyLayer, placement } from "../lib/layerDefaults";
import {
  cloneItem,
  linkedLayers,
  patchItem,
  removeItem,
  unlinkItem,
} from "../lib/linkedItems";
import { moveLayerTo, stepLayer, type LayerStep } from "../lib/layerOrdering";
import { previewSceneOf } from "../lib/productionFactory";
import { selectLayer } from "./editorStore";
import {
  editPreviewLayers,
  useProductionStore,
  type EditOptions,
} from "./productionStore";

const previewLayers = (): Layer[] => {
  const { production } = useProductionStore.getState();
  return production ? previewSceneOf(production).layers : [];
};

const mapLayer = (
  layers: Layer[],
  layerId: string,
  recipe: (layer: Layer) => Layer,
): Layer[] => {
  let changed = false;
  const next = layers.map((layer) => {
    if (layer.id !== layerId) return layer;
    const mapped = recipe(layer);
    if (mapped !== layer) changed = true;
    return mapped;
  });
  return changed ? next : layers;
};

export const addLayer = (layer: Layer): void => {
  editPreviewLayers((layers) =>
    layer.type === "background" ? [layer, ...layers] : [...layers, layer],
  );
  selectLayer(layer.id);
};

export const updateLayer = <T extends Layer>(
  layerId: string,
  patch: LayerPatch<T>,
  options?: EditOptions,
): void =>
  editPreviewLayers((layers) => patchItem(layers, layerId, patch), options);

export const setLayerFrame = (
  layerId: string,
  frame: LayerFrame,
  options?: EditOptions,
): void => updateLayer(layerId, placement(clampFrame(frame)), options);

export const nudgeLayer = (layerId: string, dx: number, dy: number): void =>
  editPreviewLayers(
    (layers) =>
      mapLayer(layers, layerId, (layer) =>
        layer.locked
          ? layer
          : {
              ...layer,
              ...placement(
                clampFrame({
                  ...layer.dimensions,
                  x: layer.position.x + dx,
                  y: layer.position.y + dy,
                }),
              ),
            },
      ),
    { coalesceKey: `nudge:${layerId}` },
  );

export const duplicateLayer = (layerId: string): void => {
  const original = previewLayers().find((layer) => layer.id === layerId);
  if (!original) return;
  const copy: Layer = { ...copyLayer(original), linkId: null, locked: false };
  editPreviewLayers((layers) => {
    const index = layers.findIndex((layer) => layer.id === layerId);
    if (index < 0) return layers;
    return [...layers.slice(0, index + 1), copy, ...layers.slice(index + 1)];
  });
  selectLayer(copy.id);
};

export const cloneLayer = (layerId: string): void => {
  const cloned = cloneItem(previewLayers(), layerId, uid());
  if (!cloned) return;
  editPreviewLayers(() => cloned.layers);
  selectLayer(cloned.clone.id);
  useStore
    .getState()
    .pushToast(
      `Cloned "${cloned.clone.name}". What you change on one now changes on both.`,
    );
};

export const unlinkLayer = (layerId: string): void =>
  editPreviewLayers((layers) => unlinkItem(layers, layerId));

const deletedMessage = (name: string, cloneCount: number): string => {
  if (cloneCount === 0)
    return `Deleted "${name}". Press Ctrl+Z to bring it back.`;
  const clones = cloneCount === 1 ? "its clone" : `its ${cloneCount} clones`;
  return `Deleted "${name}" and ${clones}. Press Ctrl+Z to bring them back.`;
};

export const deleteLayer = (layerId: string): void => {
  const layers = previewLayers();
  const layer = layers.find((entry) => entry.id === layerId);
  if (!layer) return;
  const cloneCount = linkedLayers(layers, layer).length;
  editPreviewLayers((current) => removeItem(current, layerId));
  selectLayer(null);
  useStore.getState().pushToast(deletedMessage(layer.name, cloneCount));
};

export const toggleLayerVisible = (layer: Layer): void =>
  updateLayer(layer.id, { visible: !layer.visible });

export const toggleLayerLocked = (layer: Layer): void =>
  updateLayer(layer.id, { locked: !layer.locked });

export const renameLayer = (layerId: string, name: string): void => {
  const trimmed = name.trim();
  if (trimmed) updateLayer(layerId, { name: trimmed });
};

export const moveLayer = (layerId: string, targetIndex: number): void =>
  editPreviewLayers((layers) => moveLayerTo(layers, layerId, targetIndex));

export const stepLayerOrder = (layerId: string, step: LayerStep): void =>
  editPreviewLayers((layers) => stepLayer(layers, layerId, step));
