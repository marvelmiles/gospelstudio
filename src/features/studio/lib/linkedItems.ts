import type { Layer, LayerType } from "../types/layer";
import { copyLayer } from "./layerDefaults";

/* A clone keeps its own place on the screen; everything else it shows is shared with the items it is linked to. */
const OWN_KEYS: ReadonlySet<string> = new Set([
  "id",
  "linkId",
  "position",
  "dimensions",
  "rotation",
  "visible",
  "locked",
]);

const OWN_FRAMING: Partial<Record<LayerType, readonly string[]>> = {
  camera: ["fit", "keepAspect"],
  image: ["focusX", "focusY", "zoom"],
};

const isOwnKey = (type: LayerType, key: string): boolean =>
  OWN_KEYS.has(key) || Boolean(OWN_FRAMING[type]?.includes(key));

export const sharedPatch = (
  type: LayerType,
  patch: object,
): Record<string, unknown> | null => {
  const shared = Object.entries(patch).filter(([key]) => !isOwnKey(type, key));
  return shared.length > 0 ? Object.fromEntries(shared) : null;
};

const areLinked = (layer: Layer, other: Layer): boolean =>
  layer.linkId !== null &&
  layer.linkId === other.linkId &&
  layer.type === other.type;

export const linkedLayers = (layers: Layer[], layer: Layer): Layer[] =>
  layers.filter((entry) => entry.id !== layer.id && areLinked(entry, layer));

export const patchItem = (
  layers: Layer[],
  layerId: string,
  patch: object,
): Layer[] => {
  const target = layers.find((layer) => layer.id === layerId);
  if (!target) return layers;
  const shared = target.linkId ? sharedPatch(target.type, patch) : null;
  return layers.map((layer) => {
    if (layer.id === layerId) return { ...layer, ...patch } as Layer;
    if (shared && areLinked(layer, target))
      return { ...layer, ...shared } as Layer;
    return layer;
  });
};

export const removeItem = (layers: Layer[], layerId: string): Layer[] => {
  const target = layers.find((layer) => layer.id === layerId);
  if (!target) return layers;
  const removed = new Set([
    layerId,
    ...linkedLayers(layers, target).map((layer) => layer.id),
  ]);
  return layers.filter((layer) => !removed.has(layer.id));
};

export interface ClonedItem {
  layers: Layer[];
  clone: Layer;
}

export const cloneItem = (
  layers: Layer[],
  layerId: string,
  newLinkId: string,
): ClonedItem | null => {
  const index = layers.findIndex((layer) => layer.id === layerId);
  if (index < 0) return null;
  const original = layers[index];
  const linkId = original.linkId ?? newLinkId;
  const clone: Layer = { ...copyLayer(original, ""), linkId, locked: false };
  const linked = layers.map((layer) =>
    layer.id === layerId ? { ...layer, linkId } : layer,
  );
  return {
    layers: [...linked.slice(0, index + 1), clone, ...linked.slice(index + 1)],
    clone,
  };
};

export const unlinkItem = (layers: Layer[], layerId: string): Layer[] => {
  const target = layers.find((layer) => layer.id === layerId);
  if (!target?.linkId) return layers;
  const others = linkedLayers(layers, target);
  const lastOther = others.length === 1 ? others[0].id : null;
  return layers.map((layer) =>
    layer.id === layerId || layer.id === lastOther
      ? { ...layer, linkId: null }
      : layer,
  );
};

export const linkGroupOf = (layer: Layer): string => layer.linkId ?? layer.id;

/* Linked videos play in step, so only the first one on screen keeps its sound. */
export const silenceEchoClones = (layers: Layer[]): Layer[] => {
  const heard = new Set<string>();
  let changed = false;
  const next = layers.map((layer) => {
    if (layer.type !== "video" || !layer.linkId) return layer;
    if (!heard.has(layer.linkId)) {
      heard.add(layer.linkId);
      return layer;
    }
    changed = true;
    return { ...layer, overrides: { ...layer.overrides, muted: true } };
  });
  return changed ? next : layers;
};
