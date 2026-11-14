import { describe, expect, test } from "vitest";
import { strToU8, zipSync } from "fflate";
import { documentTextFromBytes, fileBaseName } from "./readDocumentText";
import { DocumentReadError, documentReadFailureOf } from "./documentReadError";

const SECTOR = 512;
const MINI_STREAM_CUTOFF = 4096;
const END_OF_CHAIN = 0xfffffffe;
const FREE_SECTOR = 0xffffffff;
const FAT_SECTOR = 0xfffffffd;
const NO_STREAM = 0xffffffff;
const TEXT_OFFSET = 1024;

const buildCompoundFile = (streams: Record<string, Uint8Array>): Uint8Array => {
  const entries = Object.entries(streams).map(([name, data]) => {
    const size = Math.max(data.length, MINI_STREAM_CUTOFF);
    const buffer = new Uint8Array(Math.ceil(size / SECTOR) * SECTOR);
    buffer.set(data);
    return { name, buffer, size };
  });
  const totalSectors =
    2 +
    entries.reduce((total, entry) => total + entry.buffer.length / SECTOR, 0);
  const file = new Uint8Array((totalSectors + 1) * SECTOR);
  const view = new DataView(file.buffer);

  file.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  view.setUint16(0x18, 0x3e, true);
  view.setUint16(0x1a, 3, true);
  view.setUint16(0x1c, 0xfffe, true);
  view.setUint16(0x1e, 9, true);
  view.setUint16(0x20, 6, true);
  view.setUint32(0x2c, 1, true);
  view.setUint32(0x30, 1, true);
  view.setUint32(0x38, MINI_STREAM_CUTOFF, true);
  view.setUint32(0x3c, END_OF_CHAIN, true);
  view.setUint32(0x44, END_OF_CHAIN, true);
  for (let index = 0; index < 109; index += 1)
    view.setUint32(0x4c + index * 4, index === 0 ? 0 : FREE_SECTOR, true);

  const fat = new Array<number>(SECTOR / 4).fill(FREE_SECTOR);
  fat[0] = FAT_SECTOR;
  fat[1] = END_OF_CHAIN;

  const directory = 2 * SECTOR;
  const writeEntry = (
    index: number,
    name: string,
    type: number,
    start: number,
    size: number,
  ) => {
    const offset = directory + index * 128;
    Array.from(name).forEach((character, position) =>
      view.setUint16(offset + position * 2, character.charCodeAt(0), true),
    );
    view.setUint16(offset + 0x40, (name.length + 1) * 2, true);
    file[offset + 0x42] = type;
    file[offset + 0x43] = 1;
    view.setUint32(offset + 0x44, NO_STREAM, true);
    view.setUint32(
      offset + 0x48,
      index > 0 && index < entries.length ? index + 1 : NO_STREAM,
      true,
    );
    view.setUint32(offset + 0x4c, index === 0 ? 1 : NO_STREAM, true);
    view.setUint32(offset + 0x74, start, true);
    view.setUint32(offset + 0x78, size, true);
  };

  writeEntry(0, "Root Entry", 5, END_OF_CHAIN, 0);
  let sector = 2;
  entries.forEach((entry, index) => {
    const count = entry.buffer.length / SECTOR;
    file.set(entry.buffer, (sector + 1) * SECTOR);
    for (let step = 0; step < count; step += 1)
      fat[sector + step] =
        step === count - 1 ? END_OF_CHAIN : sector + step + 1;
    writeEntry(index + 1, entry.name, 2, sector, entry.size);
    sector += count;
  });

  fat.forEach((value, index) =>
    view.setUint32(SECTOR + index * 4, value, true),
  );
  return file;
};

interface WordPiece {
  text: string;
  unicode?: boolean;
}

interface WordFileOptions {
  mainLength?: number;
  encrypted?: boolean;
  version?: number;
}

const encodePiece = ({ text, unicode }: WordPiece): Uint8Array =>
  unicode
    ? new Uint8Array(
        Uint16Array.from(text, (character) => character.charCodeAt(0)).buffer,
      )
    : Uint8Array.from(text, (character) =>
        character === "\u2019" ? 0x92 : character.charCodeAt(0),
      );

const buildWordFile = (
  pieces: WordPiece[],
  options: WordFileOptions = {},
): Uint8Array => {
  let fileOffset = TEXT_OFFSET;
  let characterPosition = 0;
  const placed = pieces.map((piece) => {
    const bytes = encodePiece(piece);
    const entry = {
      bytes,
      offset: fileOffset,
      compressed: !piece.unicode,
      start: characterPosition,
    };
    fileOffset += bytes.length;
    characterPosition += piece.text.length;
    return entry;
  });

  const document = new Uint8Array(fileOffset);
  const documentView = new DataView(document.buffer);
  documentView.setUint16(0, 0xa5ec, true);
  documentView.setUint16(2, options.version ?? 0xc1, true);
  documentView.setUint16(0x0a, 0x0200 | (options.encrypted ? 0x0100 : 0), true);
  documentView.setUint32(0x4c, options.mainLength ?? characterPosition, true);
  placed.forEach((piece) => document.set(piece.bytes, piece.offset));

  const count = placed.length;
  const pieceTableLength = (count + 1) * 4 + count * 8;
  const table = new Uint8Array(5 + pieceTableLength);
  const tableView = new DataView(table.buffer);
  table[0] = 0x02;
  tableView.setUint32(1, pieceTableLength, true);
  placed.forEach((piece, index) =>
    tableView.setUint32(5 + index * 4, piece.start, true),
  );
  tableView.setUint32(5 + count * 4, characterPosition, true);
  placed.forEach((piece, index) =>
    tableView.setUint32(
      5 + (count + 1) * 4 + index * 8 + 2,
      piece.compressed ? (piece.offset * 2) | 0x40000000 : piece.offset,
      true,
    ),
  );
  documentView.setUint32(0x1a2, 0, true);
  documentView.setUint32(0x1a6, table.length, true);

  return buildCompoundFile({ WordDocument: document, "1Table": table });
};

const buildWordXmlFile = (body: string): Uint8Array =>
  zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "word/document.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="w" xmlns:mc="mc"><w:body>${body}</w:body></w:document>`,
    ),
  });

const failureOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    return documentReadFailureOf(error);
  }
  return "none";
};

describe("plain text", () => {
  test("reads UTF-8 with or without a byte order mark", () => {
    const text = "Amazing grace\nHow sweet the sound";
    expect(documentTextFromBytes(strToU8(text), "song.txt")).toBe(text);
    expect(
      documentTextFromBytes(
        Uint8Array.from([0xef, 0xbb, 0xbf, ...strToU8(text)]),
        "song.txt",
      ),
    ).toBe(text);
  });

  test("reads UTF-16 saved by Notepad", () => {
    const text = "A f\u2019ope f\u2019olorun";
    const bytes = Uint8Array.from([
      0xff,
      0xfe,
      ...new Uint8Array(
        Uint16Array.from(text, (character) => character.charCodeAt(0)).buffer,
      ),
    ]);
    expect(documentTextFromBytes(bytes, "song.txt")).toBe(text);
  });

  test("falls back to Windows-1252 for old files", () => {
    const bytes = Uint8Array.from([
      0x48, 0x65, 0x92, 0x73, 0x20, 0x93, 0x4f, 0x94,
    ]);
    expect(documentTextFromBytes(bytes, "song.txt")).toBe(
      "He\u2019s \u201cO\u201d",
    );
  });

  test("normalizes line endings, tabs and invisible characters", () => {
    const text = "\r\n1.\tLine one  \r\nLine\u00a0two\u200b\r\n\r\n";
    expect(documentTextFromBytes(strToU8(text), "song.md")).toBe(
      "1. Line one\nLine two",
    );
  });
});

describe("Word 97-2003 documents", () => {
  test("reads the main text and leaves headers, footers and field codes out", () => {
    const main =
      "A king is born\rHe\u2019s in the manger\u000bnow\r\u0013 PAGE \u00141\u0015\r";
    const bytes = buildWordFile([{ text: main }, { text: "Footer text\r" }], {
      mainLength: main.length,
    });
    expect(documentTextFromBytes(bytes, "carol.doc")).toBe(
      "A king is born\nHe\u2019s in the manger\nnow\n1",
    );
  });

  test("joins compressed and Unicode pieces in order", () => {
    const bytes = buildWordFile([
      { text: "Ese o Jesu\r" },
      { text: "\u1ecc\u0300r\u1ecd\u0300 Olorun\r", unicode: true },
    ]);
    expect(documentTextFromBytes(bytes, "orin.doc")).toBe(
      "Ese o Jesu\n\u1ecc\u0300r\u1ecd\u0300 Olorun",
    );
  });

  test("reports password protected and pre-97 files", () => {
    expect(
      failureOf(() =>
        documentTextFromBytes(
          buildWordFile([{ text: "Hidden\r" }], { encrypted: true }),
          "locked.doc",
        ),
      ),
    ).toBe("protected");
    expect(
      failureOf(() =>
        documentTextFromBytes(
          buildWordFile([{ text: "Old\r" }], { version: 0x65 }),
          "old.doc",
        ),
      ),
    ).toBe("outdated");
    expect(
      failureOf(() =>
        documentTextFromBytes(
          buildCompoundFile({ EncryptedPackage: strToU8("secret") }),
          "locked.docx",
        ),
      ),
    ).toBe("protected");
  });
});

describe("Word documents", () => {
  test("reads paragraphs, line breaks and tabs", () => {
    const bytes = buildWordXmlFile(
      [
        '<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr><w:r><w:t>1.</w:t></w:r><w:r><w:tab/><w:t xml:space="preserve">Now thank we </w:t></w:r><w:r><w:t>all our God,</w:t><w:br/><w:t>with heart &amp; hands</w:t></w:r></w:p>',
        "<w:p/>",
        "<w:p><w:r><w:delText>removed</w:delText><w:instrText>PAGE</w:instrText><w:t>who wondrous things</w:t></w:r></w:p>",
        "<w:p><mc:AlternateContent><mc:Choice><w:r><w:t>Box</w:t></w:r></mc:Choice><mc:Fallback><w:r><w:t>Box</w:t></w:r></mc:Fallback></mc:AlternateContent></w:p>",
      ].join(""),
    );
    expect(documentTextFromBytes(bytes, "hymn.docx")).toBe(
      "1. Now thank we all our God,\nwith heart & hands\n\nwho wondrous things\nBox",
    );
  });
});

describe("rich text", () => {
  test("reads paragraphs and characters and skips tables of fonts and headers", () => {
    const rtf = [
      "{\\rtf1\\ansi\\ansicpg1252{\\fonttbl{\\f0 Arial;}}",
      "{\\header Page header\\par}{\\*\\generator Writer;}",
      "\\uc1 He\\'92s here\\par Gb\\u8217?ope\\line ",
      "{\\field{\\*\\fldinst PAGE}{\\fldrslt 7}}\\par}",
    ].join("");
    expect(documentTextFromBytes(strToU8(rtf), "song.rtf")).toBe(
      "He\u2019s here\nGb\u2019ope\n7",
    );
  });
});

describe("unsupported and empty files", () => {
  test("refuses other file types and files without text", () => {
    expect(
      failureOf(() => documentTextFromBytes(strToU8("x"), "slides.pdf")),
    ).toBe("unsupported");
    expect(
      failureOf(() => documentTextFromBytes(strToU8(" \n\n"), "blank.txt")),
    ).toBe("empty");
    expect(
      failureOf(() =>
        documentTextFromBytes(strToU8("<html></html>"), "page.doc"),
      ),
    ).toBe("unreadable");
  });

  test("the error keeps its reason", () => {
    expect(new DocumentReadError("too-large").failure).toBe("too-large");
    expect(documentReadFailureOf(new Error("boom"))).toBe("unreadable");
  });

  test("file names lose their folder and extension", () => {
    expect(fileBaseName("Songs/Christmas/A king is born.doc")).toBe(
      "A king is born",
    );
    expect(fileBaseName("README")).toBe("README");
  });
});
