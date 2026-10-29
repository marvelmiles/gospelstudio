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

export const VerseRow = ({
  verse,
  isSelected,
  isBeingRead,
  onRef,
  onSelect,
  onPresent,
}: VerseRowProps) => (
  <div
    ref={onRef}
    onClick={(event: MouseEvent) =>
      onSelect(event.ctrlKey || event.metaKey || event.shiftKey)
    }
    onDoubleClick={onPresent}
    title="Click to select, Ctrl-click to extend, Shift+Up/Down to grow, double-click to present this verse"
    className={cn(
      "mb-0.5 flex cursor-pointer gap-3 rounded-[10px] border px-3 py-2.25 select-none",
      isSelected
        ? "border-primary/35 bg-primary/13"
        : isBeingRead
          ? "border-info/40 bg-info/14"
          : "border-transparent bg-transparent",
    )}
  >
    <span
      className={cn(
        "min-w-5.5 pt-0.75 text-right text-xs font-bold tabular-nums",
        isSelected ? "text-primary" : "text-subtle-foreground",
      )}
    >
      {verse.v}
    </span>
    <span
      className={cn(
        "text-[15px] leading-[1.65] whitespace-pre-line",
        isSelected || isBeingRead ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {verse.t}
    </span>
  </div>
);
