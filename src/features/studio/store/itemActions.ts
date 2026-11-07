import { now } from "../../../lib/id";
import { applyAssetUsage, type AssetUsageEdit } from "../../../lib/assetUsage";
import { useStore } from "../../../store/useStore";
import type {
  BibleLayer,
  DeckLayer,
  Layer,
  LayerPatch,
  ManuscriptLayer,
  VideoLayer,
} from "../types/layer";
import { libraryManuscriptOf, libraryPassageOf } from "../lib/deckContent";
import { findItemLayer, holdsLayer } from "../lib/sceneItems";
import { trackSceneEdited } from "../lib/studioAnalytics";
import { editProduction, useProductionStore } from "./productionStore";
import { updateLiveLayer } from "./programActions";

const patchLayer = (layers: Layer[], layerId: string, patch: object): Layer[] =>
  layers.map((layer) =>
    layer.id === layerId ? ({ ...layer, ...patch } as Layer) : layer,
  );

const isLiveItem = (layerId: string): boolean =>
  holdsLayer(
    useProductionStore.getState().production?.program?.layers ?? [],
    layerId,
  );

export const updateSceneItem = <T extends Layer>(
  layerId: string,
  patch: LayerPatch<T>,
): void => {
  const editedSceneIds: string[] = [];
  editProduction(
    (production) => {
      const scenes = production.scenes.map((scene) => {
        if (!holdsLayer(scene.layers, layerId)) return scene;
        editedSceneIds.push(scene.id);
        return {
          ...scene,
          layers: patchLayer(scene.layers, layerId, patch),
          updatedAt: now(),
        };
      });
      const { program } = production;
      return {
        ...production,
        scenes,
        program:
          program && holdsLayer(program.layers, layerId)
            ? { ...program, layers: patchLayer(program.layers, layerId, patch) }
            : program,
      };
    },
    { coalesceKey: `item:${layerId}` },
  );
  editedSceneIds.forEach(trackSceneEdited);
};

const updateQuietly = <T extends Layer>(
  layerId: string,
  patch: LayerPatch<T>,
): void => {
  if (isLiveItem(layerId)) {
    updateLiveLayer<T>(layerId, patch);
    return;
  }
  editProduction(
    (production) => ({
      ...production,
      scenes: production.scenes.map((scene) =>
        holdsLayer(scene.layers, layerId)
          ? { ...scene, layers: patchLayer(scene.layers, layerId, patch) }
          : scene,
      ),
    }),
    { record: false },
  );
};

export const showItemSlide = (layerId: string, slideIndex: number): void =>
  updateQuietly<DeckLayer>(layerId, { slideIndex });

export const setItemPlayback = (
  layerId: string,
  playback: VideoLayer["playback"],
): void => updateQuietly<VideoLayer>(layerId, { playback });

export const applySceneDocAssetUsage = (
  layerId: string,
  edit: AssetUsageEdit,
): boolean => {
  const layer = findItemLayer(
    useProductionStore.getState().production,
    layerId,
  );
  const library = useStore.getState();
  if (layer?.type === "manuscript") {
    const doc = layer.manuscript ?? libraryManuscriptOf(layer, library);
    if (!doc) return false;
    updateSceneItem<ManuscriptLayer>(layerId, {
      manuscript: { ...applyAssetUsage(doc, edit), updatedAt: now() },
    });
    return true;
  }
  if (layer?.type === "bible") {
    const doc = layer.passage ?? libraryPassageOf(layer, library);
    if (!doc) return false;
    updateSceneItem<BibleLayer>(layerId, {
      passage: { ...applyAssetUsage(doc, edit), updatedAt: now() },
    });
    return true;
  }
  return false;
};
