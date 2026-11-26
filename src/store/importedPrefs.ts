import type { Prefs } from "../types";
import type { ImportedPrefs } from "../lib/schema";
import { DEFAULT_BIBLE_VERSION, isBibleVersion } from "../data/bibleBooks";

const definedOnly = (prefs: ImportedPrefs): Partial<Prefs> =>
  Object.fromEntries(
    Object.entries(prefs).filter(([, value]) => value !== undefined),
  ) as Partial<Prefs>;

const withSupportedBibleVersion = (prefs: Prefs): Prefs =>
  isBibleVersion(prefs.bibleVersion)
    ? prefs
    : { ...prefs, bibleVersion: DEFAULT_BIBLE_VERSION };

export const mergeImportedPrefs = (
  current: Prefs,
  imported: ImportedPrefs,
): Prefs => withSupportedBibleVersion({ ...current, ...definedOnly(imported) });
