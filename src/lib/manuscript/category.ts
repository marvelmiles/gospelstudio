import type { ManuscriptFormat } from "../../types";
import { SERMON_COLLECTION, type Collection } from "../../data/collections";
import { lineKey } from "./lineShapes";
import { readStanzaOpener } from "./numbering";
import { matchSectionHeader, sectionMetaFor } from "./sections";

const HYMN_COLLECTION: Collection = "Hymns";
const PRAISE_COLLECTION: Collection = "Praise";
const WORSHIP_COLLECTION: Collection = "Worship";
const OCCASION_COLLECTION: Collection = "Special Songs";
const CHOIR_COLLECTION: Collection = "Choir Ministration";

const HYMN_STANZA_MINIMUM = 2;
const HYMN_STANZA_LINES = 4;
const CHOIR_CUE_MINIMUM = 2;
const OCCASION_TERM_MINIMUM = 2;

const HYMNAL_CREDIT = /^(?:words|music|tune|meter|metre)\b[^:]{0,24}:/i;

const CHOIR_CUES = new Set([
  "Soloist",
  "Choir",
  "Lead",
  "Lead Vocal",
  "Response",
  "Call",
  "Congregation",
]);

const MODERN_SECTION_TYPES = new Set([
  "chorus",
  "pre-chorus",
  "post-chorus",
  "bridge",
  "tag",
  "vamp",
  "hook",
]);

const termsOf = (terms: string[]): string[] => terms.map(lineKey);

const OCCASION_TERMS = termsOf([
  "christmas",
  "bethlehem",
  "manger",
  "nativity",
  "noel",
  "shepherds",
  "wise men",
  "born this day",
  "easter",
  "resurrection",
  "he is risen",
  "wedding",
  "bride",
  "groom",
  "funeral",
  "burial",
  "harvest",
  "new year",
  "dedication",
  "birthday",
  "anniversary",
  "graduation",
  "mother's day",
  "father's day",
]);

const PRAISE_TERMS = termsOf([
  "praise",
  "praises",
  "dance",
  "clap",
  "shout",
  "celebrate",
  "rejoice",
  "jubilate",
  "jubilee",
  "joy",
  "victory",
  "thank",
  "thanks",
  "thanksgiving",
  "ope",
  "yin",
  "ijo",
  "ekele",
  "jaa",
  "yabo",
  "godiya",
]);

const WORSHIP_TERMS = termsOf([
  "worship",
  "adore",
  "adoration",
  "holy",
  "glory",
  "majesty",
  "worthy",
  "bow",
  "throne",
  "presence",
  "reverence",
  "ascribe",
  "greatness",
  "faithful",
  "faithfulness",
  "mimo",
  "ogo",
  "juba",
]);

interface NumberedStanza {
  lines: number;
  labelled: boolean;
}

const numberedStanzas = (lines: string[]): NumberedStanza[] => {
  const stanzas: NumberedStanza[] = [];
  let current: NumberedStanza | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      current = null;
      continue;
    }
    const header = matchSectionHeader(line);
    if (header) {
      const numberedVerse =
        header.num !== null && sectionMetaFor(header.base).label === "Verse";
      current = numberedVerse
        ? { lines: header.content ? 1 : 0, labelled: true }
        : null;
      if (current) stanzas.push(current);
      continue;
    }
    if (readStanzaOpener(line, false)) {
      current = { lines: 1, labelled: false };
      stanzas.push(current);
      continue;
    }
    if (current) current.lines += 1;
  }
  return stanzas;
};

const hasModernSections = (lines: string[]): boolean =>
  lines.some((line) => {
    const header = matchSectionHeader(line);
    return Boolean(
      header && MODERN_SECTION_TYPES.has(sectionMetaFor(header.base).type),
    );
  });

const looksLikeHymn = (lines: string[]): boolean => {
  if (lines.some((line) => HYMNAL_CREDIT.test(line.trim()))) return true;
  const full = numberedStanzas(lines).filter(
    (stanza) => stanza.lines >= HYMN_STANZA_LINES,
  );
  if (full.filter((stanza) => !stanza.labelled).length >= HYMN_STANZA_MINIMUM)
    return true;
  return full.length >= HYMN_STANZA_MINIMUM && !hasModernSections(lines);
};

const choirCueCount = (lines: string[]): number =>
  lines.filter((line) => {
    const header = matchSectionHeader(line);
    return Boolean(header && CHOIR_CUES.has(sectionMetaFor(header.base).label));
  }).length;

const countTerm = (text: string, term: string): number => {
  const needle = ` ${term} `;
  let count = 0;
  for (
    let index = text.indexOf(needle);
    index !== -1;
    index = text.indexOf(needle, index + 1)
  )
    count += 1;
  return count;
};

const scoreTerms = (text: string, terms: string[]): number =>
  terms.reduce((total, term) => total + countTerm(text, term), 0);

const occasionTermsIn = (text: string): number =>
  OCCASION_TERMS.filter((term) => countTerm(text, term) > 0).length;

export interface CollectionHints {
  lines: string[];
  title: string;
  format: ManuscriptFormat;
  declared: Collection | null;
}

export const suggestCollection = ({
  lines,
  title,
  format,
  declared,
}: CollectionHints): Collection => {
  if (declared) return declared;
  if (format === "sermon") return SERMON_COLLECTION;
  if (looksLikeHymn(lines)) return HYMN_COLLECTION;
  if (choirCueCount(lines) >= CHOIR_CUE_MINIMUM) return CHOIR_COLLECTION;

  const text = ` ${lineKey(lines.join(" "))} `;
  const titleText = ` ${lineKey(title)} `;
  if (
    occasionTermsIn(text) >= OCCASION_TERM_MINIMUM ||
    occasionTermsIn(titleText) > 0
  )
    return OCCASION_COLLECTION;

  return scoreTerms(text, PRAISE_TERMS) > scoreTerms(text, WORSHIP_TERMS)
    ? PRAISE_COLLECTION
    : WORSHIP_COLLECTION;
};
