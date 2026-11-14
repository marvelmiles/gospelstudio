import { detectManuscriptFormat } from "./detectFormat";
import {
  hasLowercase,
  isAllCapsLine,
  isTitleCandidate,
  lineKey,
  looksLikeShoutedTitle,
  opensFirstStanza,
} from "./lineShapes";
import { isDeclaredHeading } from "./metadata";
import { readStanzaOpener } from "./numbering";
import { matchSectionHeader } from "./sections";
import { isLabeledPreambleLine } from "./sermon";

const PIECE_SEPARATOR = /^(?:([=*#~_-])\s*(?:\1\s*){4,}|\*\s+\*\s+\*)$/;
const STANZA_RULE = /^([-*_])\s*(?:\1\s*){2,}$/;

interface Block {
  start: number;
  lines: string[];
  afterSeparator: boolean;
}

interface FirstStanza {
  at: number;
  key: string;
}

interface SplitContext {
  lines: string[];
  blocks: Block[];
  lyricsHaveLowercase: boolean;
  lineCounts: Map<string, number>;
}

const countLines = (lines: string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const line of lines) {
    if (!line.trim()) continue;
    const key = lineKey(line);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

const isShoutedHeading = (context: SplitContext, block: Block): boolean => {
  const heading = block.lines[0];
  if (!isAllCapsLine(heading)) return false;
  return looksLikeShoutedTitle(heading, {
    lyricsHaveLowercase: context.lyricsHaveLowercase,
    repeatedAsLyric: (context.lineCounts.get(lineKey(heading)) ?? 0) > 1,
    standsAlone: block.lines.length === 1,
  });
};

const toBlocks = (lines: string[]): Block[] => {
  const blocks: Block[] = [];
  let current: Block | null = null;
  let separated = false;

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (PIECE_SEPARATOR.test(line)) {
      current = null;
      separated = true;
      return;
    }
    if (!line || STANZA_RULE.test(line)) {
      current = null;
      return;
    }
    if (!current) {
      current = { start: index, lines: [], afterSeparator: separated };
      blocks.push(current);
      separated = false;
    }
    current.lines.push(line);
  });

  return blocks;
};

const stanzaLyric = (block: Block, at: number): string =>
  readStanzaOpener(block.lines[at], false)?.text ||
  matchSectionHeader(block.lines[at])?.content ||
  block.lines[at + 1] ||
  "";

const firstStanzaIn = (block: Block): FirstStanza | null => {
  const at = block.lines.slice(0, 2).findIndex(opensFirstStanza);
  if (at === -1) return null;
  if (at === 1 && !isTitleCandidate(block.lines[0])) return null;
  return { at, key: lineKey(stanzaLyric(block, at)) };
};

const songBoundary = (
  context: SplitContext,
  index: number,
  pieceStart: number,
  firstStanzas: Set<string>,
): number | null => {
  const block = context.blocks[index];
  const first = firstStanzaIn(block);
  if (first) {
    if (first.at === 1) return index;
    const previous = context.blocks[index - 1];
    if (
      index - 1 > pieceStart &&
      previous.lines.length === 1 &&
      isTitleCandidate(previous.lines[0])
    )
      return index - 1;
    return firstStanzas.size > 0 && !firstStanzas.has(first.key) ? index : null;
  }
  return isShoutedHeading(context, block) ? index : null;
};

const sermonBoundary = (
  context: SplitContext,
  index: number,
): number | null => {
  const block = context.blocks[index];
  const next = block.lines[1] ?? context.blocks[index + 1]?.lines[0];
  return isTitleCandidate(block.lines[0]) &&
    next !== undefined &&
    isLabeledPreambleLine(next)
    ? index
    : null;
};

const trimPiece = (lines: string[]): string[] => {
  const keeps = (line: string) =>
    line.trim() !== "" && !PIECE_SEPARATOR.test(line.trim());
  const first = lines.findIndex(keeps);
  if (first === -1) return [];
  const last = lines.length - 1 - [...lines].reverse().findIndex(keeps);
  return lines.slice(first, last + 1);
};

export const splitManuscriptPieces = (text: string): string[] => {
  const lines = text.split("\n");
  const context: SplitContext = {
    lines,
    blocks: toBlocks(lines),
    lyricsHaveLowercase: lines.some(hasLowercase),
    lineCounts: countLines(lines),
  };
  const { blocks } = context;
  const songRules = detectManuscriptFormat(lines) === "song";

  const starts = [0];
  let firstStanzas = new Set<string>();

  blocks.forEach((block, index) => {
    const pieceStart = starts[starts.length - 1];
    if (index > pieceStart) {
      const start =
        isDeclaredHeading(block.lines[0]) || block.afterSeparator
          ? index
          : songRules
            ? songBoundary(context, index, pieceStart, firstStanzas)
            : sermonBoundary(context, index);
      if (start !== null) {
        starts.push(start);
        firstStanzas = new Set();
      }
    }
    const first = songRules ? firstStanzaIn(block) : null;
    if (first) firstStanzas.add(first.key);
  });

  return starts
    .map((start, position) => {
      const end = blocks[starts[position + 1]]?.start ?? lines.length;
      return trimPiece(lines.slice(blocks[start]?.start ?? 0, end)).join("\n");
    })
    .filter((piece) => piece.trim() !== "");
};
