import { PARTICLE_WAVE_BACKGROUND_ID } from "../../../data/backgrounds";
import type { SceneCreationSource } from "../../../lib/analytics/analyticsEvents";
import type { Scene, SceneTransition } from "../types/scene";
import { withFreshIds } from "../lib/layerDefaults";
import {
  copyScene,
  createLayout,
  createScene,
  findScene,
  nextSceneName,
  sceneFromLayout,
  sceneFromTemplate,
} from "../lib/productionFactory";
import { findTemplate, type TemplateContext } from "../lib/sceneTemplates";
import { removeLayout, writeLayout } from "../lib/productionStorage";
import { trackSceneCreated, trackSceneDeleted } from "../lib/studioAnalytics";
import { selectLayer } from "./editorStore";
import {
  editProduction,
  editScene,
  useProductionStore,
} from "./productionStore";

const templateContext = (): TemplateContext => {
  const { production } = useProductionStore.getState();
  return {
    cameraSourceId: production?.sources[0]?.id ?? null,
    backgroundId: PARTICLE_WAVE_BACKGROUND_ID,
  };
};

const hasScene = (sceneId: string): boolean =>
  Boolean(
    useProductionStore
      .getState()
      .production?.scenes.some((scene) => scene.id === sceneId),
  );

const insertAfterPreview = (
  created: Scene,
  source: SceneCreationSource,
): void => {
  editProduction((production) => {
    const scene: Scene = {
      ...created,
      transition: { ...production.settings.defaultTransition },
    };
    const index = production.scenes.findIndex(
      (entry) => entry.id === production.previewSceneId,
    );
    const scenes = [...production.scenes];
    scenes.splice(index < 0 ? scenes.length : index + 1, 0, scene);
    return { ...production, scenes, previewSceneId: scene.id };
  });
  selectLayer(null);
  if (hasScene(created.id)) trackSceneCreated(created.id, source);
};

export const addBlankScene = (): void => {
  const { production } = useProductionStore.getState();
  if (!production) return;
  insertAfterPreview(createScene(nextSceneName(production.scenes)), "blank");
};

export const addSceneFromTemplate = (templateId: string): void =>
  insertAfterPreview(
    sceneFromTemplate(templateId, templateContext()),
    "template",
  );

export const applyTemplate = (sceneId: string, templateId: string): void => {
  const template = findTemplate(templateId);
  if (!template) return;
  const context = templateContext();
  editScene(sceneId, (scene) => ({
    ...scene,
    layers: template.build(context),
    background: template.background,
  }));
  selectLayer(null);
};

export const addSceneFromLayout = (layoutId: string): void => {
  const layout = useProductionStore
    .getState()
    .layouts.find((entry) => entry.id === layoutId);
  if (layout) insertAfterPreview(sceneFromLayout(layout), "layout");
};

export const applyLayout = (sceneId: string, layoutId: string): void => {
  const layout = useProductionStore
    .getState()
    .layouts.find((entry) => entry.id === layoutId);
  if (!layout) return;
  editScene(sceneId, (scene) => ({
    ...scene,
    layers: withFreshIds(layout.layers),
    background: layout.background,
  }));
  selectLayer(null);
};

export const duplicateScene = (sceneId: string): void => {
  const { production } = useProductionStore.getState();
  const scene = production && findScene(production, sceneId);
  if (!scene) return;
  const copy = copyScene(scene, `${scene.name} copy`);
  editProduction((current) => {
    const index = current.scenes.findIndex((entry) => entry.id === sceneId);
    const scenes = [...current.scenes];
    scenes.splice(index + 1, 0, copy);
    return { ...current, scenes, previewSceneId: copy.id };
  });
  selectLayer(null);
  if (hasScene(copy.id)) trackSceneCreated(copy.id, "duplicate");
};

export const renameScene = (sceneId: string, name: string): void => {
  const trimmed = name.trim();
  if (!trimmed) return;
  editScene(
    sceneId,
    (scene) => (scene.name === trimmed ? scene : { ...scene, name: trimmed }),
    { coalesceKey: `name:${sceneId}` },
  );
};

export const removeScene = (sceneId: string): void => {
  const existed = hasScene(sceneId);
  editProduction((production) => {
    const index = production.scenes.findIndex((scene) => scene.id === sceneId);
    if (index < 0) return production;
    const remaining = production.scenes.filter((scene) => scene.id !== sceneId);
    const scenes = remaining.length ? remaining : [createScene("Scene 1")];
    const previewSceneId =
      production.previewSceneId === sceneId
        ? scenes[Math.min(index, scenes.length - 1)].id
        : production.previewSceneId;
    return { ...production, scenes, previewSceneId };
  });
  selectLayer(null);
  if (existed && !hasScene(sceneId)) trackSceneDeleted();
};

export const moveScene = (sceneId: string, targetIndex: number): void =>
  editProduction((production) => {
    const fromIndex = production.scenes.findIndex(
      (scene) => scene.id === sceneId,
    );
    const toIndex = Math.min(
      Math.max(targetIndex, 0),
      production.scenes.length - 1,
    );
    if (fromIndex < 0 || fromIndex === toIndex) return production;
    const scenes = [...production.scenes];
    const [moved] = scenes.splice(fromIndex, 1);
    scenes.splice(toIndex, 0, moved);
    return { ...production, scenes };
  });

export const showSceneInPreview = (sceneId: string): void => {
  const { production } = useProductionStore.getState();
  if (!production || production.previewSceneId === sceneId) return;
  editProduction((current) => ({ ...current, previewSceneId: sceneId }), {
    record: false,
  });
  selectLayer(null);
};

export const setSceneTransition = (
  sceneId: string,
  transition: SceneTransition,
): void =>
  editScene(sceneId, (scene) => ({ ...scene, transition }), {
    coalesceKey: `transition:${sceneId}`,
  });

export const setSceneBackground = (sceneId: string, background: string): void =>
  editScene(sceneId, (scene) => ({ ...scene, background }), {
    coalesceKey: `background:${sceneId}`,
  });

export const saveSceneAsLayout = async (
  sceneId: string,
  name: string,
): Promise<boolean> => {
  const { production } = useProductionStore.getState();
  const scene = production && findScene(production, sceneId);
  const trimmed = name.trim();
  if (!scene || !trimmed) return false;
  const layout = createLayout(scene, trimmed);
  try {
    await writeLayout(layout);
  } catch {
    return false;
  }
  useProductionStore.setState((state) => ({
    layouts: [layout, ...state.layouts],
  }));
  return true;
};

export const deleteLayout = (layoutId: string): void => {
  useProductionStore.setState((state) => ({
    layouts: state.layouts.filter((layout) => layout.id !== layoutId),
  }));
  void removeLayout(layoutId);
};
