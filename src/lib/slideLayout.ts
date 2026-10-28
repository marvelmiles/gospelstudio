import type { TextStyle } from "../types";
import { textMeasurer, wrappedRowCount, type TextMeasure } from "./textMeasure";

export const SLIDE_ASPECT = 16 / 9;

const SLIDE_HEIGHT_CQW = 100 / SLIDE_ASPECT;

const SLIDE_BODY_PADDING_Y_CQW = 5;
const SLIDE_BODY_PADDING_X_CQW = 9;

const SLIDE_BREATHING_ROOM_CQW = 0.5;

export const SLIDE_BODY_PADDING = `${SLIDE_BODY_PADDING_Y_CQW}cqw ${SLIDE_BODY_PADDING_X_CQW}cqw`;

export const DEFAULT_SLIDE_FONT_SIZE = 6;
const DEFAULT_SLIDE_LINE_HEIGHT = 1.25;

const AVERAGE_GLYPH_WIDTH_RATIO = 0.5;

const TEXT_AREA_HEIGHT_CQW =
  SLIDE_HEIGHT_CQW - 2 * (SLIDE_BODY_PADDING_Y_CQW + SLIDE_BREATHING_ROOM_CQW);

const TEXT_AREA_WIDTH_CQW = 100 - 2 * SLIDE_BODY_PADDING_X_CQW;

export interface SlideTextMetrics {
  fontSize: number;
  lineHeight: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
}

export type SlideTextStyle = Pick<
  TextStyle,
  | "fontSize"
  | "lineHeight"
  | "fontFamily"
  | "fontWeight"
  | "letterSpacing"
  | "uppercase"
>;

export const DEFAULT_SLIDE_TEXT_METRICS: SlideTextMetrics = {
  fontSize: DEFAULT_SLIDE_FONT_SIZE,
  lineHeight: DEFAULT_SLIDE_LINE_HEIGHT,
};

export const slideTextMetrics = (
  style?: SlideTextStyle | null,
): SlideTextMetrics => ({
  fontSize: style?.fontSize || DEFAULT_SLIDE_FONT_SIZE,
  lineHeight: style?.lineHeight || DEFAULT_SLIDE_LINE_HEIGHT,
  fontFamily: style?.fontFamily,
  fontWeight: style?.fontWeight,
  letterSpacing: style?.letterSpacing,
  uppercase: style?.uppercase,
});

export const sameSlideTextMetrics = (
  a: SlideTextMetrics,
  b: SlideTextMetrics,
): boolean => a.fontSize === b.fontSize && a.lineHeight === b.lineHeight;

export const slideRowCapacity = (metrics: SlideTextMetrics): number =>
  Math.max(
    1,
    Math.floor(TEXT_AREA_HEIGHT_CQW / (metrics.fontSize * metrics.lineHeight)),
  );

const slideRowCharacters = (metrics: SlideTextMetrics): number =>
  Math.max(
    8,
    Math.floor(
      TEXT_AREA_WIDTH_CQW / (metrics.fontSize * AVERAGE_GLYPH_WIDTH_RATIO),
    ),
  );

export const slideRowsForText = (
  text: string,
  metrics: SlideTextMetrics,
  measure: TextMeasure = textMeasurer(metrics),
): number => wrappedRowCount(text, TEXT_AREA_WIDTH_CQW, measure);

export const slideCharacterBudget = (
  metrics: SlideTextMetrics,
  reservedRows = 0,
): number =>
  Math.max(1, slideRowCapacity(metrics) - reservedRows) *
  slideRowCharacters(metrics);

export interface SlideFitOptions {
  maxLines?: number;
  reservedRows?: number;
}

export const chunkToFit = <T>(
  items: T[],
  textOf: (item: T) => string,
  metrics: SlideTextMetrics,
  options: SlideFitOptions = {},
): T[][] => {
  const rowBudget = Math.max(
    1,
    slideRowCapacity(metrics) - (options.reservedRows ?? 0),
  );
  const lineBudget = Math.max(1, options.maxLines ?? rowBudget);
  const measure = textMeasurer(metrics);

  const chunks: T[][] = [];
  let current: T[] = [];
  let rows = 0;

  const flush = () => {
    if (!current.length) return;
    chunks.push(current);
    current = [];
    rows = 0;
  };

  for (const item of items) {
    const cost = Math.min(
      slideRowsForText(textOf(item), metrics, measure),
      rowBudget,
    );
    if (
      current.length &&
      (rows + cost > rowBudget || current.length >= lineBudget)
    )
      flush();
    current.push(item);
    rows += cost;
  }
  flush();

  return chunks.length ? chunks : [[]];
};

export const chunkLinesToFit = (
  lines: string[],
  metrics: SlideTextMetrics,
  options: SlideFitOptions = {},
): string[][] => chunkToFit(lines, (line) => line, metrics, options);

const CHUNK_SUFFIX = /\s·\s\d+\/\d+$/;

export const slideChunkBaseLabel = (label: string): string =>
  label.replace(CHUNK_SUFFIX, "");

export const slideChunkLabel = (
  base: string,
  index: number,
  total: number,
): string => (total > 1 ? `${base} · ${index + 1}/${total}` : base);
