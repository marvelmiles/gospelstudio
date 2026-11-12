import type { ReactNode } from "react";
import type { BibleVersionId } from "../../types";
import { bookById, type BibleBook } from "../../data/bibleBooks";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { BibleSearchResult } from "./lib/offlineBible";
import type { ParsedReference } from "./lib/reference";
import { singleBookOf, type ChapterHit } from "./lib/searchGroups";
import type { BibleSearch } from "./useBibleSearch";
import { stepNumberGridClassName } from "./ChaptersStep";
import { tileClassName } from "./tileStyle";

const plural = (count: number, noun: string): string =>
  `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

export const SearchGroup = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="mb-5">
    <h3 className="mt-1 mb-2.5 section-label">{title}</h3>
    {children}
  </section>
);

export const SearchNote = ({
  children,
  danger,
}: {
  children: ReactNode;
  danger?: boolean;
}) => (
  <p
    className={cn(
      "mt-0 mb-2 px-0.5 text-[13px]",
      danger ? "text-destructive" : "text-subtle-foreground",
    )}
  >
    {children}
  </p>
);

interface NumberChipsProps {
  numbers: number[];
  titleOf: (value: number) => string;
  onPick: (value: number) => void;
  activeNumber?: number;
  disabled?: boolean;
}

const NumberChips = ({
  numbers,
  titleOf,
  onPick,
  activeNumber,
  disabled,
}: NumberChipsProps) => (
  <div className={stepNumberGridClassName}>
    {numbers.map((value) => (
      <button
        key={value}
        type="button"
        title={titleOf(value)}
        disabled={disabled}
        onClick={() => onPick(value)}
        className={cn(
          tileClassName(value === activeNumber),
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {value}
      </button>
    ))}
  </div>
);

export const BookTile = ({
  book,
  isActive,
  onOpen,
}: {
  book: BibleBook;
  isActive: boolean;
  onOpen: (bookId: number) => void;
}) => (
  <button
    type="button"
    onClick={() => onOpen(book.id)}
    className={cn(
      tileClassName(isActive),
      "flex flex-col gap-0.75 px-3.25 py-2.75 text-left",
    )}
  >
    <span className="max-w-full truncate text-[15px]">{book.name}</span>
    <span
      className={cn(
        "text-[11px] font-medium",
        isActive ? "text-primary-soft" : "text-subtle-foreground",
      )}
    >
      {plural(book.chapters, "chapter")}
    </span>
  </button>
);

export const bookGridClassName =
  "grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-2";

export const BookGroup = ({
  books,
  activeBookId,
  onPick,
}: {
  books: BibleBook[];
  activeBookId?: number;
  onPick: (bookId: number) => void;
}) =>
  books.length > 0 ? (
    <SearchGroup title="Books">
      <div className={bookGridClassName}>
        {books.map((book) => (
          <BookTile
            key={book.id}
            book={book}
            isActive={book.id === activeBookId}
            onOpen={onPick}
          />
        ))}
      </div>
    </SearchGroup>
  ) : null;

export const ChapterGroup = ({
  chapters,
  onPick,
}: {
  chapters: ChapterHit[];
  onPick: (hit: ChapterHit) => void;
}) => {
  if (chapters.length === 0) return null;
  const book = singleBookOf(chapters);
  if (book)
    return (
      <SearchGroup title={`Chapters of ${book.name}`}>
        <NumberChips
          numbers={chapters.map((hit) => hit.chapter)}
          titleOf={(chapter) => `${book.name} ${chapter}`}
          onPick={(chapter) => onPick({ book, chapter })}
        />
      </SearchGroup>
    );
  return (
    <SearchGroup title="Chapters">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(120px,100%),1fr))] gap-2">
        {chapters.map((hit) => (
          <button
            key={`${hit.book.id}:${hit.chapter}`}
            type="button"
            onClick={() => onPick(hit)}
            className={cn(tileClassName(), "truncate px-3")}
          >
            {hit.book.name} {hit.chapter}
          </button>
        ))}
      </div>
    </SearchGroup>
  );
};

export const VerseNumberGroup = ({
  passage,
  verses,
  disabled,
  onPick,
}: {
  passage: ParsedReference;
  verses: number[];
  disabled?: boolean;
  onPick: (verse: number) => void;
}) => {
  if (verses.length === 0) return null;
  const chapterName = `${passage.book.name} ${passage.chapter}`;
  return (
    <SearchGroup title={`Verses in ${chapterName}`}>
      <NumberChips
        numbers={verses}
        titleOf={(verse) => `${chapterName}:${verse}`}
        disabled={disabled}
        onPick={onPick}
      />
    </SearchGroup>
  );
};

interface BookRun {
  book: BibleBook;
  results: BibleSearchResult[];
}

const runsByBook = (results: BibleSearchResult[]): BookRun[] => {
  const runs: BookRun[] = [];
  for (const result of results) {
    const last = runs[runs.length - 1];
    if (last?.book.id === result.bookId) {
      last.results.push(result);
      continue;
    }
    const book = bookById(result.bookId);
    if (book) runs.push({ book, results: [result] });
  }
  return runs;
};

export const WordMatchGroup = ({
  search,
  version,
  renderResult,
}: {
  search: BibleSearch;
  version: BibleVersionId;
  renderResult: (result: BibleSearchResult, book: BibleBook) => ReactNode;
}) => {
  if (!search.enabled) return null;
  const { term, total, results, countsByBook } = search;
  const title = `Verses with "${term}"${total > 0 ? ` (${total.toLocaleString()})` : ""}`;

  return (
    <SearchGroup title={title}>
      {search.loading && results.length === 0 && (
        <div className="px-0.5 py-3">
          <Spinner size={18} />
        </div>
      )}
      {search.error && <SearchNote danger>{search.error}</SearchNote>}
      {!search.loading && !search.error && results.length === 0 && (
        <SearchNote>
          No verses in {version} contain "{term}".
        </SearchNote>
      )}
      <div className="flex flex-col gap-3">
        {runsByBook(results).map(({ book, results: bookResults }) => (
          <div
            key={`${book.id}:${bookResults[0].chapter}:${bookResults[0].verse}`}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-baseline gap-1.5 px-0.5 text-[12.5px] font-semibold text-foreground">
              {book.name}
              <span className="text-[11.5px] font-medium text-subtle-foreground">
                {plural(countsByBook[book.id] ?? bookResults.length, "verse")}
              </span>
            </div>
            {bookResults.map((result) => renderResult(result, book))}
          </div>
        ))}
      </div>
      {search.hasMore && (
        <div className="mt-3 text-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={search.loadMore}
            busy={search.loading}
          >
            Load more ({results.length} of {total.toLocaleString()})
          </Button>
        </div>
      )}
    </SearchGroup>
  );
};
