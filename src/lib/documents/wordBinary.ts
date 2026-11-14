import type { CompoundFile } from "./compoundFile";
import { DocumentReadError } from "./documentReadError";
import { decodeCodePage } from "./textDecoding";

const WORD_IDENTIFIER = 0xa5ec;
const FIRST_WORD_97_VERSION = 0xc0;
const VERSION_OFFSET = 0x02;
const FLAGS_OFFSET = 0x0a;
const ENCRYPTED_FLAG = 0x0100;
const TABLE_STREAM_FLAG = 0x0200;
const MAIN_TEXT_LENGTH_OFFSET = 0x4c;
const CLX_OFFSET = 0x1a2;
const CLX_LENGTH_OFFSET = 0x1a6;

const PROPERTY_MODIFIER_MARKER = 0x01;
const PIECE_TABLE_MARKER = 0x02;
const CHARACTER_POSITION_SIZE = 4;
const PIECE_DESCRIPTOR_SIZE = 8;
const COMPRESSED_FLAG = 0x40000000;
const FILE_OFFSET_MASK = 0x3fffffff;

const FIELD_BEGIN = "\u0013";
const FIELD_SEPARATOR = "\u0014";
const FIELD_END = "\u0015";

const CHARACTER_REPLACEMENTS: Record<string, string> = {
  "\r": "\n",
  "\u000b": "\n",
  "\u000c": "\n",
  "\u0007": "\n",
  "\t": "\t",
  "\u001e": "-",
  "\u00a0": " ",
};

interface Piece {
  start: number;
  end: number;
  fileOffset: number;
  compressed: boolean;
}

const unreadable = (): DocumentReadError => new DocumentReadError("unreadable");

const viewOf = (bytes: Uint8Array): DataView =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

const readPieces = (
  table: Uint8Array,
  clxOffset: number,
  clxLength: number,
): Piece[] => {
  const view = viewOf(table);
  const clxEnd = Math.min(table.length, clxOffset + clxLength);
  let offset = clxOffset;
  while (offset < clxEnd && table[offset] === PROPERTY_MODIFIER_MARKER)
    offset += 3 + view.getUint16(offset + 1, true);

  if (offset + 5 > clxEnd || table[offset] !== PIECE_TABLE_MARKER)
    throw unreadable();
  const length = view.getUint32(offset + 1, true);
  const start = offset + 5;
  const count =
    (length - CHARACTER_POSITION_SIZE) /
    (CHARACTER_POSITION_SIZE + PIECE_DESCRIPTOR_SIZE);
  if (!Number.isInteger(count) || count < 1 || start + length > table.length)
    throw unreadable();

  const descriptors = start + (count + 1) * CHARACTER_POSITION_SIZE;
  return Array.from({ length: count }, (_, index) => {
    const raw = view.getUint32(
      descriptors + index * PIECE_DESCRIPTOR_SIZE + 2,
      true,
    );
    return {
      start: view.getUint32(start + index * CHARACTER_POSITION_SIZE, true),
      end: view.getUint32(start + (index + 1) * CHARACTER_POSITION_SIZE, true),
      fileOffset: raw & FILE_OFFSET_MASK,
      compressed: (raw & COMPRESSED_FLAG) !== 0,
    };
  });
};

const readPieceText = (
  document: Uint8Array,
  piece: Piece,
  from: number,
  to: number,
): string => {
  const characters = to - from;
  if (piece.compressed) {
    const offset = Math.floor(piece.fileOffset / 2) + (from - piece.start);
    return decodeCodePage(document.subarray(offset, offset + characters));
  }
  const offset = piece.fileOffset + (from - piece.start) * 2;
  return new TextDecoder("utf-16le").decode(
    document.subarray(offset, offset + characters * 2),
  );
};

const cleanWordText = (raw: string): string => {
  const fieldShowsResult: boolean[] = [];
  const output: string[] = [];
  for (const character of raw) {
    if (character === FIELD_BEGIN) {
      fieldShowsResult.push(false);
      continue;
    }
    if (character === FIELD_SEPARATOR) {
      if (fieldShowsResult.length)
        fieldShowsResult[fieldShowsResult.length - 1] = true;
      continue;
    }
    if (character === FIELD_END) {
      fieldShowsResult.pop();
      continue;
    }
    if (fieldShowsResult.includes(false)) continue;
    const replacement = CHARACTER_REPLACEMENTS[character];
    if (replacement !== undefined) output.push(replacement);
    else if (character >= " ") output.push(character);
  }
  return output.join("");
};

export const readWordBinaryText = (file: CompoundFile): string => {
  const document = file.readStream("WordDocument");
  if (!document || document.length < CLX_LENGTH_OFFSET + 4) throw unreadable();
  const view = viewOf(document);
  if (view.getUint16(0, true) !== WORD_IDENTIFIER) throw unreadable();
  if (view.getUint16(VERSION_OFFSET, true) < FIRST_WORD_97_VERSION)
    throw new DocumentReadError("outdated");

  const flags = view.getUint16(FLAGS_OFFSET, true);
  if (flags & ENCRYPTED_FLAG) throw new DocumentReadError("protected");
  const table = file.readStream(
    flags & TABLE_STREAM_FLAG ? "1Table" : "0Table",
  );
  if (!table) throw unreadable();

  const textLength = view.getUint32(MAIN_TEXT_LENGTH_OFFSET, true);
  const pieces = readPieces(
    table,
    view.getUint32(CLX_OFFSET, true),
    view.getUint32(CLX_LENGTH_OFFSET, true),
  );

  const text = pieces.flatMap((piece) => {
    const from = Math.max(0, piece.start);
    const to = Math.min(piece.end, textLength);
    return to > from ? [readPieceText(document, piece, from, to)] : [];
  });
  return cleanWordText(text.join(""));
};
