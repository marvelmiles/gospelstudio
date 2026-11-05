import type { MouseEvent } from "react";
import type { BibleVerse } from "../../../types";
import { cn } from "../../../lib/utils";

interface VerseRowProps {
  verse: BibleVerse;
  isSelected: boolean;
  isBeingRead: boolean;
  onRef: (element: HTMLDivElement | null) => void;
  onSelect: (extend: boolean) => void;
  onPresent: () => void;
}

type VerseTone = "reading" | "selected" | "plain";

const ROW_TONE: Record<VerseTone, string> = {
  reading: "border-primary bg-primary/30 ring-1 ring-primary/60",
  selected: "border-primary/35 bg-primary/13",
  plain: "border-transparent bg-transparent",
};

const NUMBER_TONE: Record<VerseTone, string> = {
  reading: "text-primary",
  selected: "text-primary",
  plain: "text-subtle-foreground",
};

const TEXT_TONE: Record<VerseTone, string> = {
  reading: "text-foreground",
  selected: "text-foreground",
  plain: "text-foreground/85 sm:text-muted-foreground",
};

export const VerseRow = ({
  verse,
  isSelected,
  isBeingRead,
  onRef,
  onSelect,
  onPresent,
}: VerseRowProps) => {
  const tone: VerseTone = isBeingRead
    ? "reading"
    : isSelected
      ? "selected"
      : "plain";

  return (
    <div
      ref={onRef}
      aria-current={isBeingRead || undefined}
      onClick={(event: MouseEvent) =>
        onSelect(
          event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            (event.nativeEvent as PointerEvent).pointerType === "touch",
        )
      }
      onDoubleClick={onPresent}
      title="Click to select, Ctrl-click to extend, Shift+Up/Down to grow, double-click to present this verse"
      className={cn(
        "mb-0.5 flex cursor-pointer gap-2.5 rounded-[10px] border px-2 py-2 transition-colors select-none sm:gap-3 sm:px-3 sm:py-2.25",
        ROW_TONE[tone],
      )}
    >
      <span
        className={cn(
          "min-w-5.5 shrink-0 pt-1 text-right text-xs font-bold tabular-nums sm:pt-0.75",
          NUMBER_TONE[tone],
        )}
      >
        {verse.v}
      </span>
      <span
        className={cn(
          "min-w-0 text-[17px] leading-[1.75] whitespace-pre-line sm:text-[15px] sm:leading-[1.65]",
          TEXT_TONE[tone],
        )}
      >
        {verse.t}
      </span>
    </div>
  );
};
