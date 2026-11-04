import type { ScripturePassage } from "../../types";
import { now, uid } from "../../lib/id";
import { deleteRecord, saveRecord } from "../../lib/storage";
import { buildScriptureSlides } from "../../features/bible/lib/scriptureSlides";
import {
  PASSAGE_STYLE,
  buildScripturePassage,
  type SavePassageOptions,
  type ScriptureSelection,
} from "../../features/bible/lib/scripturePassage";
import { afterDelete, afterWrite, blockWrite } from "../helpers";
import { DEFAULT_SCRIPTURE_THEME_ID } from "../../data/themes";
import type { PresentStartOptions } from "./presentSlice";
import type { SliceCreator } from "../storeTypes";

export type {
  SavePassageOptions,
  ScriptureSelection,
} from "../../features/bible/lib/scripturePassage";

const QUICK_PASSAGE_ID = "scripture-quick-present";

interface StageSelectionOptions {
  id?: string;
  splitLongVerses?: boolean;
}

export interface ScripturesSlice {
  scriptures: ScripturePassage[];

  upsertScripture: (passage: ScripturePassage) => boolean;
  saveScripturePassage: (
    options: SavePassageOptions,
  ) => ScripturePassage | null;
  overwriteScripturePassage: (
    id: string,
    options: SavePassageOptions,
  ) => ScripturePassage | null;
  trashScripture: (id: string) => void;
  restoreScripture: (id: string) => void;
  deleteScripture: (id: string) => void;
  presentScriptureSelection: (
    selection: ScriptureSelection,
    options?: Pick<PresentStartOptions, "live">,
  ) => void;
  stageScriptureSelection: (
    selection: ScriptureSelection,
    options?: StageSelectionOptions,
  ) => ScripturePassage | null;
}

export const createScripturesSlice: SliceCreator<ScripturesSlice> = (
  set,
  get,
) => ({
  scriptures: [],

  upsertScripture: (passage) => {
    if (blockWrite(get)) return false;
    set((state) => {
      const exists = state.scriptures.some((s) => s.id === passage.id);
      const scriptures = exists
        ? state.scriptures.map((s) => (s.id === passage.id ? passage : s))
        : [passage, ...state.scriptures];
      return { scriptures };
    });
    void saveRecord("scriptures", passage);
    afterWrite(get);
    return true;
  },

  saveScripturePassage: (options) => {
    if (blockWrite(get)) return null;
    const passage = buildScripturePassage(
      options,
      uid(),
      false,
      scriptureThemeId(get),
    );
    get().upsertScripture(passage);
    return passage;
  },

  overwriteScripturePassage: (id, options) => {
    if (blockWrite(get)) return null;
    const current = get().scriptures.find((s) => s.id === id);
    if (!current) return null;
    const versesPerSlide = options.versesPerSlide ?? 1;
    const showVerseNumbers = options.showVerseNumbers ?? true;
    const showReference = options.showReference ?? true;
    const next: ScripturePassage = {
      ...current,
      version: options.version,
      range: options.range,
      verses: options.verses,
      versesPerSlide,
      showVerseNumbers,
      showReference,
      slides: buildScriptureSlides({
        version: options.version,
        range: options.range,
        verses: options.verses,
        versesPerSlide,
        showVerseNumbers,
        raisedVerseNumbers: current.raisedVerseNumbers,
        showReference,
        splitLongVerses: Boolean(current.quick),
        style: current.style ?? PASSAGE_STYLE,
      }),
      updatedAt: now(),
    };
    get().upsertScripture(next);
    return next;
  },

  trashScripture: (id) => {
    const passage = get().scriptures.find((s) => s.id === id);
    if (passage)
      get().upsertScripture({
        ...passage,
        deleted: true,
        pinned: undefined,
        updatedAt: now(),
      });
  },
  restoreScripture: (id) => {
    const passage = get().scriptures.find((s) => s.id === id);
    if (passage)
      get().upsertScripture({ ...passage, deleted: false, updatedAt: now() });
  },
  deleteScripture: (id) => {
    set((state) => ({
      scriptures: state.scriptures.filter((s) => s.id !== id),
    }));
    void deleteRecord("scriptures", id);
    afterDelete(get);
  },

  presentScriptureSelection: (selection, options = {}) => {
    if (blockWrite(get)) return;
    const passage = buildScripturePassage(
      { ...selection, showVerseNumbers: false },
      QUICK_PASSAGE_ID,
      true,
      scriptureThemeId(get),
    );
    get().upsertScripture(passage);
    get().startPresent("scripture", passage.id, 0, options);
  },

  stageScriptureSelection: (selection, options = {}) => {
    if (blockWrite(get)) return null;
    const passage = buildScripturePassage(
      {
        ...selection,
        showVerseNumbers: false,
        splitLongVerses: options.splitLongVerses,
      },
      options.id ?? QUICK_PASSAGE_ID,
      true,
      scriptureThemeId(get),
    );
    get().upsertScripture(passage);
    return passage;
  },
});

const scriptureThemeId = (
  get: () => { prefs: { defaultScriptureThemeId: string } },
): string => {
  return get().prefs.defaultScriptureThemeId || DEFAULT_SCRIPTURE_THEME_ID;
};
