import type { Scene } from "../types/scene";
import { useProductionStore } from "../store/productionStore";
import { previewSceneOf, takeProgramSnapshot } from "./productionFactory";
import { collectProgramAssets } from "./programAssets";
import { openPreviewChannel, postPreviewMessage } from "./previewChannel";

let channel: BroadcastChannel | null = null;

export const publishPreview = (scene: Scene, show = false): void =>
  postPreviewMessage(channel, {
    type: "frame",
    frame: {
      program: takeProgramSnapshot(scene),
      assets: collectProgramAssets(scene.layers),
    },
    show,
  });

export const showPreviewNow = (): void => {
  const { production } = useProductionStore.getState();
  if (production) publishPreview(previewSceneOf(production), true);
};

export const startPreviewPublisher = (): void => {
  if (channel) return;
  channel = openPreviewChannel((message) => {
    if (message.type === "hello") showPreviewNow();
  });
};
