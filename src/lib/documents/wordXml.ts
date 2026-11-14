import { strFromU8, unzipSync } from "fflate";
import { DocumentReadError } from "./documentReadError";

const DOCUMENT_PART = "word/document.xml";
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04] as const;

const XML_TOKEN =
  /<(\/?)(?:[\w.-]+:)?([\w.-]+)[^>]*?(\/?)>|<!\[CDATA\[([\s\S]*?)\]\]>|<[?!][^>]*>|([^<]+)/g;

const XML_ENTITY = /&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi;
const MAX_CODE_POINT = 0x10ffff;

const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  quot: '"',
  apos: "'",
};

const SKIPPED_CONTAINERS = new Set(["Fallback", "moveFrom"]);

export const isZipArchive = (bytes: Uint8Array): boolean =>
  ZIP_SIGNATURE.every((value, index) => bytes[index] === value);

const decodeXmlEntities = (text: string): string =>
  text.replace(XML_ENTITY, (match, entity: string) => {
    if (!entity.startsWith("#"))
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    const hexadecimal = entity[1].toLowerCase() === "x";
    const code = parseInt(
      entity.slice(hexadecimal ? 2 : 1),
      hexadecimal ? 16 : 10,
    );
    return Number.isFinite(code) && code <= MAX_CODE_POINT
      ? String.fromCodePoint(code)
      : match;
  });

const depthChange = (closing: boolean, selfClosing: boolean): number => {
  if (selfClosing) return 0;
  return closing ? -1 : 1;
};

const wordXmlText = (xml: string): string => {
  const output: string[] = [];
  let insideText = false;
  let skippedDepth = 0;
  let tabStopDepth = 0;

  for (const [, closeMark, name, selfCloseMark, cdata, text] of xml.matchAll(
    XML_TOKEN,
  )) {
    if (text !== undefined || cdata !== undefined) {
      if (insideText && skippedDepth === 0)
        output.push(cdata ?? decodeXmlEntities(text ?? ""));
      continue;
    }
    if (!name) continue;

    const closing = closeMark === "/";
    const selfClosing = selfCloseMark === "/";

    if (SKIPPED_CONTAINERS.has(name)) {
      skippedDepth += depthChange(closing, selfClosing);
      continue;
    }
    if (skippedDepth > 0) continue;

    switch (name) {
      case "tabs":
        tabStopDepth += depthChange(closing, selfClosing);
        break;
      case "t":
        insideText = !closing && !selfClosing;
        break;
      case "p":
        if (closing || selfClosing) output.push("\n");
        break;
      case "br":
      case "cr":
        if (!closing) output.push("\n");
        break;
      case "tab":
        if (!closing && tabStopDepth === 0) output.push("\t");
        break;
      case "noBreakHyphen":
        output.push("-");
        break;
    }
  }
  return output.join("");
};

export const readWordXmlText = (bytes: Uint8Array): string => {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (file) => file.name === DOCUMENT_PART });
  } catch {
    throw new DocumentReadError("unreadable");
  }
  const part = files[DOCUMENT_PART];
  if (!part) throw new DocumentReadError("unsupported");
  return wordXmlText(strFromU8(part));
};
