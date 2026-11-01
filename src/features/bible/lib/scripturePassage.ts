import type {
  BibleVerse,
  BibleVersionId,
  PassageRange,
  ScripturePassage,
  TextStyle,
} from "../../../types";
import { now } from "../../../lib/id";
import {
  DEFAULT_SCRIPTURE_THEME_ID,
  SCRIPTURE_PASSAGE_FONT_SIZE,
} from "../../../data/themes";
import { buildScriptureSlides } from "./scriptureSlides";
import { formatReference } from "./reference";

export interface ScriptureSelection {
  version: BibleVersionId;
  range: PassageRange;
  verses: BibleVerse[];
}

export interface SavePassageOptions extends ScriptureSelection {
  versesPerSlide?: number;
  showVerseNumbers?: boolean;
  showReference?: boolean;
  title?: string;
  splitLongVerses?: boolean;
}

export type PassageLayoutChanges = Partial<
  Pick<
    ScripturePassage,
    | "version"
    | "range"
    | "verses"
    | "versesPerSlide"
    | "showVerseNumbers"
    | "showReference"
  >
>;

export const PASSAGE_STYLE: TextStyle = {
  fontSize: SCRIPTURE_PASSAGE_FONT_SIZE,
};

export const buildScripturePassage = (
  options: SavePassageOptions,
  id: string,
  quick: boolean,
  themeId: string = DEFAULT_SCRIPTURE_THEME_ID,
): ScripturePassage => {
  const versesPerSlide = options.versesPerSlide ?? 1;
  const showVerseNumbers = options.showVerseNumbers ?? true;
  const showReference = options.showReference ?? true;
  return {
    id,
    title: options.title ?? formatReference(options.range, options.version),
    version: options.version,
    range: options.range,
    verses: options.verses,
    versesPerSlide,
    showVerseNumbers,
    showReference,
    quick: quick || undefined,
    slides: buildScriptureSlides({
      version: options.version,
      range: options.range,
      verses: options.verses,
      versesPerSlide,
      showVerseNumbers,
      showReference,
      splitLongVerses: options.splitLongVerses ?? quick,
      style: PASSAGE_STYLE,
    }),
    defaultThemeId: themeId,
    defaultBackgroundId: "",
    defaultAudioId: null,
    style: PASSAGE_STYLE,
    createdAt: now(),
    updatedAt: now(),
    deleted: false,
    builtIn: false,
  };
};

export const rebuildPassage = (
  current: ScripturePassage,
  changes: PassageLayoutChanges = {},
): ScripturePassage => {
  const next: ScripturePassage = { ...current, ...changes, updatedAt: now() };
  const style = { ...PASSAGE_STYLE, ...next.style };
  return {
    ...next,
    style,
    title: formatReference(next.range, next.version),
    slides: buildScriptureSlides({
      version: next.version,
      range: next.range,
      verses: next.verses,
      versesPerSlide: next.versesPerSlide,
      showVerseNumbers: next.showVerseNumbers,
      showReference: next.showReference,
      splitLongVerses: Boolean(next.quick),
      style,
    }),
  };
};
