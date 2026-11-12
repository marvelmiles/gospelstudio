import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BibleVersionId, ScripturePassage } from "../../types";
import { bookById } from "../../data/bibleBooks";
import { useStore, type ScriptureSelection } from "../../store/useStore";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Spinner } from "@/components/ui/spinner";
import { VerseSnippet } from "./VerseSnippet";
import { useBibleChapter } from "./useBibleChapter";
import { useBibleSearch } from "./useBibleSearch";
import {
  BookGroup,
  ChapterGroup,
  SearchGroup,
  SearchNote,
  VerseNumberGroup,
  WordMatchGroup,
} from "./SearchGroups";
import {
  formatParsedReference,
  referenceSpan,
  type ParsedReference,
} from "./lib/reference";
import { referenceGroups } from "./lib/searchGroups";
import { buildScriptureSelection } from "./lib/scriptureSelection";
import { cn } from "../../lib/utils";

export type PassagePick =
  | { kind: "saved"; passage: ScripturePassage }
  | { kind: "selection"; selection: ScriptureSelection };

interface PassagePickerProps {
  open: boolean;
  destination: string;
  onClose: () => void;
  onPick: (pick: PassagePick) => void;
}

export const PassagePicker = ({
  open,
  destination,
  onClose,
  onPick,
}: PassagePickerProps) => {
  const version = useStore((s) => s.prefs.bibleVersion);
  const scriptures = useStore((s) => s.scriptures);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => referenceGroups(query), [query]);
  const search = useBibleSearch(version, groups.passage ? "" : query);

  const saved = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const library = scriptures.filter(
      (passage) => !passage.deleted && !passage.quick,
    );
    if (!needle) return library;
    return library.filter((passage) =>
      passage.title.toLowerCase().includes(needle),
    );
  }, [scriptures, query]);

  const insertSelection = (selection: ScriptureSelection | null) => {
    if (!selection?.verses.length) return;
    onPick({ kind: "selection", selection });
    setQuery("");
  };

  const insertPassage = (passage: ScripturePassage) => {
    onPick({ kind: "saved", passage });
    setQuery("");
  };

  if (!open) return null;

  const term = query.trim();
  const { passage } = groups;
  const nothingSaved = saved.length === 0 && !term;
  const nothingFound =
    Boolean(term) &&
    !passage &&
    saved.length === 0 &&
    groups.books.length === 0 &&
    !search.enabled;

  return (
    <Modal open onClose={onClose} title="Add a passage" width={520}>
      <div className="mb-3.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="A saved passage, a book, a reference like Jn 3:16-22, or words"
        />
      </div>

      <div className="max-h-[56vh] overflow-y-auto pr-0.5">
        {nothingSaved ? (
          <EmptyState
            icon={BookOpen}
            title="Nothing saved yet"
            message="Search a book, a reference or words, or save one from the Bible."
            compact
            bare
          />
        ) : (
          <>
            {passage && (
              <PassageGroups
                passage={passage}
                verseNumbers={groups.verses}
                version={version}
                destination={destination}
                onInsert={insertSelection}
              />
            )}

            {saved.length > 0 && (
              <SearchGroup title="Saved passages">
                <div className="flex flex-col gap-1.5">
                  {saved.map((entry) => (
                    <ResultRow
                      key={entry.id}
                      heading={entry.title}
                      destination={destination}
                      onInsert={() => insertPassage(entry)}
                    >
                      <span className="text-[12.5px] text-subtle-foreground">
                        {entry.verses.length} verse
                        {entry.verses.length === 1 ? "" : "s"}
                      </span>
                    </ResultRow>
                  ))}
                </div>
              </SearchGroup>
            )}

            <BookGroup
              books={groups.books}
              onPick={(bookId) => setQuery(bookById(bookId)?.name ?? query)}
            />
            <ChapterGroup
              chapters={groups.chapters}
              onPick={({ book, chapter }) =>
                setQuery(`${book.name} ${chapter}`)
              }
            />
            <WordMatchGroup
              search={search}
              version={version}
              renderResult={(result, book) => {
                const heading = `${book.name} ${result.chapter}:${result.verse}`;
                return (
                  <ResultRow
                    key={heading}
                    heading={heading}
                    destination={destination}
                    onInsert={() =>
                      insertSelection(
                        buildScriptureSelection({
                          version,
                          bookId: result.bookId,
                          chapter: result.chapter,
                          verseStart: result.verse,
                          verses: [{ v: result.verse, t: result.text }],
                        }),
                      )
                    }
                  >
                    <span className="text-[13px] leading-[1.55] text-muted-foreground">
                      <VerseSnippet text={result.text} term={search.term} />
                    </span>
                  </ResultRow>
                );
              }}
            />
            {nothingFound && <SearchNote>Nothing matches "{term}".</SearchNote>}
          </>
        )}
      </div>
    </Modal>
  );
};

const PassageGroups = ({
  passage,
  verseNumbers,
  version,
  destination,
  onInsert,
}: {
  passage: ParsedReference;
  verseNumbers: number[];
  version: BibleVersionId;
  destination: string;
  onInsert: (selection: ScriptureSelection | null) => void;
}) => {
  const { book, chapter } = passage;
  const { verses, loading, error } = useBibleChapter(version, book.id, chapter);
  const span = referenceSpan(passage);
  const chosen = verses.filter((v) => v.v >= span.start && v.v <= span.end);
  const isUnavailable = loading || Boolean(error);

  const insertRange = (verseStart: number, verseEnd: number) =>
    onInsert(
      buildScriptureSelection({
        version,
        bookId: book.id,
        chapter,
        verseStart,
        verseEnd,
        verses,
      }),
    );

  return (
    <>
      <SearchGroup title="Passage">
        <ResultRow
          heading={formatParsedReference(passage)}
          destination={destination}
          emphasis
          disabled={isUnavailable || chosen.length === 0}
          meta={`${version}${chosen.length > 1 ? ` · ${chosen.length} verses` : ""}`}
          onInsert={() => insertRange(span.start, span.end)}
        >
          {loading && <Spinner size={16} />}
          {error && (
            <span className="text-[12.5px] text-destructive">{error}</span>
          )}
          {!isUnavailable && (
            <span className="text-[13px] leading-[1.55] text-muted-foreground">
              {chosen
                .slice(0, 2)
                .map((verse) => verse.t)
                .join(" ")}
              {chosen.length > 2 ? " …" : ""}
            </span>
          )}
        </ResultRow>
      </SearchGroup>
      <VerseNumberGroup
        passage={passage}
        verses={verseNumbers}
        disabled={isUnavailable}
        onPick={(verse) => insertRange(verse, verse)}
      />
    </>
  );
};

const ResultRow = ({
  heading,
  destination,
  meta,
  emphasis,
  disabled,
  onInsert,
  children,
}: {
  heading: string;
  destination: string;
  meta?: string;
  emphasis?: boolean;
  disabled?: boolean;
  onInsert: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onInsert}
    disabled={disabled}
    title={`Add ${heading} to ${destination}`}
    className={cn(
      "block w-full border bg-background text-left disabled:cursor-not-allowed disabled:opacity-60",
      emphasis
        ? "rounded-xl border-primary-soft px-3.5 py-3"
        : "rounded-[10px] border-border px-3 py-2.5",
    )}
  >
    <span className="mb-1 flex items-center gap-2">
      <span
        className={cn(
          "min-w-0 truncate font-bold text-primary-soft",
          emphasis ? "text-[15px]" : "text-[12.5px]",
        )}
      >
        {heading}
      </span>
      {meta && (
        <span className="shrink-0 text-[11px] font-semibold text-subtle-foreground">
          {meta}
        </span>
      )}
      <span className="flex-1" />
      <ArrowRight size={15} className="shrink-0 text-subtle-foreground" />
    </span>
    {children}
  </button>
);
