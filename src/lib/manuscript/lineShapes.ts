import { readStanzaOpener } from "./numbering";
import { isKnownSection, matchSectionHeader, sectionMetaFor } from "./sections";
import { matchRepeatDirective } from "./repeats";

const MAX_TITLE_WORDS = 12;
const MAX_TITLE_CHARACTERS = 80;
const TRAILING_CONTINUATION = /[,;]$/;
const ENDING_LINE = /^(?:a+men|hall?e?lu[jy]ah|alleluia)[\s!.]*$/i;
const LOWERCASE_LETTER = /\p{Ll}/u;
const UPPERCASE_LETTER = /\p{Lu}/gu;
const NON_WORD = /[^\p{L}\p{N}]+/gu;

export const wordCount = (value: string): number =>
  value.trim().split(/\s+/).filter(Boolean).length;

export const lineKey = (value: string): string =>
  value.toLowerCase().replace(NON_WORD, " ").trim();

export const hasLowercase = (value: string): boolean =>
  LOWERCASE_LETTER.test(value);

export const isAllCapsLine = (value: string): boolean =>
  !hasLowercase(value) && (value.match(UPPERCASE_LETTER)?.length ?? 0) >= 2;

const isEndingLine = (value: string): boolean => ENDING_LINE.test(value.trim());

export const opensFirstStanza = (line: string): boolean => {
  const stanza = readStanzaOpener(line, false);
  if (stanza) return stanza.number === 1;
  const header = matchSectionHeader(line);
  return Boolean(
    header && header.num === 1 && sectionMetaFor(header.base).label === "Verse",
  );
};

export const isTitleCandidate = (line: string): boolean => {
  const text = line.trim();
  if (!text || !/\p{L}/u.test(text)) return false;
  if (text.length > MAX_TITLE_CHARACTERS || wordCount(text) > MAX_TITLE_WORDS)
    return false;
  if (TRAILING_CONTINUATION.test(text) || isEndingLine(text)) return false;
  if (matchSectionHeader(text) || readStanzaOpener(text, false)) return false;
  return !matchRepeatDirective(text, isKnownSection);
};

export interface ShoutedTitleSurroundings {
  lyricsHaveLowercase: boolean;
  repeatedAsLyric: boolean;
  standsAlone: boolean;
}

export const looksLikeShoutedTitle = (
  line: string,
  surroundings: ShoutedTitleSurroundings,
): boolean => {
  const text = line.trim();
  if (!isAllCapsLine(text) || text.includes(":") || !isTitleCandidate(text))
    return false;
  if (!surroundings.lyricsHaveLowercase || surroundings.repeatedAsLyric)
    return false;
  return wordCount(text) >= 2 || surroundings.standsAlone;
};

export const isShoutedTitle = (line: string, following: string[]): boolean => {
  if (!isAllCapsLine(line)) return false;
  const key = lineKey(line);
  const lyrics = following.filter((value) => value.trim() !== "");
  return looksLikeShoutedTitle(line, {
    lyricsHaveLowercase: lyrics.some(hasLowercase),
    repeatedAsLyric: lyrics.some((value) => lineKey(value) === key),
    standsAlone: following[0] === undefined || following[0].trim() === "",
  });
};
