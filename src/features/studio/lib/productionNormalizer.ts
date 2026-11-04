import { now } from "../../../lib/id";
import type { ImportedProduction } from "../../../lib/schema";
import type { Layer, LayerType } from "../types/layer";
import type { Production } from "../types/production";
import type { Scene, SceneLayout } from "../types/scene";
import { LAYER_NAMES, createLayer } from "./layerDefaults";
import {
  DEFAULT_SCENE_BACKGROUND,
  defaultProductionSettings,
} from "./productionFactory";
import { DEFAULT_SCENE_TRANSITION } from "./sceneTransitions";

interface StoredLayer {
  type: unknown;
}

const LAYER_TYPES = new Set<string>(Object.keys(LAYER_NAMES));

const isKnownType = (type: unknown): type is LayerType =>
  typeof type === "string" && LAYER_TYPES.has(type);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const completeLayer = (type: LayerType, stored: StoredLayer): Layer => {
  const defaults: Record<string, unknown> = { ...createLayer(type) };
  const completed: Record<string, unknown> = { ...defaults, ...stored };
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = completed[key];
    if (isPlainObject(fallback) && isPlainObject(value) && value !== fallback)
      completed[key] = { ...fallback, ...value };
  }
  return completed as unknown as Layer;
};

/* Stored layers are completed with today's defaults, one level deep, so a field added later never reaches a renderer as undefined. */
export const normalizeLayers = (layers: readonly StoredLayer[]): Layer[] =>
  layers.flatMap((layer) =>
    isKnownType(layer.type) ? [completeLayer(layer.type, layer)] : [],
  );

export const normalizeProduction = (production: Production): Production => ({
  ...production,
  settings: { ...defaultProductionSettings(), ...production.settings },
  scenes: production.scenes.map((scene) => ({
    ...scene,
    layers: normalizeLayers(scene.layers),
  })),
  program: production.program
    ? {
        ...production.program,
        layers: normalizeLayers(production.program.layers),
      }
    : null,
});

export const normalizeLayout = (layout: SceneLayout): SceneLayout => ({
  ...layout,
  layers: normalizeLayers(layout.layers),
});

export const normalizeImportedProduction = (
  entry: ImportedProduction,
): Production => {
  const createdAt = entry.createdAt || now();
  const scenes: Scene[] = entry.scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    layers: normalizeLayers(scene.layers),
    transition: scene.transition ?? { ...DEFAULT_SCENE_TRANSITION },
    background: scene.background ?? DEFAULT_SCENE_BACKGROUND,
    createdAt: scene.createdAt || createdAt,
    updatedAt: scene.updatedAt || createdAt,
  }));
  const hasPreviewScene = scenes.some(
    (scene) => scene.id === entry.previewSceneId,
  );
  return normalizeProduction({
    id: entry.id,
    name: entry.name,
    scenes,
    sources: entry.sources,
    previewSceneId:
      hasPreviewScene && entry.previewSceneId
        ? entry.previewSceneId
        : scenes[0].id,
    program: null,
    settings: { ...defaultProductionSettings(), ...entry.settings },
    createdAt,
    updatedAt: entry.updatedAt || createdAt,
  });
};
