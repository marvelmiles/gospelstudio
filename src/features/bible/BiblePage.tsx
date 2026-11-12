import { useValueChange } from "@/hooks/useValueChange";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  ChevronRight,
  Trash2,
} from "lucide-react";
import type { BibleVersionId } from "../../types";
import { BIBLE_VERSIONS, bookById } from "../../data/bibleBooks";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useCompactScreen } from "../../hooks/useCompactScreen";
import { useTrackEventWhen } from "../../hooks/useTrackEventOnce";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { PillTabs } from "@/components/shared/PillTabs";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { BibleReader } from "./BibleReader";
import { SavedPassages } from "./SavedPassages";
import { BooksStep } from "./BooksStep";
import { ChaptersStep } from "./ChaptersStep";
import { VersesStep } from "./VersesStep";
import {
  loadReadingPosition,
  saveReadingPosition,
} from "./lib/readingPosition";
import type { ReadingPosition } from "./lib/readingPosition";
import { recordReading } from "./lib/readingHistory";
import type { VerseSpan } from "./lib/reference";

type BibleTab = "read" | "saved";

type ReadStep = "books" | "chapters" | "verses" | "read";

const versionOptions = BIBLE_VERSIONS.map((v) => ({
  value: v.id,
  label: `${v.id} · ${v.name}`,
}));

export const BiblePage = () => {
  usePageMeta("bible");

  const prefs = useStore((s) => s.prefs);
  const setBibleVersion = useStore((s) => s.setBibleVersion);
  const scriptures = useStore((s) => s.scriptures);

  const [tab, setTab] = useState<BibleTab>("read");
  const [trashView, setTrashView] = useState(false);
  const [step, setStep] = useState<ReadStep>("books");
  const [readingPosition, setReadingPosition] =
    useState<ReadingPosition>(loadReadingPosition);
  const [focusRange, setFocusRange] = useState<VerseSpan | null>(null);
  const setFocusVerse = (verse: number | null) =>
    setFocusRange(verse == null ? null : { start: verse, end: verse });

  useEffect(() => {
    saveReadingPosition(readingPosition);
  }, [readingPosition]);

  useEffect(() => {
    if (step !== "read") return;
    recordReading(readingPosition);
  }, [step, readingPosition]);

  const location = useLocation();
  const navigate = useNavigate();
  const arrivalState = location.state as {
    read?: { bookId: number; chapter: number; verse: number | null };
    tab?: BibleTab;
  } | null;
  const readTarget = arrivalState?.read;
  const tabTarget = arrivalState?.tab;
  useValueChange(
    arrivalState,
    () => {
      if (tabTarget) setTab(tabTarget);
      if (!readTarget) return;
      setReadingPosition({
        bookId: readTarget.bookId,
        chapter: readTarget.chapter,
        verse: readTarget.verse ?? null,
      });
      setFocusVerse(readTarget.verse ?? 1);
      setStep("read");
    },
    { onMount: true },
  );
  useEffect(() => {
    if (arrivalState)
      navigate(location.pathname, { replace: true, state: null });
  }, [arrivalState, navigate, location.pathname]);

  const compact = useCompactScreen();
  const isReadingChapter = tab === "read" && step === "read";
  const isChapterOpen =
    tab === "read" && (step === "verses" || step === "read");
  useTrackEventWhen("Bible Opened", true);
  useTrackEventWhen(
    "Bible Chapter Opened",
    isChapterOpen,
    `${readingPosition.bookId}:${readingPosition.chapter}`,
  );
  const book = bookById(readingPosition.bookId);
  const savedCount = scriptures.filter((s) => !s.quick && !s.deleted).length;

  const openBook = (bookId: number) => {
    setReadingPosition((prev) =>
      bookId === prev.bookId ? prev : { bookId, chapter: 1, verse: null },
    );
    setFocusVerse(null);
    setStep("chapters");
  };
  const openChapter = (chapter: number) => {
    setReadingPosition((prev) => ({ ...prev, chapter, verse: null }));
    setFocusVerse(null);
    setStep("verses");
  };
  const openBookChapter = (bookId: number, chapter: number) => {
    setReadingPosition({ bookId, chapter, verse: null });
    setFocusVerse(null);
    setStep("verses");
  };
  const openVerse = (verse: number) => {
    setReadingPosition((prev) => ({ ...prev, verse }));
    setFocusVerse(verse);
    setStep("read");
  };
  const openChapterReader = () => {
    setFocusVerse(null);
    setStep("read");
  };
  const openSearchResult = (
    bookId: number,
    chapter: number,
    span: VerseSpan,
  ) => {
    setReadingPosition({ bookId, chapter, verse: span.start });
    setFocusRange(span);
    setStep("read");
  };

  const continueReading = () => {
    setFocusVerse(readingPosition.verse ?? null);
    setStep("read");
  };

  const navigateReader = (bookId: number, chapter: number) => {
    setReadingPosition({ bookId, chapter, verse: null });
    setFocusVerse(null);
    setStep("read");
  };

  const rememberCurrentVerse = useCallback((verse: number | null) => {
    setReadingPosition((prev) =>
      prev.verse === verse ? prev : { ...prev, verse },
    );
  }, []);

  const goBack = () => {
    if (step === "read") setStep("verses");
    else if (step === "verses") setStep("chapters");
    else if (step === "chapters") setStep("books");
    if (step !== "books") setFocusVerse(null);
  };

  const crumbClassName = (current: boolean) =>
    cn(
      "border-none bg-transparent px-0.5 py-1 text-[13.5px] font-semibold",
      current ? "cursor-default text-primary-soft" : "text-muted-foreground",
    );
  const crumbSep = (
    <ChevronRight size={13} className="shrink-0 text-subtle-foreground" />
  );

  const versionPicker = (
    <OptionSelect
      aria-label="Bible version"
      value={prefs.bibleVersion}
      options={versionOptions}
      onValueChange={(next) => setBibleVersion(next as BibleVersionId)}
      valueLabel={compact ? prefs.bibleVersion : undefined}
      className={cn(compact && "h-7.5 w-auto gap-1.5 px-2.5")}
    />
  );

  const readView = (
    <div className="flex flex-col roomy:min-h-0 roomy:flex-1">
      {!(compact && step === "read") && (
        <div className="mb-3.5 flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {step !== "books" && (
            <IconButton icon={ArrowLeft} title="Back" onClick={goBack} />
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <button
              className={crumbClassName(step === "books")}
              onClick={() => setStep("books")}
            >
              Books
            </button>
            {step !== "books" && book && (
              <>
                {crumbSep}
                <button
                  className={crumbClassName(step === "chapters")}
                  onClick={() => setStep("chapters")}
                >
                  {book.name}
                </button>
              </>
            )}
            {(step === "verses" || step === "read") && (
              <>
                {crumbSep}
                <button
                  className={crumbClassName(step === "verses")}
                  onClick={() => {
                    setFocusVerse(null);
                    setStep("verses");
                  }}
                >
                  Chapter {readingPosition.chapter}
                </button>
              </>
            )}
            {step === "read" && (
              <>
                {crumbSep}
                <span className={crumbClassName(true)}>
                  {!focusRange
                    ? "Reading"
                    : focusRange.start === focusRange.end
                      ? `Verse ${focusRange.start}`
                      : `Verses ${focusRange.start}-${focusRange.end}`}
                </span>
              </>
            )}
          </div>
          <span className="flex-1" />
          <div className="w-57.5 max-w-full">{versionPicker}</div>
        </div>
      )}

      {step === "books" && (
        <BooksStep
          position={readingPosition}
          version={prefs.bibleVersion}
          continueLabel={
            book
              ? `${book.name} ${readingPosition.chapter}${readingPosition.verse ? `:${readingPosition.verse}` : ""}`
              : null
          }
          onOpenBook={openBook}
          onOpenChapter={openBookChapter}
          onContinueReading={continueReading}
          onOpenSearchResult={openSearchResult}
        />
      )}
      {step === "chapters" && book && (
        <ChaptersStep
          book={book}
          chapter={readingPosition.chapter}
          onOpenChapter={openChapter}
        />
      )}
      {step === "verses" && book && (
        <VersesStep
          version={prefs.bibleVersion}
          book={book}
          chapter={readingPosition.chapter}
          onOpenVerse={openVerse}
          onReadWholeChapter={openChapterReader}
        />
      )}
      {step === "read" && (
        <div className="roomy:min-h-0 roomy:flex-1">
          <BibleReader
            version={prefs.bibleVersion}
            bookId={readingPosition.bookId}
            chapter={readingPosition.chapter}
            focusRange={focusRange}
            onNavigate={navigateReader}
            onCurrentVerseChange={rememberCurrentVerse}
            onBack={compact ? goBack : undefined}
            versionPicker={compact ? versionPicker : undefined}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        pageClassName,
        "flex h-full flex-col overflow-y-auto roomy:max-h-full roomy:overflow-hidden",
        isReadingChapter && "max-sm:pt-0",
      )}
    >
      {!(compact && isReadingChapter) && (
        <PageHeader
          title="Bible"
          subtitle="Read and project scripture offline."
          actions={
            <>
              <PillTabs<BibleTab>
                tabs={[
                  { id: "read", label: "Read", icon: BookOpen },
                  {
                    id: "saved",
                    label: `Saved (${savedCount})`,
                    icon: Bookmark,
                  },
                ]}
                value={tab}
                onChange={(next) => {
                  setTab(next);
                  if (next === "read") setTrashView(false);
                }}
              />
              {tab === "saved" && (
                <Button
                  variant={trashView ? "default" : "secondary"}
                  onClick={() => setTrashView((v) => !v)}
                >
                  <Trash2 size={15} />
                  {trashView ? "Passages" : "Trash"}
                </Button>
              )}
            </>
          }
        />
      )}

      {tab === "read" ? (
        readView
      ) : (
        <div className="roomy:min-h-0 roomy:flex-1 roomy:overflow-y-auto">
          <SavedPassages trashView={trashView} />
        </div>
      )}
    </div>
  );
};
