export interface TextFont {
  fontSize: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
}

export type TextMeasure = (text: string) => number;

/**
 * Mixed-case English text averages about half the font size per glyph across
 * the faces this app ships, which is close enough to predict where a line wraps
 * when the real face cannot be measured.
 */
const AVERAGE_GLYPH_WIDTH_RATIO = 0.5;

/* Canvas fonts are sized in pixels, so the slide's cqw sizes are scaled up far
   enough that subpixel rounding no longer matters, then scaled back down. */
const MEASURE_SCALE_PX = 100;

let measuringContext: CanvasRenderingContext2D | null | undefined;

const canvasContext = (): CanvasRenderingContext2D | null => {
  if (measuringContext !== undefined) return measuringContext;
  try {
    measuringContext =
      typeof document === "undefined"
        ? null
        : document.createElement("canvas").getContext("2d");
  } catch {
    measuringContext = null;
  }
  return measuringContext;
};

const canvasFont = (font: TextFont): string =>
  `${font.fontWeight ?? 400} ${font.fontSize * MEASURE_SCALE_PX}px '${font.fontFamily}', serif`;

/* A face that is still downloading would be measured as the fallback serif,
   so it is only trusted once the browser reports it ready. */
const isFontReady = (cssFont: string): boolean => {
  try {
    return document.fonts?.check(cssFont) ?? true;
  } catch {
    return true;
  }
};

const estimatedMeasure =
  (font: TextFont, spacing: number): TextMeasure =>
  (text) =>
    text.length * (font.fontSize * AVERAGE_GLYPH_WIDTH_RATIO + spacing);

/** Gives the rendered width of a string in the slide's cqw units. */
export const textMeasurer = (font: TextFont): TextMeasure => {
  const spacing = font.letterSpacing ?? 0;
  const context = font.fontFamily ? canvasContext() : null;
  if (!context) return estimatedMeasure(font, spacing);

  const cssFont = canvasFont(font);
  if (!isFontReady(cssFont)) return estimatedMeasure(font, spacing);

  const cache = new Map<string, number>();
  return (text) => {
    const cached = cache.get(text);
    if (cached !== undefined) return cached;
    context.font = cssFont;
    const shaped = font.uppercase ? text.toUpperCase() : text;
    const width =
      context.measureText(shaped).width / MEASURE_SCALE_PX +
      spacing * text.length;
    cache.set(text, width);
    return width;
  };
};

/** How many rows a line of text takes once it wraps between words. */
export const wrappedRowCount = (
  text: string,
  maxWidth: number,
  measure: TextMeasure,
): number => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;

  const spaceWidth = measure(" ");
  let rows = 1;
  let rowWidth = 0;
  for (const word of words) {
    const wordWidth = measure(word);
    const widened =
      rowWidth === 0 ? wordWidth : rowWidth + spaceWidth + wordWidth;
    if (rowWidth === 0 || widened <= maxWidth) {
      rowWidth = widened;
    } else {
      rows += 1;
      rowWidth = wordWidth;
    }
    if (rowWidth > maxWidth) {
      rows += Math.ceil(rowWidth / maxWidth) - 1;
      rowWidth %= maxWidth;
    }
  }
  return rows;
};
