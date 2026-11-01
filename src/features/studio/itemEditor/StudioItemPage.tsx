import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { LoadingArea } from "@/components/shared/LoadingArea";
import type { Layer } from "../types/layer";
import { hasItemEditor, hasItemPip } from "../lib/itemEditing";
import { useProductionSession } from "../hooks/useProductionSession";
import { useProductionStore } from "../store/productionStore";
import { findItemLayer, findSceneItem } from "../lib/sceneItems";
import { openItemPip } from "../pip/pipStore";
import { ItemMissing } from "./ItemMissing";
import {
  SceneManuscriptEditor,
  SceneMediaEditor,
  ScenePassageEditor,
} from "./SceneItemEditors";
import { useSceneEditingControls } from "./useSceneEditingControls";

const useOpenPipWhenOnScreen = (layerId: string, isReady: boolean): void => {
  useEffect(() => {
    if (!isReady) return;
    const item = findSceneItem(
      useProductionStore.getState().production,
      layerId,
    );
    if (item && (item.isLive || item.isInPreview) && hasItemPip(item.layer))
      openItemPip(layerId);
  }, [isReady, layerId]);
};

export const StudioItemPage = () => {
  const { layerId = "" } = useParams();
  useProductionSession();
  const isReady = useProductionStore(
    (state) => state.status === "ready" && state.production !== null,
  );
  const layer = useProductionStore((state) =>
    findItemLayer(state.production, layerId),
  );
  useOpenPipWhenOnScreen(layerId, isReady);

  if (!isReady) return <LoadingArea />;
  if (!layer || !hasItemEditor(layer)) return <ItemMissing />;
  return <ItemEditor key={layer.id} layer={layer} />;
};

const ItemEditor = ({ layer }: { layer: Layer }) => {
  const controls = useSceneEditingControls(layer.id);
  switch (layer.type) {
    case "manuscript":
      return <SceneManuscriptEditor layer={layer} controls={controls} />;
    case "bible":
      return <ScenePassageEditor layer={layer} controls={controls} />;
    case "image":
    case "video":
      return <SceneMediaEditor layer={layer} controls={controls} />;
    default:
      return <ItemMissing />;
  }
};
