import type { BibleVersionId, Prefs } from "../../types";
import { DEFAULT_BIBLE_VERSION } from "../../data/bibleBooks";
import {
  DEFAULT_MANUSCRIPT_THEME_ID,
  DEFAULT_SCRIPTURE_THEME_ID,
} from "../../data/themes";
import { saveRecord } from "../../lib/storage";
import type { SliceCreator } from "../storeTypes";

export const DEFAULT_PREFS: Prefs = {
  id: "app",
  transition: "fade",
  transitionDuration: 500,
  easing: "ease",
  backgroundVolume: 70,
  loopAudio: true,
  showPresenterBar: true,
  presentationView: "normal",
  autoHideControls: true,
  autoHidePresenterBar: true,
  bibleVersion: DEFAULT_BIBLE_VERSION,
  defaultManuscriptThemeId: DEFAULT_MANUSCRIPT_THEME_ID,
  defaultScriptureThemeId: DEFAULT_SCRIPTURE_THEME_ID,
  onboarded: false,
  goLiveTipDismissed: false,
  hymnalVersion: 0,
};

export interface PrefsSlice {
  prefs: Prefs;

  savePrefs: (prefs: Prefs) => void;
  setBibleVersion: (version: BibleVersionId) => void;
}

export const createPrefsSlice: SliceCreator<PrefsSlice> = (set, get) => ({
  prefs: DEFAULT_PREFS,

  savePrefs: (prefs) => {
    set({ prefs });
    void saveRecord("prefs", prefs);
  },

  setBibleVersion: (version) => {
    get().savePrefs({ ...get().prefs, bibleVersion: version });
  },
});
