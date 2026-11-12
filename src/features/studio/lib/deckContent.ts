import type {
  Manuscript,
  Prefs,
  ScripturePassage,
  SlideDeckDoc,
} from "../../../types";
import { now, uid } from "../../../lib/id";
import { useStore } from "../../../store/useStore";
import type { PassagePick } from "../../bible/PassagePicker";
import {
  buildScripturePassage,
  rebuildPassage,
  type ScriptureSelection,
} from "../../bible/lib/scripturePassage";
import type {
  BibleLayer,
  DeckLayer,
  Layer,
  LayerPatch,
  ManuscriptLayer,
} from "../types/layer";

const STUDIO_VERSES_PER_SLIDE = 2;

interface DeckLibrary {
  manuscripts: Manuscript[];
  scriptures: ScripturePassage[];
}

export const isDeckLayer = (layer: Layer): layer is DeckLayer =>
  layer.type === "manuscript" || layer.type === "bible";

export const ownDeckDoc = (layer: DeckLayer): SlideDeckDoc | null =>
  layer.type === "manuscript" ? layer.manuscript : layer.passage;

const findLibraryDoc = <T extends SlideDeckDoc>(
  docs: T[],
  id: string | null,
): T | null =>
  id ? (docs.find((doc) => doc.id === id && !doc.deleted) ?? null) : null;

export const libraryManuscriptOf = (
  layer: ManuscriptLayer,
  library: DeckLibrary,
): Manuscript | null => findLibraryDoc(library.manuscripts, layer.manuscriptId);

export const libraryPassageOf = (
  layer: BibleLayer,
  library: DeckLibrary,
): ScripturePassage | null =>
  findLibraryDoc(library.scriptures, layer.passageId);

export const libraryDeckDoc = (
  layer: DeckLayer,
  library: DeckLibrary,
): SlideDeckDoc | null =>
  layer.type === "manuscript"
    ? libraryManuscriptOf(layer, library)
    : libraryPassageOf(layer, library);

export const deckDocOf = (
  layer: DeckLayer,
  library: DeckLibrary,
): SlideDeckDoc | null => ownDeckDoc(layer) ?? libraryDeckDoc(layer, library);

export const fallbackThemeIdOf = (layer: DeckLayer, prefs: Prefs): string =>
  layer.type === "manuscript"
    ? prefs.defaultManuscriptThemeId
    : prefs.defaultScriptureThemeId;

const versesOf = (pick: PassagePick): ScriptureSelection => {
  const { version, range, verses } =
    pick.kind === "saved" ? pick.passage : pick.selection;
  return { version, range, verses };
};

const passageInLook = (
  look: ScripturePassage,
  pick: PassagePick,
): LayerPatch<BibleLayer> => {
  const passage = rebuildPassage(
    { ...look, id: uid(), createdAt: now() },
    versesOf(pick),
    { splitLongVerses: true },
  );
  return {
    name: passage.title,
    passageId: pick.kind === "saved" ? pick.passage.id : null,
    passage,
    slideIndex: 0,
  };
};

export const passagePatch = (
  pick: PassagePick,
  sceneLook: ScripturePassage | null = null,
): LayerPatch<BibleLayer> => {
  if (sceneLook) return passageInLook(sceneLook, pick);
  if (pick.kind === "saved")
    return {
      name: pick.passage.title,
      passageId: pick.passage.id,
      passage: null,
      slideIndex: 0,
    };
  const themeId = useStore.getState().prefs.defaultScriptureThemeId;
  const passage = buildScripturePassage(
    {
      ...pick.selection,
      versesPerSlide: STUDIO_VERSES_PER_SLIDE,
      splitLongVerses: true,
    },
    uid(),
    false,
    themeId,
  );
  return {
    name: passage.title,
    passageId: null,
    passage,
    slideIndex: 0,
  };
};
