import type { Layer } from "../types/layer";

export type LayerStep = "forward" | "backward" | "front" | "back";

export const moveLayerTo = (
  layers: Layer[],
  layerId: string,
  targetIndex: number,
): Layer[] => {
  const fromIndex = layers.findIndex((layer) => layer.id === layerId);
  if (fromIndex < 0) return layers;
  const toIndex = Math.min(Math.max(targetIndex, 0), layers.length - 1);
  if (toIndex === fromIndex) return layers;
  const next = [...layers];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const targetIndexFor = (
  step: LayerStep,
  fromIndex: number,
  count: number,
): number => {
  switch (step) {
    case "forward":
      return fromIndex + 1;
    case "backward":
      return fromIndex - 1;
    case "front":
      return count - 1;
    case "back":
      return 0;
  }
};

export const stepLayer = (
  layers: Layer[],
  layerId: string,
  step: LayerStep,
): Layer[] => {
  const fromIndex = layers.findIndex((layer) => layer.id === layerId);
  if (fromIndex < 0) return layers;
  return moveLayerTo(
    layers,
    layerId,
    targetIndexFor(step, fromIndex, layers.length),
  );
};

export const canStepLayer = (
  layers: Layer[],
  layerId: string,
  step: LayerStep,
): boolean => {
  const index = layers.findIndex((layer) => layer.id === layerId);
  if (index < 0) return false;
  return step === "forward" || step === "front"
    ? index < layers.length - 1
    : index > 0;
};

export const topFirst = (layers: Layer[]): Layer[] => [...layers].reverse();
