import type { BibleBook } from "../../data/bibleBooks";
import { tileClassName } from "./tileStyle";

export const stepScrollClassName = "min-h-0 flex-1 overflow-y-auto pr-1.5 pb-3";

export const stepNumberGridClassName =
  "grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2";

export const ChaptersStep = ({
  book,
  chapter,
  onOpenChapter,
}: {
  book: BibleBook;
  chapter: number;
  onOpenChapter: (chapter: number) => void;
}) => (
  <div className={stepScrollClassName}>
    <h2 className="mt-0.5 mb-1 text-[22px] font-semibold text-foreground">
      {book.name}
    </h2>
    <p className="mt-0 mb-4 text-[13px] text-muted-foreground">
      Pick a chapter to continue.
    </p>
    <div className={stepNumberGridClassName}>
      {Array.from({ length: book.chapters }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onOpenChapter(n)}
          className={tileClassName(n === chapter)}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);
