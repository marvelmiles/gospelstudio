import type { BibleVerse, ScripturePassage, Slide } from "../../../types";
import { stripInlineFormatting } from "../../../lib/inlineFormat";
import { verseStartsBySlide } from "./scriptureSlides";

const LEADING_VERSE_NUMBER = /^(\d+)\.? /;

type SpokenPassage = Pick<
  ScripturePassage,
  | "slides"
  | "verses"
  | "versesPerSlide"
  | "showVerseNumbers"
  | "raisedVerseNumbers"
  | "showReference"
  | "style"
  | "quick"
>;

const announced = (verse: number, text: string, sayNumber: boolean): string =>
  sayNumber ? `Verse ${verse}. ${text}` : text;

export const spokenVerse = (verse: BibleVerse, sayNumber: boolean): string =>
  announced(verse.v, verse.t, sayNumber);

const readableLines = (slide: Slide, showReference: boolean): string[] => {
  const lines =
    showReference && slide.lines.length > 1
      ? slide.lines.slice(0, -1)
      : slide.lines;
  return lines.map(stripInlineFormatting);
};

const withWrittenNumbers = (lines: string[], sayNumber: boolean): string[] =>
  lines.map((line) => {
    const match = LEADING_VERSE_NUMBER.exec(line);
    return match
      ? announced(Number(match[1]), line.slice(match[0].length), sayNumber)
      : line;
  });

const withPlacedNumbers = (lines: string[], starts: number[]): string[] => {
  if (!starts.length || !lines.length) return lines;
  if (starts.length === lines.length)
    return lines.map((line, index) => announced(starts[index], line, true));
  const [first, ...rest] = lines;
  return [announced(starts[0], first, true), ...rest];
};

export const spokenPassageSlides = (
  passage: SpokenPassage,
  sayNumber: boolean,
): string[] => {
  const starts =
    sayNumber && !passage.showVerseNumbers ? verseStartsBySlide(passage) : [];
  const canPlace = starts.length === passage.slides.length;

  return passage.slides.map((slide, index) => {
    const lines = readableLines(slide, passage.showReference);
    if (passage.showVerseNumbers)
      return withWrittenNumbers(lines, sayNumber).join("\n");
    return (canPlace ? withPlacedNumbers(lines, starts[index]) : lines).join(
      "\n",
    );
  });
};
