import type { ManuscriptFormat, Slide } from "../../types";
import type { Collection } from "../../data/collections";
import { fileBaseName } from "../documents/readDocumentText";
import { uid } from "../id";
import { defaultMaxLines, parseManuscript } from "../parser";
import type { SlideTextStyle } from "../slideLayout";
import { suggestCollection } from "./category";
import { detectManuscriptFormat } from "./detectFormat";
import { clampManuscriptLines } from "./format";
import { lineKey } from "./lineShapes";
import { splitManuscriptPieces } from "./pieces";

export interface ManuscriptDraft {
  key: string;
  sourceName: string;
  title: string;
  author: string;
  collection: Collection;
  format: ManuscriptFormat;
  body: string;
  maxLines: number;
  slides: Slide[];
}

export interface DraftOptions {
  style?: SlideTextStyle | null;
}

export const titleFromFileName = (name: string): string =>
  fileBaseName(name).replace(/_+/g, " ").replace(/\s+/g, " ").trim();

export const manuscriptTextKey = (body: string): string => lineKey(body);

const fallbackTitles = (sourceName: string): (() => string) => {
  const base = titleFromFileName(sourceName);
  let used = 0;
  return () => {
    used += 1;
    return used === 1 ? base : `${base} (${used})`;
  };
};

const leadingSpaces = (line: string): number =>
  line.length - line.trimStart().length;

const tidyBody = (lines: string[], format: ManuscriptFormat): string => {
  if (format === "song") return lines.map((line) => line.trim()).join("\n");
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map(leadingSpaces),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
};

export const draftsFromText = (
  text: string,
  sourceName: string,
  options: DraftOptions = {},
): ManuscriptDraft[] => {
  const nextFallbackTitle = fallbackTitles(sourceName);
  const fittedLines = defaultMaxLines(options.style);

  return splitManuscriptPieces(text).flatMap((piece) => {
    const lines = piece.split("\n");
    const format = detectManuscriptFormat(lines);
    const maxLines = clampManuscriptLines(fittedLines, format);
    const body = tidyBody(lines, format);
    const parsed = parseManuscript(body, {
      format,
      maxLines,
      style: options.style,
    });
    if (parsed.empty) return [];

    const title = parsed.title ?? nextFallbackTitle();
    return [
      {
        key: uid(),
        sourceName,
        title,
        author: parsed.author ?? "",
        collection: suggestCollection({
          lines,
          title,
          format,
          declared: parsed.collection,
        }),
        format,
        body,
        maxLines,
        slides: parsed.slides,
      },
    ];
  });
};
