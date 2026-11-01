import { useMemo, useState } from "react";
import type { Manuscript, MediaItem, ScripturePassage } from "../../../types";
import { useStore } from "../../../store/useStore";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import { ManuscriptWorkspace } from "../../manuscripts/ManuscriptWorkspace";
import { ScriptureWorkspace } from "../../bible/ScriptureEditor";
import { MediaWorkspace } from "../../media/MediaEditorPage";
import type { MediaDraft } from "../../media/useMediaEditor";
import type {
  BibleLayer,
  ImageLayer,
  ManuscriptLayer,
  VideoLayer,
} from "../types/layer";
import { libraryManuscriptOf, libraryPassageOf } from "../lib/deckContent";
import { imageLookOf, videoLookOf } from "../lib/mediaLooks";
import { updateSceneItem } from "../store/itemActions";
import type { SceneEditingControls } from "./useSceneEditingControls";
import { ItemMissing } from "./ItemMissing";

interface SceneEditorProps<T> {
  layer: T;
  controls: SceneEditingControls;
}

export const SceneManuscriptEditor = ({
  layer,
  controls,
}: SceneEditorProps<ManuscriptLayer>) => {
  const libraryDoc = useStore((state) => libraryManuscriptOf(layer, state));
  const [source] = useState(() => layer.manuscript ?? libraryDoc);
  const layerId = layer.id;
  const scene = useMemo(
    () => ({
      ...controls,
      commit: (manuscript: Manuscript) => {
        updateSceneItem<ManuscriptLayer>(layerId, { manuscript });
        return true;
      },
    }),
    [controls, layerId],
  );

  if (!source) return <ItemMissing />;
  return <ManuscriptWorkspace manuscript={source} scene={scene} />;
};

export const ScenePassageEditor = ({
  layer,
  controls,
}: SceneEditorProps<BibleLayer>) => {
  const libraryDoc = useStore((state) => libraryPassageOf(layer, state));
  const [source] = useState(() => layer.passage ?? libraryDoc);
  const layerId = layer.id;
  const scene = useMemo(
    () => ({
      ...controls,
      commit: (passage: ScripturePassage) => {
        updateSceneItem<BibleLayer>(layerId, { passage });
        return true;
      },
    }),
    [controls, layerId],
  );

  if (!source) return <ItemMissing />;
  return <ScriptureWorkspace passage={source} scene={scene} />;
};

const sceneLookOf = (
  item: MediaItem,
  layer: ImageLayer | VideoLayer,
): MediaItem =>
  layer.type === "image"
    ? { ...item, name: layer.name, image: imageLookOf(item, layer.overrides) }
    : { ...item, name: layer.name, video: videoLookOf(item, layer.overrides) };

export const SceneMediaEditor = ({
  layer,
  controls,
}: SceneEditorProps<ImageLayer | VideoLayer>) => {
  const library = useMediaLibrary();
  const libraryItem = findMediaItem(
    library,
    layer.mediaId ?? undefined,
    layer.type,
  );
  const [source] = useState(() =>
    libraryItem ? sceneLookOf(libraryItem, layer) : null,
  );
  const layerId = layer.id;
  const kind = layer.type;
  const scene = useMemo(
    () => ({
      ...controls,
      commit: (draft: MediaDraft) => {
        if (kind === "image")
          updateSceneItem<ImageLayer>(layerId, {
            name: draft.name,
            overrides: draft.image,
          });
        else
          updateSceneItem<VideoLayer>(layerId, {
            name: draft.name,
            overrides: draft.video,
          });
        return true;
      },
    }),
    [controls, layerId, kind],
  );

  if (!source) return <ItemMissing />;
  return <MediaWorkspace item={source} scene={scene} />;
};
