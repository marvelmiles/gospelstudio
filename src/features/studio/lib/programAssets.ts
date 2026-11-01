import type {
  Background,
  Manuscript,
  MediaItem,
  ScripturePassage,
  SlideDeckDoc,
  Theme,
} from "../../../types";
import { resolveBackgroundId } from "../../../lib/resolve";
import { findMediaItem, type MediaLibrary } from "../../../lib/media";
import { customMedia, mergeChanged } from "../../../store/helpers";
import { useStore, type StoreState } from "../../../store/useStore";
import type { DeckLayer, Layer, LayerFill } from "../types/layer";
import { isFilledLayer } from "./layerFill";
import {
  fallbackThemeIdOf,
  libraryDeckDoc,
  libraryManuscriptOf,
  libraryPassageOf,
  ownDeckDoc,
} from "./deckContent";
import type { ProgramAssets } from "./outputChannel";

interface AssetCollector {
  media: Map<string, MediaItem>;
  backgrounds: Map<string, Background>;
  manuscripts: Map<string, Manuscript>;
  scriptures: Map<string, ScripturePassage>;
  themes: Map<string, Theme>;
}

const libraryOf = (state: StoreState): MediaLibrary => ({
  media: state.media,
  builtInMedia: state.builtInMedia,
});

const addBackground = (
  collector: AssetCollector,
  state: StoreState,
  backgroundId: string | null | undefined,
): void => {
  if (!backgroundId || collector.backgrounds.has(backgroundId)) return;
  const background = state.backgrounds.find(
    (entry) => entry.id === backgroundId,
  );
  if (!background) return;
  collector.backgrounds.set(background.id, background);
  const clip = findMediaItem(libraryOf(state), background.mediaId, "video");
  if (clip) collector.media.set(clip.id, clip);
};

const addMedia = (
  collector: AssetCollector,
  state: StoreState,
  mediaId: string | null,
): void => {
  const item = findMediaItem(libraryOf(state), mediaId ?? undefined);
  if (item) collector.media.set(item.id, item);
};

const addFill = (
  collector: AssetCollector,
  state: StoreState,
  fill: LayerFill,
): void => {
  if (fill.kind === "image") addMedia(collector, state, fill.imageId);
  if (fill.kind === "video") addMedia(collector, state, fill.videoId);
};

const addDeckLook = (
  collector: AssetCollector,
  state: StoreState,
  doc: SlideDeckDoc | undefined,
  themeId: string,
): void => {
  const theme =
    state.themes.find((entry) => entry.id === themeId) ?? state.themes[0];
  if (!theme) return;
  collector.themes.set(theme.id, theme);
  addBackground(collector, state, theme.backgroundId);
  addBackground(collector, state, doc?.defaultBackgroundId);
  for (const slide of doc?.slides ?? [])
    addBackground(collector, state, resolveBackgroundId(slide, doc, theme));
};

const addDeck = (
  collector: AssetCollector,
  state: StoreState,
  layer: DeckLayer,
): void => {
  if (layer.type === "manuscript") {
    const manuscript = libraryManuscriptOf(layer, state);
    if (manuscript) collector.manuscripts.set(manuscript.id, manuscript);
  } else {
    const passage = libraryPassageOf(layer, state);
    if (passage) collector.scriptures.set(passage.id, passage);
  }
  const doc = ownDeckDoc(layer) ?? libraryDeckDoc(layer, state) ?? undefined;
  addDeckLook(
    collector,
    state,
    doc,
    doc?.defaultThemeId || fallbackThemeIdOf(layer, state.prefs),
  );
};

const collectLayer = (
  collector: AssetCollector,
  state: StoreState,
  layer: Layer,
): void => {
  if (isFilledLayer(layer)) addFill(collector, state, layer.fill);
  switch (layer.type) {
    case "image":
    case "video":
      addMedia(collector, state, layer.mediaId);
      return;
    case "background":
      addBackground(collector, state, layer.backgroundId);
      return;
    case "manuscript":
    case "bible":
      addDeck(collector, state, layer);
      return;
    default:
      return;
  }
};

export const collectProgramAssets = (layers: Layer[]): ProgramAssets => {
  const state = useStore.getState();
  const collector: AssetCollector = {
    media: new Map(),
    backgrounds: new Map(),
    manuscripts: new Map(),
    scriptures: new Map(),
    themes: new Map(),
  };
  for (const layer of layers) collectLayer(collector, state, layer);
  return {
    media: [...collector.media.values()],
    backgrounds: [...collector.backgrounds.values()],
    manuscripts: [...collector.manuscripts.values()],
    scriptures: [...collector.scriptures.values()],
    themes: [...collector.themes.values()],
  };
};

export const applyProgramAssets = (assets: ProgramAssets): void =>
  useStore.setState((state) => ({
    media: mergeChanged(state.media, customMedia(assets.media)),
    builtInMedia: mergeChanged(
      state.builtInMedia,
      assets.media.filter((item) => item.builtIn),
    ),
    backgrounds: mergeChanged(state.backgrounds, assets.backgrounds),
    manuscripts: mergeChanged(state.manuscripts, assets.manuscripts),
    scriptures: mergeChanged(state.scriptures, assets.scriptures),
    themes: mergeChanged(state.themes, assets.themes),
  }));
