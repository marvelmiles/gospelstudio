import { BookOpen, RotateCcw } from "lucide-react";
import type { BibleVersionId } from "../../types";
import type { BibleBook } from "../../data/bibleBooks";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useBibleChapter } from "./useBibleChapter";
import { tileClassName } from "./tileStyle";
import { stepNumberGridClassName, stepScrollClassName } from "./ChaptersStep";

export const VersesStep = ({
  version,
  book,
  chapter,
  onOpenVerse,
  onReadWholeChapter,
}: {
  version: BibleVersionId;
  book: BibleBook;
  chapter: number;
  onOpenVerse: (verse: number) => void;
  onReadWholeChapter: () => void;
}) => {
  const { verses, loading, error, retry } = useBibleChapter(
    version,
    book.id,
    chapter,
  );

  return (
    <div className={stepScrollClassName}>
      <div className="mb-1 flex flex-wrap items-center gap-2.5">
        <h2 className="my-0.5 text-[22px] font-semibold text-foreground">
          {book.name} {chapter}
        </h2>
        <span className="flex-1" />
        <Button onClick={onReadWholeChapter}>
          <BookOpen size={15} />
          Read full chapter
        </Button>
      </div>
      <p className="mt-0 mb-4 text-[13px] text-muted-foreground">
        Jump straight to a verse, or read the whole chapter.
      </p>
      {loading && (
        <div className="grid place-items-center p-9">
          <Spinner size={26} />
        </div>
      )}
      {!loading && error && (
        <div className="p-6.5 text-center">
          <p className="mt-0 leading-[1.6] text-muted-foreground">{error}</p>
          <Button onClick={retry}>
            <RotateCcw size={14} />
            Try again
          </Button>
        </div>
      )}
      {!loading && !error && (
        <div className={stepNumberGridClassName}>
          {verses.map((verse) => (
            <button
              key={verse.v}
              onClick={() => onOpenVerse(verse.v)}
              title={
                verse.t.length > 140 ? `${verse.t.slice(0, 140)}…` : verse.t
              }
              className={tileClassName(false)}
            >
              {verse.v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
