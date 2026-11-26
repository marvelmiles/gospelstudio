import type {
  AudioItem,
  Background,
  Manuscript,
  MediaItem,
  Prefs,
  ScripturePassage,
  Theme,
} from "../types";
import { DEFAULT_AUDIO } from "../data/sounds";
import { readAllRecords } from "../lib/storage";
import {
  customAudio,
  customBackgrounds,
  customMedia,
  ensureBuiltInThemes,
  sortBuiltInFirst,
  withBuiltInBackgroundEdits,
  withBuiltInMediaEdits,
} from "./helpers";
import { DEFAULT_PREFS } from "./slices/prefsSlice";
import type { StoreState } from "./storeTypes";

export const LIBRARY_RECORD_STORES = [
  "manuscripts",
  "scriptures",
  "media",
  "backgrounds",
  "themes",
  "audio",
  "prefs",
] as const;

export type LibraryRecordStore = (typeof LIBRARY_RECORD_STORES)[number];

export type LibraryState = Pick<
  StoreState,
  | "manuscripts"
  | "scriptures"
  | "media"
  | "builtInMedia"
  | "backgrounds"
  | "themes"
  | "audio"
  | "prefs"
>;

export const mediaState = (
  stored: MediaItem[],
): Pick<LibraryState, "media" | "builtInMedia"> => ({
  media: customMedia(stored),
  builtInMedia: withBuiltInMediaEdits(stored),
});

export const backgroundsState = (
  stored: Background[],
): Pick<LibraryState, "backgrounds"> => ({
  backgrounds: [
    ...withBuiltInBackgroundEdits(stored),
    ...customBackgrounds(stored),
  ],
});

export const audioState = (
  stored: AudioItem[],
): Pick<LibraryState, "audio"> => ({
  audio: [...DEFAULT_AUDIO, ...customAudio(stored)],
});

export const themesState = (stored: Theme[]): Pick<LibraryState, "themes"> => ({
  themes: sortBuiltInFirst(ensureBuiltInThemes(stored)),
});

export const prefsFrom = (stored: Prefs | undefined): Prefs =>
  stored ? { ...DEFAULT_PREFS, ...stored } : DEFAULT_PREFS;

const READERS: Record<
  LibraryRecordStore,
  () => Promise<Partial<LibraryState>>
> = {
  manuscripts: async () => ({
    manuscripts: await readAllRecords<Manuscript>("manuscripts"),
  }),
  scriptures: async () => ({
    scriptures: await readAllRecords<ScripturePassage>("scriptures"),
  }),
  media: async () => mediaState(await readAllRecords<MediaItem>("media")),
  backgrounds: async () =>
    backgroundsState(await readAllRecords<Background>("backgrounds")),
  themes: async () => themesState(await readAllRecords<Theme>("themes")),
  audio: async () => audioState(await readAllRecords<AudioItem>("audio")),
  prefs: async () => ({
    prefs: prefsFrom((await readAllRecords<Prefs>("prefs"))[0]),
  }),
};

export const readLibraryState = async (
  stores: readonly LibraryRecordStore[],
): Promise<Partial<LibraryState>> =>
  Object.assign(
    {},
    ...(await Promise.all(stores.map((store) => READERS[store]()))),
  );
