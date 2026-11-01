import { useCallback } from "react";
import type { Layer, LayerPatch } from "../types/layer";
import { updateLayer } from "../store/layerActions";

export type LayerEdit<T extends Layer> = (
  patch: LayerPatch<T>,
  field?: string,
) => void;

export const useLayerEditor = <T extends Layer>(layer: T): LayerEdit<T> => {
  const layerId = layer.id;
  return useCallback(
    (patch: LayerPatch<T>, field?: string) =>
      updateLayer<T>(layerId, patch, {
        coalesceKey: field ? `${layerId}:${field}` : undefined,
      }),
    [layerId],
  );
};
