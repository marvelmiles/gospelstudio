import { BIBLE_BOOKS, type BibleBook } from "../../../data/bibleBooks";
import { CHAPTER_VERSE_COUNTS } from "../../../data/bibleLayout";
import { parseReference, type ParsedReference } from "./reference";

export interface ChapterHit {
  book: BibleBook;
  chapter: number;
}

export interface ReferenceGroups {
  passage: ParsedReference | null;
  verses: number[];
  chapters: ChapterHit[];
  books: BibleBook[];
}

const NO_GROUPS: ReferenceGroups = {
  passage: null,
  verses: [],
  chapters: [],
  books: [],
};

const CHAPTER_AND_VERSES = /\s*\d+\s*(?:[:.]\s*\d*\s*(?:[-–—]\s*\d*)?)?\s*$/;

const normalize = (text: string): string =>
  text.toLowerCase().replace(/[\s.]+/g, "");

const numbersFrom = (first: number, last: number): number[] =>
  Array.from({ length: Math.max(0, last - first + 1) }, (_, i) => first + i);

export const matchBooks = (text: string): BibleBook[] => {
  const key = normalize(text);
  if (!/[a-z]/.test(key)) return [];
  const leading: BibleBook[] = [];
  const containing: BibleBook[] = [];
  for (const book of BIBLE_BOOKS) {
    const name = normalize(book.name);
    if (name.startsWith(key) || book.aliases.some((a) => a.startsWith(key)))
      leading.push(book);
    else if (name.includes(key)) containing.push(book);
  }
  return [...leading, ...containing];
};

const withFirst = (books: BibleBook[], first: BibleBook): BibleBook[] => [
  first,
  ...books.filter((book) => book.id !== first.id),
];

const passageVerses = (passage: ParsedReference): number[] => {
  const { book, chapter, verseStart, verseEnd } = passage;
  if (verseStart === undefined)
    return numbersFrom(1, CHAPTER_VERSE_COUNTS[book.id - 1][chapter - 1]);
  const range = numbersFrom(verseStart, verseEnd ?? verseStart);
  return range.length > 1 ? range : [];
};

const passageChapters = (
  passage: ParsedReference,
  books: BibleBook[],
): ChapterHit[] =>
  books
    .filter((book) => book.chapters >= passage.chapter)
    .filter(
      (book) => passage.verseStart !== undefined || book.id !== passage.book.id,
    )
    .map((book) => ({ book, chapter: passage.chapter }));

const bookChapters = (book: BibleBook): ChapterHit[] =>
  numbersFrom(1, book.chapters).map((chapter) => ({ book, chapter }));

export const referenceGroups = (query: string): ReferenceGroups => {
  const term = query.trim();
  if (!term) return NO_GROUPS;
  const parsed = parseReference(term);
  const matched = matchBooks(term.replace(CHAPTER_AND_VERSES, ""));
  const books = parsed ? withFirst(matched, parsed.book) : matched;
  const passage = parsed?.hasChapter ? parsed : null;

  if (passage)
    return {
      passage,
      verses: passageVerses(passage),
      chapters: passageChapters(passage, books),
      books,
    };
  return {
    passage: null,
    verses: [],
    chapters: books.length > 0 ? bookChapters(books[0]) : [],
    books,
  };
};

export const singleBookOf = (chapters: ChapterHit[]): BibleBook | null => {
  const [first] = chapters;
  if (!first) return null;
  return chapters.every((hit) => hit.book.id === first.book.id)
    ? first.book
    : null;
};
