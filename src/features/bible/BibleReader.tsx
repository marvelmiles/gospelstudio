import { useValueChange } from "@/hooks/useValueChange";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ListChecks, RotateCcw, Search, Square, Volume2 } from "lucide-react";
import type { BibleVerse, BibleVersionId } from "../../types";
import { bookById } from "../../data/bibleBooks";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import type { ScriptureSelection } from "../../store/useStore";
import { useSpeech } from "../../hooks/useSpeech";
import { useCompactScreen } from "../../hooks/useCompactScreen";
import { Button } from "@/components/ui/button";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { useBibleChapter } from "./useBibleChapter";
import { usePresentScripture } from "./usePresentScripture";
import { buildScriptureSelection } from "./lib/scriptureSelection";
import { parseReference, referenceSpan, type VerseSpan } from "./lib/reference";
import { spokenVerse } from "./lib/spokenScripture";
import { ChapterToolbar } from "./reader/ChapterToolbar";
import { CompactReaderBar } from "./reader/CompactReaderBar";
import { ReferenceField } from "./reader/ReferenceField";
import { SelectionActionBar } from "./reader/SelectionActionBar";
import { useReadAlongScroll } from "./reader/useReadAlongScroll";
import { useSavePassageFlow } from "./reader/useSavePassageFlow";
import { useVerseSelection } from "./reader/useVerseSelection";
import { VerseRow } from "./reader/VerseRow";
import { SavePassageModal } from "./SavePassageModal";
import { DuplicatePassageModal } from "./DuplicatePassageModal";

const FIRST_BOOK_ID = 1;
const LAST_BOOK_ID = 66;

interface BibleReaderProps {
  version: BibleVersionId;
  bookId: number;
  chapter: number;
  focusRange?: VerseSpan | null;
  onNavigate: (bookId: number, chapter: number) => void;
  onCurrentVerseChange?: (verse: number | null) => void;
  onBack?: () => void;
  versionPicker?: ReactNode;
}

export const BibleReader = ({
  version,
  bookId,
  chapter,
  focusRange,
  onNavigate,
  onCurrentVerseChange,
  onBack,
  versionPicker,
}: BibleReaderProps) => {
  const compact = useCompactScreen();
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const pushToast = useStore((s) => s.pushToast);
  const readVerseNumbers = useStore((s) => s.prefs.readVerseNumbers);
  const { present, edit } = usePresentScripture();
  const { verses, loading, error, retry } = useBibleChapter(
    version,
    bookId,
    chapter,
  );
  const [reference, setReference] = useState("");
  const [readingVerse, setReadingVerse] = useState<number | null>(null);
  const speech = useSpeech();
  const verseListRef = useRef<HTMLDivElement>(null);
  const book = bookById(bookId);

  const selection = useVerseSelection({
    verses,
    focusRange,
    chapterKey: `${version}:${bookId}:${chapter}`,
    isLoading: loading,
  });
  const savePassage = useSavePassageFlow();
  const { selectionStart, selectionEnd, selectedVerses } = selection;

  const { stop: stopSpeech } = speech;
  useEffect(() => {
    stopSpeech();
  }, [version, bookId, chapter, stopSpeech]);

  useValueChange(speech.speaking, (speaking) => {
    if (!speaking) setReadingVerse(null);
  });

  useReadAlongScroll({
    verse: readingVerse,
    listRef: verseListRef,
    scrollToVerse: selection.scrollToVerse,
  });

  useEffect(() => {
    onCurrentVerseChange?.(readingVerse ?? selectionStart);
  }, [readingVerse, selectionStart, onCurrentVerseChange]);

  const buildSelection = (): ScriptureSelection | null => {
    if (selectionStart === null || selectionEnd === null) return null;
    return buildScriptureSelection({
      version,
      bookId,
      chapter,
      verseStart: selectionStart,
      verseEnd: selectionEnd,
      verses,
    });
  };

  const jumpToReference = () => {
    const parsed = parseReference(reference);
    if (!parsed) {
      pushToast(
        "Couldn't read that reference. Try something like John 3:16-18.",
        "error",
      );
      return;
    }
    const span = referenceSpan(parsed);
    const target = { anchor: span.start, focus: span.end };
    if (parsed.book.id === bookId && parsed.chapter === chapter) {
      selection.setSelection(target);
      selection.scrollToVerse(span.start);
    } else {
      selection.selectAfterNavigation(target, span.start);
      onNavigate(parsed.book.id, parsed.chapter);
    }
    setReference("");
    setIsReferenceOpen(false);
  };

  const goChapter = (delta: number) => {
    let nextBook = bookId;
    let nextChapter = chapter + delta;
    if (book && nextChapter > book.chapters) {
      if (bookId >= LAST_BOOK_ID) return;
      nextBook = bookId + 1;
      nextChapter = 1;
    } else if (nextChapter < 1) {
      if (bookId <= FIRST_BOOK_ID) return;
      nextBook = bookId - 1;
      nextChapter = bookById(nextBook)?.chapters || 1;
    }
    onNavigate(nextBook, nextChapter);
  };

  const readAloud = (list: BibleVerse[]) => {
    if (!list.length) return;
    speech.speak(
      list.map((verse) => spokenVerse(verse, readVerseNumbers)),
      (index) => {
        const verse = list[index]?.v;
        if (verse !== undefined) setReadingVerse(verse);
      },
    );
  };

  const toggleReadAloud = (list: BibleVerse[]) => () =>
    speech.speaking ? speech.stop() : readAloud(list);

  const chapterLabel = `${book?.name ?? ""} ${chapter}`;

  return (
    <div className="flex flex-col roomy:h-full roomy:min-h-0">
      {compact ? (
        <CompactReaderBar
          chapterLabel={chapterLabel}
          onBack={onBack}
          onPreviousChapter={() => goChapter(-1)}
          onNextChapter={() => goChapter(1)}
          versionPicker={versionPicker}
          menuItems={[
            {
              label: "Go to reference",
              icon: Search,
              onClick: () => setIsReferenceOpen(true),
            },
            {
              label: selection.isAllSelected
                ? "Deselect all verses"
                : "Select all verses",
              icon: ListChecks,
              active: selection.isAllSelected,
              onClick: selection.toggleSelectAll,
            },
            ...(speech.supported
              ? [
                  {
                    label: speech.speaking ? "Stop reading" : "Read aloud",
                    icon: speech.speaking ? Square : Volume2,
                    active: speech.speaking,
                    onClick: toggleReadAloud(verses),
                  },
                ]
              : []),
          ]}
        >
          {isReferenceOpen && (
            <ReferenceField
              value={reference}
              onChange={setReference}
              onJump={jumpToReference}
              onEscape={() => setIsReferenceOpen(false)}
              autoFocus
              className="mt-2"
            />
          )}
        </CompactReaderBar>
      ) : (
        <ChapterToolbar
          reference={reference}
          onReferenceChange={setReference}
          onJumpToReference={jumpToReference}
          isAllSelected={selection.isAllSelected}
          onToggleSelectAll={selection.toggleSelectAll}
          isSpeechSupported={speech.supported}
          isSpeaking={speech.speaking}
          onToggleReadAloud={toggleReadAloud(verses)}
          chapterLabel={chapterLabel}
          onPreviousChapter={() => goChapter(-1)}
          onNextChapter={() => goChapter(1)}
        />
      )}

      <div
        ref={verseListRef}
        className={cn(
          "roomy:min-h-0 roomy:flex-1 roomy:overflow-y-auto roomy:pr-1.5",
          selection.selection ? "pb-19" : "pb-3",
        )}
      >
        {loading && <LoadingArea size={44} />}
        {!loading && error && (
          <div className="glass p-7 text-center">
            <p className="mt-0 leading-[1.6] text-muted-foreground">{error}</p>
            <Button onClick={retry}>
              <RotateCcw size={14} />
              Try again
            </Button>
          </div>
        )}
        {!loading &&
          !error &&
          verses.map((verse) => (
            <VerseRow
              key={verse.v}
              verse={verse}
              isSelected={
                selectionStart !== null &&
                selectionEnd !== null &&
                verse.v >= selectionStart &&
                verse.v <= selectionEnd
              }
              isBeingRead={readingVerse === verse.v}
              onRef={(element) => selection.registerVerseRef(verse.v, element)}
              onSelect={(extend) => selection.selectVerse(verse.v, extend)}
              onPresent={() =>
                present(
                  buildScriptureSelection({
                    version,
                    bookId,
                    chapter,
                    verseStart: verse.v,
                    verses,
                  }),
                )
              }
            />
          ))}
      </div>

      {selection.selection && selectedVerses.length > 0 && book && (
        <SelectionActionBar
          range={{
            bookId,
            bookName: book.name,
            chapter,
            verseStart: selectionStart as number,
            verseEnd: selectionEnd as number,
          }}
          verseCount={selectedVerses.length}
          buildSelection={buildSelection}
          onEdit={() => edit(buildSelection())}
          isSpeechSupported={speech.supported}
          isSpeaking={speech.speaking}
          onToggleReadAloud={toggleReadAloud(selectedVerses)}
          onSave={() => savePassage.setPendingSave(buildSelection())}
          onClear={selection.clearSelection}
        />
      )}

      <SavePassageModal
        selection={savePassage.pendingSave}
        onClose={() => savePassage.setPendingSave(null)}
        onSave={savePassage.saveSelection}
      />

      <DuplicatePassageModal
        existingTitle={savePassage.duplicateTitle}
        onOverwrite={savePassage.overwriteDuplicate}
        onSaveCopy={savePassage.saveDuplicateAsCopy}
        onClose={savePassage.closeDuplicatePrompt}
      />
    </div>
  );
};
