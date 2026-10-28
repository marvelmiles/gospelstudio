import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import type { BibleVersionId, ScripturePassage } from "../../types";
import { bookById } from "../../data/bibleBooks";
import { useStore, type ScriptureSelection } from "../../store/useStore";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { SearchInput } from "../../components/ui/SearchInput";
import { Spinner } from "../../components/ui/Spinner";
import { VerseSnippet } from "../bible/VerseSnippet";
import { useBibleChapter } from "../bible/useBibleChapter";
import { useBibleSearch } from "../bible/useBibleSearch";
import {
  formatParsedReference,
  parseReference,
  referenceSpan,
  type ParsedReference,
} from "../bible/lib/reference";
import { buildScriptureSelection } from "../bible/lib/scriptureSelection";
import { createOverlayPassage } from "./lib/overlayPassage";
import { cn } from "../../lib/cn";

export interface OverlayPassageChoice {
  contentId: string;
  label: string;
}

export const OverlayPassagePicker = ({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (choice: OverlayPassageChoice) => void;
}) => {
  const version = useStore((s) => s.prefs.bibleVersion);
  const scriptures = useStore((s) => s.scriptures);
  const [query, setQuery] = useState("");

  const reference = useMemo(() => parseReference(query), [query]);

  const search = useBibleSearch(version, reference?.hasChapter ? "" : query);

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
    const passage = createOverlayPassage(selection);
    if (passage) insertPassage(passage);
  };

  const insertPassage = (passage: ScripturePassage) => {
    onPick({ contentId: passage.id, label: passage.title });
    setQuery("");
  };

  if (!open) return null;

  const nothingAtAll =
    saved.length === 0 && !reference && !search.enabled && !query.trim();

  return (
    <Modal open onClose={onClose} title="Add a passage" width={520}>
      <div className="mb-3.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="A saved passage, a reference like Jn 3:16-22, or words"
        />
      </div>

      <div className="max-h-[56vh] overflow-y-auto pr-0.5">
        {nothingAtAll ? (
          <EmptyState
            icon={BookOpen}
            title="Nothing saved yet"
            message="Search a reference or words, or save one from the Bible."
            compact
            bare
          />
        ) : (
          <>
            {reference && (
              <Section title="Go to passage">
                <ReferenceResult
                  reference={reference}
                  version={version}
                  onInsert={insertSelection}
                />
              </Section>
            )}

            {saved.length > 0 && (
              <Section title="Saved passages">
                <div className="flex flex-col gap-1.5">
                  {saved.map((passage) => (
                    <ResultRow
                      key={passage.id}
                      heading={passage.title}
                      onInsert={() => insertPassage(passage)}
                    >
                      <span className="text-[12.5px] text-dim">
                        {passage.verses.length} verse
                        {passage.verses.length === 1 ? "" : "s"}
                      </span>
                    </ResultRow>
                  ))}
                </div>
              </Section>
            )}

            {!reference?.hasChapter && query.trim() && saved.length === 0 && (
              <Note>No saved passage matches "{query.trim()}".</Note>
            )}

            {search.enabled && (
              <Section
                title={`Verses matching "${search.term}"${
                  search.total > 0 ? ` (${search.total.toLocaleString()})` : ""
                }`}
              >
                {search.loading && search.results.length === 0 && (
                  <div className="px-0.5 py-3">
                    <Spinner size={18} />
                  </div>
                )}
                {search.error && <Note danger>{search.error}</Note>}
                {!search.loading &&
                  !search.error &&
                  search.results.length === 0 && (
                    <Note>
                      No verses in {version} contain "{search.term}".
                    </Note>
                  )}
                <div className="flex flex-col gap-1.5">
                  {search.results.map((result) => {
                    const book = bookById(result.bookId);
                    if (!book) return null;
                    const heading = `${book.name} ${result.chapter}:${result.verse}`;
                    return (
                      <ResultRow
                        key={heading}
                        heading={heading}
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
                        <span className="text-[13px] leading-[1.55] text-sub">
                          <VerseSnippet text={result.text} term={search.term} />
                        </span>
                      </ResultRow>
                    );
                  })}
                </div>
                {search.hasMore && (
                  <div className="mt-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={search.loadMore}
                      busy={search.loading}
                    >
                      Load more ({search.results.length} of{" "}
                      {search.total.toLocaleString()})
                    </Button>
                  </div>
                )}
              </Section>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

const ReferenceResult = ({
  reference,
  version,
  onInsert,
}: {
  reference: ParsedReference;
  version: BibleVersionId;
  onInsert: (selection: ScriptureSelection | null) => void;
}) => {
  const { verses, loading, error } = useBibleChapter(
    version,
    reference.book.id,
    reference.chapter,
  );
  const span = referenceSpan(reference);
  const chosen = verses.filter((v) => v.v >= span.start && v.v <= span.end);

  return (
    <ResultRow
      heading={formatParsedReference(reference)}
      emphasis
      disabled={loading || Boolean(error) || chosen.length === 0}
      meta={`${version}${chosen.length > 1 ? ` · ${chosen.length} verses` : ""}`}
      onInsert={() =>
        onInsert(
          buildScriptureSelection({
            version,
            bookId: reference.book.id,
            chapter: reference.chapter,
            verseStart: span.start,
            verseEnd: span.end,
            verses,
          }),
        )
      }
    >
      {loading && <Spinner size={16} />}
      {error && <span className="text-[12.5px] text-danger">{error}</span>}
      {!loading && !error && (
        <span className="text-[13px] leading-[1.55] text-sub">
          {chosen
            .slice(0, 2)
            .map((verse) => verse.t)
            .join(" ")}
          {chosen.length > 2 ? " …" : ""}
        </span>
      )}
    </ResultRow>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="mb-4.5">
    <div className="mb-2 text-[11px] font-bold tracking-[0.4px] text-dim uppercase">
      {title}
    </div>
    {children}
  </div>
);

const Note = ({
  children,
  danger,
}: {
  children: ReactNode;
  danger?: boolean;
}) => (
  <p
    className={cn(
      "mt-0 mb-3.5 text-[12.5px]",
      danger ? "text-danger" : "text-dim",
    )}
  >
    {children}
  </p>
);

const ResultRow = ({
  heading,
  meta,
  emphasis,
  disabled,
  onInsert,
  children,
}: {
  heading: string;
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
    title={`Add ${heading} to the broadcast`}
    className={cn(
      "block w-full border bg-canvas text-left disabled:cursor-not-allowed disabled:opacity-60",
      emphasis
        ? "rounded-xl border-accent-soft px-3.5 py-3"
        : "rounded-[10px] border-line px-3 py-2.5",
    )}
  >
    <span className="mb-1 flex items-center gap-2">
      <span
        className={cn(
          "min-w-0 truncate font-bold text-accent-soft",
          emphasis ? "text-[15px]" : "text-[12.5px]",
        )}
      >
        {heading}
      </span>
      {meta && (
        <span className="shrink-0 text-[11px] font-semibold text-dim">
          {meta}
        </span>
      )}
      <span className="flex-1" />
      <ArrowRight size={15} className="shrink-0 text-dim" />
    </span>
    {children}
  </button>
);
