import type { ManuscriptFormat } from "../../types";
import {
  DEFAULT_MANUSCRIPT_FORMAT,
  defaultFormatForCollection,
} from "./format";
import { extractManuscriptMetadata } from "./metadata";
import { matchDelimitedStanzaNumber } from "./numbering";
import { extractRepeatCount, matchRepeatDirective } from "./repeats";
import { isKnownSection, matchSectionHeader } from "./sections";
import { isLabeledPreambleLine } from "./sermon";

const PREAMBLE_LINE_LENGTH = 40;
const PROSE_LINE_LENGTH = 90;
const PROSE_LONG_LINE = 100;
const PROSE_LONG_LINE_SHARE = 0.4;
const SONG_MARKER_MINIMUM = 3;
const WRAPPED_PROSE_LINE_LENGTH = 60;

const isSongMarker = (line: string): boolean =>
  matchSectionHeader(line) !== null ||
  matchDelimitedStanzaNumber(line) !== null ||
  extractRepeatCount(line).count !== null ||
  matchRepeatDirective(line, isKnownSection) !== null;

export const detectManuscriptFormat = (lines: string[]): ManuscriptFormat => {
  const declared = extractManuscriptMetadata(lines).collection;
  if (declared) return defaultFormatForCollection(declared);

  const content = lines.map((line) => line.trim()).filter(Boolean);
  if (!content.length) return DEFAULT_MANUSCRIPT_FORMAT;

  const characters = content.reduce((total, line) => total + line.length, 0);
  const averageLength = characters / content.length;
  const longLineShare =
    content.filter((line) => line.length >= PROSE_LONG_LINE).length /
    content.length;

  if (
    averageLength >= PREAMBLE_LINE_LENGTH &&
    content.some(isLabeledPreambleLine)
  )
    return "sermon";
  if (
    averageLength >= PROSE_LINE_LENGTH ||
    longLineShare >= PROSE_LONG_LINE_SHARE
  )
    return "sermon";
  if (content.filter(isSongMarker).length >= SONG_MARKER_MINIMUM) return "song";
  return averageLength >= WRAPPED_PROSE_LINE_LENGTH ? "sermon" : "song";
};
