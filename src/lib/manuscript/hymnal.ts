export interface HymnalSource {
  text: string;
  author: string | null;
}

export interface ReadHymnalOptions {
  syllabified?: boolean;
}

const MUSIC_DIRECTIVE = /^(?:_|[a-z ]{0,20}road\s*map)\s*:/i;

const HEADER_MUSIC_CUE = /^\d*@[A-Za-z][A-Za-z0-9.;,@-]*$/;

const CREDIT_LINE =
  /^(?:author|words|music|composer|translator|arranger|tune)\b[^:]{0,32}:\s*(.*)$/i;

const UNCREDITED = /^(?:unknown|traditional|anon(?:ymous)?)\.?$/i;

const HEADER_TYPO = /^versee\b/i;

const HYPHENATED_TOKEN = /[A-Za-z](?:-[A-Za-z\u2019'])/;

const SHORT_PART = 3;

const SYLLABLE_HYPHEN = /([A-Za-z\u2019'])-(?=[a-z\u2019'])/g;

const DASH_RUN = /-{2,}/g;

const TRAILING_HYPHEN = /-+(?=[\s,.;:!?]|$)/g;

const SINGING_UNDERSCORE = /_+/g;

const SYLLABIFIED_DENSITY = 0.05;
const SYLLABIFIED_SHORT_SHARE = 0.45;
const SYLLABIFIED_MINIMUM = 15;
const SHORT_TEXT_SHARE = 0.62;
const SHORT_TEXT_MINIMUM = 4;

interface HyphenProfile {
  total: number;
  hyphenated: number;
  parts: number;
  shortParts: number;
}

const profileHyphens = (text: string): HyphenProfile => {
  const profile: HyphenProfile = {
    total: 0,
    hyphenated: 0,
    parts: 0,
    shortParts: 0,
  };
  for (const raw of text.split(/\s+/)) {
    if (!raw) continue;
    profile.total++;
    const token = raw.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
    if (!HYPHENATED_TOKEN.test(token)) continue;
    profile.hyphenated++;
    for (const part of token.split("-")) {
      const letters = part.replace(/[^A-Za-z]/g, "");
      if (!letters) continue;
      profile.parts++;
      if (letters.length <= SHORT_PART) profile.shortParts++;
    }
  }
  return profile;
};

export const looksSyllabified = (text: string): boolean => {
  const { total, hyphenated, parts, shortParts } = profileHyphens(text);
  if (!total || !parts) return false;
  if (hyphenated / total < SYLLABIFIED_DENSITY) return false;

  const shortShare = shortParts / parts;
  if (hyphenated >= SYLLABIFIED_MINIMUM)
    return shortShare >= SYLLABIFIED_SHORT_SHARE;
  return hyphenated >= SHORT_TEXT_MINIMUM && shortShare >= SHORT_TEXT_SHARE;
};

const joinSingingHyphens = (text: string): string =>
  text
    .replace(DASH_RUN, " - ")
    .replace(SYLLABLE_HYPHEN, "$1")
    .replace(TRAILING_HYPHEN, "")
    .replace(SINGING_UNDERSCORE, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const readHymnalCredit = (line: string): string | null => {
  const match = line.trim().match(CREDIT_LINE);
  if (!match) return null;
  const value = match[1].trim();
  if (!value || UNCREDITED.test(value)) return "";
  return value;
};

const stripHeaderCue = (line: string): string => {
  const split = line.indexOf(":");
  if (split === -1) return line;
  const content = line.slice(split + 1).trim();
  if (!content || !HEADER_MUSIC_CUE.test(content)) return line;
  return line.slice(0, split + 1);
};

export const readHymnalSource = (
  text: string,
  options: ReadHymnalOptions = {},
): HymnalSource => {
  const normalized = (text || "").replace(/\r\n?/g, "\n");
  const syllabified = options.syllabified ?? looksSyllabified(normalized);
  const kept: string[] = [];
  let author: string | null = null;

  for (const raw of normalized.split("\n")) {
    const line = raw.trim();

    if (line && MUSIC_DIRECTIVE.test(line) && line.includes("@")) continue;

    const credit = readHymnalCredit(line);
    if (credit !== null) {
      if (author === null && credit) author = credit;
      continue;
    }

    const cleaned = stripHeaderCue(line).replace(HEADER_TYPO, "Verse");
    kept.push(syllabified ? joinSingingHyphens(cleaned) : cleaned);
  }

  return { text: kept.join("\n").trim(), author };
};
