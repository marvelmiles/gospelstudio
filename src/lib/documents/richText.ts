import { decodeCodePage } from "./textDecoding";

const RICH_TEXT_SIGNATURE = "{\\rtf";
const DEFAULT_CODE_PAGE = 1252;
const UNICODE_RANGE = 65536;

const RICH_TEXT_TOKEN =
  /\\([a-zA-Z]{1,32})(-?\d{1,10})? ?|\\'([0-9a-fA-F]{2})|\\([^a-zA-Z])|([{}])|[\r\n]+|([^\\{}\r\n]+)/g;

const SKIPPED_DESTINATIONS = new Set([
  "annotation",
  "atnauthor",
  "atnid",
  "bkmkend",
  "bkmkstart",
  "colortbl",
  "colorschememapping",
  "datastore",
  "filetbl",
  "fldinst",
  "fonttbl",
  "footer",
  "footerf",
  "footerl",
  "footerr",
  "footnote",
  "generator",
  "header",
  "headerf",
  "headerl",
  "headerr",
  "info",
  "latentstyles",
  "listoverridetable",
  "listtable",
  "nonshppict",
  "object",
  "pgdsctbl",
  "pict",
  "revtbl",
  "rsidtbl",
  "stylesheet",
  "themedata",
  "userprops",
  "xmlnstbl",
]);

const LINE_BREAK_WORDS = new Set([
  "par",
  "line",
  "sect",
  "page",
  "row",
  "cell",
]);

const CHARACTER_WORDS: Record<string, string> = {
  tab: "\t",
  emdash: "\u2014",
  endash: "\u2013",
  emspace: " ",
  enspace: " ",
  qmspace: " ",
  bullet: "\u2022",
  lquote: "\u2018",
  rquote: "\u2019",
  ldblquote: "\u201c",
  rdblquote: "\u201d",
};

const CONTROL_SYMBOLS: Record<string, string> = {
  "\\": "\\",
  "{": "{",
  "}": "}",
  "~": " ",
  "-": "",
  _: "-",
  "\n": "\n",
  "\r": "\n",
};

interface GroupState {
  skipped: boolean;
  unicodeFallbackLength: number;
}

export const isRichText = (bytes: Uint8Array): boolean =>
  RICH_TEXT_SIGNATURE.split("").every(
    (character, index) => bytes[index] === character.charCodeAt(0),
  );

export const richTextToPlain = (source: string): string => {
  const output: string[] = [];
  const groups: GroupState[] = [];
  let state: GroupState = { skipped: false, unicodeFallbackLength: 1 };
  let codePage = DEFAULT_CODE_PAGE;
  let pendingBytes: number[] = [];
  let fallbackToSkip = 0;

  const flushBytes = () => {
    if (!pendingBytes.length) return;
    if (!state.skipped)
      output.push(decodeCodePage(Uint8Array.from(pendingBytes), codePage));
    pendingBytes = [];
  };

  const emit = (text: string) => {
    if (!state.skipped) output.push(text);
  };

  const controlWord = (word: string, parameter: string | undefined) => {
    if (LINE_BREAK_WORDS.has(word)) return emit("\n");
    const character = CHARACTER_WORDS[word];
    if (character !== undefined) return emit(character);

    switch (word) {
      case "u": {
        const code = Number(parameter ?? 0);
        emit(String.fromCharCode(code < 0 ? code + UNICODE_RANGE : code));
        fallbackToSkip = state.unicodeFallbackLength;
        return;
      }
      case "uc":
        state.unicodeFallbackLength = Number(parameter ?? 1);
        return;
      case "ansicpg":
        codePage = Number(parameter ?? DEFAULT_CODE_PAGE);
        return;
    }
    if (SKIPPED_DESTINATIONS.has(word)) state.skipped = true;
  };

  RICH_TEXT_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RICH_TEXT_TOKEN.exec(source))) {
    const [, word, parameter, hex, symbol, brace, text] = match;

    if (hex !== undefined) {
      if (fallbackToSkip > 0) fallbackToSkip -= 1;
      else pendingBytes.push(parseInt(hex, 16));
      continue;
    }
    flushBytes();

    if (brace === "{") {
      groups.push(state);
      state = { ...state };
      fallbackToSkip = 0;
      continue;
    }
    if (brace === "}") {
      state = groups.pop() ?? state;
      fallbackToSkip = 0;
      continue;
    }
    if (word !== undefined) {
      if (word === "bin") {
        RICH_TEXT_TOKEN.lastIndex += Number(parameter ?? 0);
        continue;
      }
      controlWord(word, parameter);
      continue;
    }
    if (symbol !== undefined) {
      if (symbol === "*") state.skipped = true;
      else emit(CONTROL_SYMBOLS[symbol] ?? "");
      continue;
    }
    if (text !== undefined) {
      const skipped = Math.min(fallbackToSkip, text.length);
      fallbackToSkip -= skipped;
      emit(text.slice(skipped));
    }
  }
  flushBytes();
  return output.join("");
};
