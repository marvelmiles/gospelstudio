import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { BibleVersionId } from "../../types";
import { BIBLE_BOOKS, bookById } from "../../data/bibleBooks";
import type { ScriptureSelection } from "../../store/useStore";
import { Button } from "../../components/ui/Button";
import { SearchInput } from "../../components/ui/SearchInput";
import { Spinner } from "../../components/ui/Spinner";
import { useBibleSearch } from "./useBibleSearch";
import { useBibleChapter } from "./useBibleChapter";
import { PresentButton } from "./PresentButton";
import { VerseSnippet } from "./VerseSnippet";
import { tileClassName } from "./tileStyle";
import {
  formatParsedReference,
  parseReference,
  referenceSpan,
  type ParsedReference,
  type VerseSpan,
} from "./lib/reference";
import { buildScriptureSelection } from "./lib/scriptureSelection";
import type { ReadingPosition } from "./lib/readingPosition";
import { cn } from "../../lib/cn";

export const BooksStep = ({
  position,
  version,
  continueLabel,
  onOpenBook,
  onContinueReading,
  onOpenSearchResult,
}: {
  position: ReadingPosition;
  version: BibleVersionId;
  continueLabel: string | null;
  onOpenBook: (bookId: number) => void;
  onContinueReading: () => void;
  onOpenSearchResult: (
    bookId: number,
    chapter: number,
    span: VerseSpan,
  ) => void;
}) => {
  const [query, setQuery] = useState("");

  const reference = useMemo(() => {
    const parsed = parseReference(query);
    return parsed?.hasChapter ? parsed : null;
  }, [query]);

  const search = useBibleSearch(version, reference ? "" : query);

  const matchingBooks = useMemo(() => {
    if (reference) return [reference.book];
    const term = query.trim().toLowerCase();
    if (!term) return BIBLE_BOOKS;
    return BIBLE_BOOKS.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.aliases.some((a) => a.startsWith(term)),
    );
  }, [query, reference]);

  const testaments: { label: string; key: "old" | "new" }[] = [
    { label: "Old Testament", key: "old" },
    { label: "New Testament", key: "new" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search a book, reference or words, like Psalms, Job 2:3-5 or living water"
        />
        {continueLabel && (
          <Button
            variant="ghost"
            onClick={onContinueReading}
            title="Pick up where you left off"
          >
            <Play size={14} />
            Continue: {continueLabel}
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1.5 pb-3">
        {reference && (
          <PassageJump
            reference={reference}
            version={version}
            onOpen={() =>
              onOpenSearchResult(
                reference.book.id,
                reference.chapter,
                referenceSpan(reference),
              )
            }
          />
        )}
        {matchingBooks.length === 0 && !search.enabled && (
          <p className="p-7.5 text-center text-dim">
            No book matches "{query}".
          </p>
        )}
        {testaments.map(({ label, key }) => {
          const books = matchingBooks.filter((b) => b.testament === key);
          if (!books.length) return null;
          return (
            <div key={key} className="mb-5">
              <div className="mt-1.5 mb-2.5 section-label">
                {query.trim() ? `${label}: matching books` : label}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                {books.map((b) => {
                  const active = b.id === position.bookId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onOpenBook(b.id)}
                      className={cn(
                        tileClassName(active),
                        "flex flex-col gap-0.75 px-3.25 py-2.75 text-left",
                      )}
                    >
                      <span className="max-w-full truncate text-[15px]">
                        {b.name}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-medium",
                          active ? "text-accent-soft" : "text-dim",
                        )}
                      >
                        {b.chapters} chapter{b.chapters === 1 ? "" : "s"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {search.enabled && (
          <div className="mb-5">
            <div className="mt-1.5 mb-2.5 section-label">
              Verses matching "{search.term}"
              {search.total > 0
                ? ` (${search.total.toLocaleString()} found)`
                : ""}
            </div>
            {search.loading && search.results.length === 0 && (
              <div className="px-0.5 py-3.5">
                <Spinner size={20} />
              </div>
            )}
            {search.error && (
              <p className="px-0.5 py-2.5 text-[13px] text-danger">
                {search.error}
              </p>
            )}
            {!search.loading &&
              !search.error &&
              search.results.length === 0 && (
                <p className="px-0.5 py-2.5 text-[13px] text-dim">
                  No verses in {version} contain "{search.term}".
                </p>
              )}
            <div className="flex flex-col gap-1.5">
              {search.results.map((result) => {
                const resultBook = bookById(result.bookId);
                if (!resultBook) return null;
                return (
                  <ResultRow
                    key={`${result.bookId}:${result.chapter}:${result.verse}`}
                    onOpen={() =>
                      onOpenSearchResult(result.bookId, result.chapter, {
                        start: result.verse,
                        end: result.verse,
                      })
                    }
                    title={`Open ${resultBook.name} ${result.chapter}:${result.verse}`}
                    heading={`${resultBook.name} ${result.chapter}:${result.verse}`}
                    selection={() =>
                      buildScriptureSelection({
                        version,
                        bookId: result.bookId,
                        chapter: result.chapter,
                        verseStart: result.verse,
                        verses: [{ v: result.verse, t: result.text }],
                      })
                    }
                    presentTitle={`Present ${resultBook.name} ${result.chapter}:${result.verse}`}
                  >
                    <span className="text-[13.5px] leading-[1.55] text-sub">
                      <VerseSnippet text={result.text} term={search.term} />
                    </span>
                  </ResultRow>
                );
              })}
            </div>
            {search.hasMore && (
              <div className="mt-3 text-center">
                <Button
                  variant="ghost"
                  onClick={search.loadMore}
                  busy={search.loading}
                >
                  Load more ({search.results.length} of{" "}
                  {search.total.toLocaleString()})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultRow = ({
  onOpen,
  title,
  heading,
  meta,
  selection,
  presentTitle,
  presentDisabled,
  emphasis,
  children,
}: {
  onOpen: () => void;
  title: string;
  heading: string;
  meta?: ReactNode;
  selection: () => ScriptureSelection | null;
  presentTitle: string;
  presentDisabled?: boolean;
  emphasis?: boolean;
  children: ReactNode;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    }}
    title={title}
    className={cn(
      "cursor-pointer border bg-raise text-left",
      emphasis
        ? "rounded-xl border-accent-soft px-3.75 py-3.25"
        : "rounded-[10px] border-line px-3.25 py-2.5",
    )}
  >
    <div className="mb-1 flex items-center gap-2">
      <span
        className={cn(
          "font-bold text-accent-soft",
          emphasis ? "text-[15.5px]" : "text-[12.5px]",
        )}
      >
        {heading}
      </span>
      {meta}
      <span className="flex-1" />
      <PresentButton
        selection={selection}
        title={presentTitle}
        disabled={presentDisabled}
      />
      <ArrowRight size={15} className="shrink-0 text-dim" />
    </div>
    {children}
  </div>
);

const PassageJump = ({
  reference,
  version,
  onOpen,
}: {
  reference: ParsedReference;
  version: BibleVersionId;
  onOpen: () => void;
}) => {
  const { verses, loading, error } = useBibleChapter(
    version,
    reference.book.id,
    reference.chapter,
  );

  const { book, chapter, verseStart, verseEnd } = reference;
  const preview = verseStart
    ? verses.filter((v) => v.v >= verseStart && v.v <= (verseEnd ?? verseStart))
    : verses.slice(0, 1);

  return (
    <div className="mb-5">
      <div className="mt-1.5 mb-2.5 section-label">Go to passage</div>
      <ResultRow
        onOpen={onOpen}
        title={`Open ${formatParsedReference(reference)}`}
        heading={formatParsedReference(reference)}
        emphasis
        meta={
          <span className="text-[11.5px] font-semibold text-dim">
            {version}
            {!verseStart && verses.length ? ` · ${verses.length} verses` : ""}
          </span>
        }
        presentTitle={`Present ${formatParsedReference(reference)}`}
        presentDisabled={loading || Boolean(error) || !preview.length}
        selection={() => {
          const span = referenceSpan(reference);
          return buildScriptureSelection({
            version,
            bookId: book.id,
            chapter,
            verseStart: span.start,
            verseEnd: span.end,
            verses,
          });
        }}
      >
        {loading && <Spinner size={16} />}
        {error && <span className="text-[13px] text-danger">{error}</span>}
        {!loading && !error && (
          <span className="text-[13.5px] leading-[1.55] text-sub">
            {preview.map((v) => v.t).join(" ")}
          </span>
        )}
      </ResultRow>
    </div>
  );
};
