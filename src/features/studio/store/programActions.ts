import { now } from "../../../lib/id";
import type { Layer, LayerPatch } from "../types/layer";
import type { ProgramSnapshot } from "../types/production";
import { previewSceneOf, takeProgramSnapshot } from "../lib/productionFactory";
import { editProduction, useProductionStore } from "./productionStore";

export type TakeMode = "transition" | "cut";

export const BLACK_SCREEN_SCENE_ID = "black-screen";

const BLACK_SCREEN_FADE_MS = 500;

export const goLive = (mode: TakeMode): void => {
  const { production } = useProductionStore.getState();
  if (!production) return;
  const snapshot = takeProgramSnapshot(previewSceneOf(production));
  const program: ProgramSnapshot =
    mode === "cut"
      ? { ...snapshot, transition: { kind: "cut", durationMs: 0 } }
      : snapshot;
  editProduction((current) => ({ ...current, program }), { record: false });
};

export const showBlackScreen = (): void =>
  editProduction(
    (production) => ({
      ...production,
      program: {
        sceneId: BLACK_SCREEN_SCENE_ID,
        sceneName: "Black screen",
        layers: [],
        background: "#000000",
        transition: { kind: "fade", durationMs: BLACK_SCREEN_FADE_MS },
        takenAt: now(),
      },
    }),
    { record: false },
  );

const patchLayers = (
  layers: Layer[],
  layerId: string,
  patch: object,
): Layer[] =>
  layers.map((layer) =>
    layer.id === layerId ? ({ ...layer, ...patch } as Layer) : layer,
  );

export const updateLiveLayer = <T extends Layer>(
  layerId: string,
  patch: LayerPatch<T>,
): void =>
  editProduction(
    (production) => {
      const { program } = production;
      if (!program) return production;
      return {
        ...production,
        program: {
          ...program,
          layers: patchLayers(program.layers, layerId, patch),
        },
        scenes: production.scenes.map((scene) =>
          scene.id === program.sceneId
            ? { ...scene, layers: patchLayers(scene.layers, layerId, patch) }
            : scene,
        ),
      };
    },
    { record: false },
  );
