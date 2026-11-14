import type { ManuscriptFormat } from "../../types";
import { SERMON_COLLECTION } from "../../data/collections";

export const DEFAULT_MANUSCRIPT_FORMAT: ManuscriptFormat = "song";

const PROSE_COLLECTIONS: readonly string[] = [SERMON_COLLECTION];

export const MANUSCRIPT_FORMAT_OPTIONS: {
  value: ManuscriptFormat;
  label: string;
}[] = [
  { value: "song", label: "Song (one line per lyric)" },
  { value: "sermon", label: "Sermon (paragraph blocks)" },
];

export const MANUSCRIPT_LINE_RANGE: Record<
  ManuscriptFormat,
  { min: number; max: number }
> = {
  song: { min: 2, max: 10 },
  sermon: { min: 4, max: 16 },
};

export const clampManuscriptLines = (
  value: number,
  format: ManuscriptFormat,
): number => {
  const { min, max } = MANUSCRIPT_LINE_RANGE[format];
  return Math.min(max, Math.max(min, value));
};

export const defaultFormatForCollection = (
  collection?: string,
): ManuscriptFormat =>
  collection && PROSE_COLLECTIONS.includes(collection)
    ? "sermon"
    : DEFAULT_MANUSCRIPT_FORMAT;

export const resolveManuscriptFormat = (manuscript: {
  format?: ManuscriptFormat;
  collection?: string;
}): ManuscriptFormat =>
  manuscript.format ?? defaultFormatForCollection(manuscript.collection);
