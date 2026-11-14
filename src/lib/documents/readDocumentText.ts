import { isCompoundFile, openCompoundFile } from "./compoundFile";
import { DocumentReadError } from "./documentReadError";
import { isRichText, richTextToPlain } from "./richText";
import {
  decodeCodePage,
  decodeTextBytes,
  looksLikeBinary,
} from "./textDecoding";
import { readWordBinaryText } from "./wordBinary";
import { isZipArchive, readWordXmlText } from "./wordXml";

const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ".txt",
  ".text",
  ".md",
  ".markdown",
  ".rtf",
  ".doc",
  ".docx",
] as const;

export const DOCUMENT_FILE_ACCEPT = SUPPORTED_DOCUMENT_EXTENSIONS.join(",");

const WORD_EXTENSIONS: readonly string[] = [".doc", ".docx"];
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

const INVISIBLE_CHARACTERS = new RegExp(
  "[\\u00ad\\u200b-\\u200d\\u2060\\ufeff]",
  "g",
);
const WIDE_SPACES = new RegExp(
  "[\\t\\f\\v\\u00a0\\u2000-\\u200a\\u202f\\u205f\\u3000]",
  "g",
);
const LINE_SEPARATORS = new RegExp("\\r\\n?|[\\u2028\\u2029]", "g");

const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
};

export const fileBaseName = (name: string): string => {
  const leaf = name.split(/[\\/]/).pop() ?? name;
  const dot = leaf.lastIndexOf(".");
  return dot > 0 ? leaf.slice(0, dot) : leaf;
};

export const isSupportedDocument = (name: string): boolean =>
  (SUPPORTED_DOCUMENT_EXTENSIONS as readonly string[]).includes(
    fileExtension(name),
  );

const normalizeDocumentText = (text: string): string =>
  text
    .replace(LINE_SEPARATORS, "\n")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(WIDE_SPACES, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/^\n+|\n+$/g, "");

const readCompoundDocument = (bytes: Uint8Array): string => {
  const file = openCompoundFile(bytes);
  if (file.readStream("EncryptedPackage"))
    throw new DocumentReadError("protected");
  return readWordBinaryText(file);
};

const extractText = (bytes: Uint8Array, extension: string): string => {
  if (isCompoundFile(bytes)) return readCompoundDocument(bytes);
  if (isZipArchive(bytes)) return readWordXmlText(bytes);
  if (isRichText(bytes)) return richTextToPlain(decodeCodePage(bytes));
  if (WORD_EXTENSIONS.includes(extension) || looksLikeBinary(bytes))
    throw new DocumentReadError("unreadable");
  return decodeTextBytes(bytes);
};

export const documentTextFromBytes = (
  bytes: Uint8Array,
  fileName: string,
): string => {
  if (!isSupportedDocument(fileName))
    throw new DocumentReadError("unsupported");
  const text = normalizeDocumentText(
    extractText(bytes, fileExtension(fileName)),
  );
  if (!text.trim()) throw new DocumentReadError("empty");
  return text;
};

export const readDocumentText = async (file: File): Promise<string> => {
  if (!isSupportedDocument(file.name))
    throw new DocumentReadError("unsupported");
  if (file.size > MAX_DOCUMENT_BYTES) throw new DocumentReadError("too-large");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return documentTextFromBytes(bytes, file.name);
  } catch (error) {
    if (error instanceof DocumentReadError) throw error;
    throw new DocumentReadError("unreadable");
  }
};
