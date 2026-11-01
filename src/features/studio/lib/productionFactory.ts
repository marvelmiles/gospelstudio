import { now, uid } from "../../../lib/id";
import { deepEqual } from "../../../lib/equality";
import type { Layer } from "../types/layer";
import type {
  ProductionSettings,
  ProgramSnapshot,
  Production,
  ProductionSummary,
} from "../types/production";
import type { Scene, SceneLayout } from "../types/scene";
import { withFreshIds } from "./layerDefaults";
import { DEFAULT_SCENE_TRANSITION } from "./sceneTransitions";
import {
  BLANK_TEMPLATE_ID,
  findTemplate,
  type TemplateContext,
} from "./sceneTemplates";

const DEFAULT_PRODUCTION_NAME = "Sunday service";
export const DEFAULT_SCENE_BACKGROUND = "#000000";

export const defaultProductionSettings = (): ProductionSettings => ({
  snapToGuides: true,
  defaultTransition: { ...DEFAULT_SCENE_TRANSITION },
  autoUpdateScene: true,
});

export const createScene = (
  name: string,
  layers: Layer[] = [],
  background = DEFAULT_SCENE_BACKGROUND,
): Scene => {
  const timestamp = now();
  return {
    id: uid(),
    name,
    layers,
    transition: { ...DEFAULT_SCENE_TRANSITION },
    background,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const sceneFromTemplate = (
  templateId: string,
  context: TemplateContext,
  name?: string,
): Scene => {
  const template = findTemplate(templateId) ?? findTemplate(BLANK_TEMPLATE_ID);
  if (!template) return createScene(name ?? "Scene");
  return createScene(
    name ?? template.name,
    template.build(context),
    template.background,
  );
};

export const sceneFromLayout = (layout: SceneLayout): Scene =>
  createScene(layout.name, withFreshIds(layout.layers), layout.background);

export const copyScene = (scene: Scene, name: string): Scene => ({
  ...createScene(name, withFreshIds(scene.layers), scene.background),
  transition: { ...scene.transition },
});

export const createProduction = (
  name = DEFAULT_PRODUCTION_NAME,
  scenes: Scene[] = [createScene("Scene 1")],
): Production => {
  const timestamp = now();
  return {
    id: uid(),
    name,
    scenes,
    sources: [],
    previewSceneId: scenes[0].id,
    program: null,
    settings: defaultProductionSettings(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const copyProduction = (production: Production, name: string) => {
  const scenes = production.scenes.map((scene) => copyScene(scene, scene.name));
  const previewIndex = production.scenes.findIndex(
    (scene) => scene.id === production.previewSceneId,
  );
  return {
    ...createProduction(name, scenes),
    sources: structuredClone(production.sources),
    settings: structuredClone(production.settings),
    previewSceneId: scenes[Math.max(previewIndex, 0)].id,
  };
};

export const createLayout = (scene: Scene, name: string): SceneLayout => {
  const timestamp = now();
  return {
    id: uid(),
    name,
    layers: structuredClone(scene.layers),
    background: scene.background,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

const liveLayerOf = (layer: Layer): Layer =>
  layer.type === "video"
    ? { ...layer, playback: { ...layer.playback, playing: layer.autoplay } }
    : layer;

const withoutPlayback = (layer: Layer): Layer =>
  layer.type === "video"
    ? { ...layer, playback: { playing: false, restartToken: 0 } }
    : layer;

export const isSceneLive = (
  scene: Scene,
  program: ProgramSnapshot | null,
): boolean =>
  Boolean(
    program &&
    program.sceneId === scene.id &&
    program.background === scene.background &&
    deepEqual(
      program.layers.map(withoutPlayback),
      scene.layers.map(withoutPlayback),
    ),
  );

export const isSameSnapshot = (
  a: ProgramSnapshot,
  b: ProgramSnapshot,
): boolean =>
  a.sceneId === b.sceneId &&
  a.background === b.background &&
  deepEqual(a.transition, b.transition) &&
  deepEqual(a.layers, b.layers);

export const takeProgramSnapshot = (scene: Scene): ProgramSnapshot => ({
  sceneId: scene.id,
  sceneName: scene.name,
  layers: structuredClone(scene.layers).map(liveLayerOf),
  background: scene.background,
  transition: { ...scene.transition },
  takenAt: now(),
});

export const summariseProduction = (
  production: Production,
): ProductionSummary => ({
  id: production.id,
  name: production.name,
  sceneCount: production.scenes.length,
  updatedAt: production.updatedAt,
});

export const nextSceneName = (scenes: Scene[], base = "Scene"): string => {
  const taken = new Set(scenes.map((scene) => scene.name));
  for (let index = scenes.length + 1; ; index += 1) {
    const candidate = `${base} ${index}`;
    if (!taken.has(candidate)) return candidate;
  }
};

export const findScene = (
  production: Production,
  sceneId: string | null | undefined,
): Scene | undefined => production.scenes.find((scene) => scene.id === sceneId);

export const previewSceneOf = (production: Production): Scene =>
  findScene(production, production.previewSceneId) ?? production.scenes[0];

export const referencedSourceIds = (layers: Layer[]): string[] =>
  layers.flatMap((layer) =>
    layer.type === "camera" && layer.sourceId ? [layer.sourceId] : [],
  );
