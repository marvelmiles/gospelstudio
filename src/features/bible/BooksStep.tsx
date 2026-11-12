import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Play } from "lucide-react";
import type { BibleVersionId } from "../../types";
import { BIBLE_BOOKS } from "../../data/bibleBooks";
import type { ScriptureSelection } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import { Spinner } from "@/components/ui/spinner";
import { useBibleSearch } from "./useBibleSearch";
import { useBibleChapter } from "./useBibleChapter";
import { PresentButton } from "./PresentButton";
import { VerseSnippet } from "./VerseSnippet";
import { stepScrollClassName } from "./ChaptersStep";
import {
  BookGroup,
  BookTile,
  ChapterGroup,
  SearchGroup,
  VerseNumberGroup,
  WordMatchGroup,
  bookGridClassName,
} from "./SearchGroups";
import {
  formatParsedReference,
  referenceSpan,
  type ParsedReference,
  type VerseSpan,
} from "./lib/reference";
import { referenceGroups } from "./lib/searchGroups";
import { buildScriptureSelection } from "./lib/scriptureSelection";
import type { ReadingPosition } from "./lib/readingPosition";
import { cn } from "../../lib/utils";

const TESTAMENTS: { label: string; key: "old" | "new" }[] = [
  { label: "Old Testament", key: "old" },
  { label: "New Testament", key: "new" },
];

export const BooksStep = ({
  position,
  version,
  continueLabel,
  onOpenBook,
  onOpenChapter,
  onContinueReading,
  onOpenSearchResult,
}: {
  position: ReadingPosition;
  version: BibleVersionId;
  continueLabel: string | null;
  onOpenBook: (bookId: number) => void;
  onOpenChapter: (bookId: number, chapter: number) => void;
  onContinueReading: () => void;
  onOpenSearchResult: (
    bookId: number,
    chapter: number,
    span: VerseSpan,
  ) => void;
}) => {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => referenceGroups(query), [query]);
  const search = useBibleSearch(version, groups.passage ? "" : query);
  const { passage } = groups;
  const isSearching = query.trim().length > 0;
  const nothingFound =
    isSearching && !passage && groups.books.length === 0 && !search.enabled;

  return (
    <div className="flex flex-col roomy:min-h-0 roomy:flex-1">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search a book, reference or words, like Psalms, Job 2:3-5 or living water"
        />
        {continueLabel && (
          <Button
            variant="secondary"
            onClick={onContinueReading}
            title="Pick up where you left off"
          >
            <Play size={14} />
            Continue: {continueLabel}
          </Button>
        )}
      </div>
      <div className={stepScrollClassName}>
        {!isSearching && (
          <AllBooks activeBookId={position.bookId} onOpenBook={onOpenBook} />
        )}
        {passage && (
          <>
            <PassageJump
              reference={passage}
              version={version}
              onOpen={() =>
                onOpenSearchResult(
                  passage.book.id,
                  passage.chapter,
                  referenceSpan(passage),
                )
              }
            />
            <VerseNumberGroup
              passage={passage}
              verses={groups.verses}
              onPick={(verse) =>
                onOpenSearchResult(passage.book.id, passage.chapter, {
                  start: verse,
                  end: verse,
                })
              }
            />
          </>
        )}
        {isSearching && (
          <>
            <BookGroup
              books={groups.books}
              activeBookId={position.bookId}
              onPick={onOpenBook}
            />
            <ChapterGroup
              chapters={groups.chapters}
              onPick={({ book, chapter }) => onOpenChapter(book.id, chapter)}
            />
          </>
        )}
        <WordMatchGroup
          search={search}
          version={version}
          renderResult={(result, book) => {
            const heading = `${book.name} ${result.chapter}:${result.verse}`;
            return (
              <ResultRow
                key={heading}
                onOpen={() =>
                  onOpenSearchResult(result.bookId, result.chapter, {
                    start: result.verse,
                    end: result.verse,
                  })
                }
                title={`Open ${heading}`}
                heading={heading}
                selection={() =>
                  buildScriptureSelection({
                    version,
                    bookId: result.bookId,
                    chapter: result.chapter,
                    verseStart: result.verse,
                    verses: [{ v: result.verse, t: result.text }],
                  })
                }
                presentTitle={`Present ${heading}`}
              >
                <span className="text-[13.5px] leading-[1.55] text-muted-foreground">
                  <VerseSnippet text={result.text} term={search.term} />
                </span>
              </ResultRow>
            );
          }}
        />
        {nothingFound && (
          <p className="p-7.5 text-center text-subtle-foreground">
            Nothing matches "{query.trim()}".
          </p>
        )}
      </div>
    </div>
  );
};

const AllBooks = ({
  activeBookId,
  onOpenBook,
}: {
  activeBookId: number;
  onOpenBook: (bookId: number) => void;
}) => (
  <>
    {TESTAMENTS.map(({ label, key }) => (
      <SearchGroup key={key} title={label}>
        <div className={bookGridClassName}>
          {BIBLE_BOOKS.filter((book) => book.testament === key).map((book) => (
            <BookTile
              key={book.id}
              book={book}
              isActive={book.id === activeBookId}
              onOpen={onOpenBook}
            />
          ))}
        </div>
      </SearchGroup>
    ))}
  </>
);

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
      "cursor-pointer border bg-secondary text-left",
      emphasis
        ? "rounded-xl border-primary-soft px-3.75 py-3.25"
        : "rounded-[10px] border-border px-3.25 py-2.5",
    )}
  >
    <div className="mb-1 flex items-center gap-2">
      <span
        className={cn(
          "font-bold text-primary-soft",
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
      <ArrowRight size={15} className="shrink-0 text-subtle-foreground" />
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
    <SearchGroup title="Passage">
      <ResultRow
        onOpen={onOpen}
        title={`Open ${formatParsedReference(reference)}`}
        heading={formatParsedReference(reference)}
        emphasis
        meta={
          <span className="text-[11.5px] font-semibold text-subtle-foreground">
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
        {error && <span className="text-[13px] text-destructive">{error}</span>}
        {!loading && !error && (
          <span className="text-[13.5px] leading-[1.55] text-muted-foreground">
            {preview.map((v) => v.t).join(" ")}
          </span>
        )}
      </ResultRow>
    </SearchGroup>
  );
};
