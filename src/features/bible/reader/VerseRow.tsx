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
      "mb-0.5 flex cursor-pointer gap-2.5 rounded-[10px] border px-2 py-2 select-none sm:gap-3 sm:px-3 sm:py-2.25",
      isSelected
        ? "border-primary/35 bg-primary/13"
        : isBeingRead
          ? "border-info/40 bg-info/14"
          : "border-transparent bg-transparent",
    )}
  >
    <span
      className={cn(
        "min-w-5.5 shrink-0 pt-1 text-right text-xs font-bold tabular-nums sm:pt-0.75",
        isSelected ? "text-primary" : "text-subtle-foreground",
      )}
    >
      {verse.v}
    </span>
    <span
      className={cn(
        "min-w-0 text-[17px] leading-[1.75] whitespace-pre-line sm:text-[15px] sm:leading-[1.65]",
        isSelected || isBeingRead
          ? "text-foreground"
          : "text-foreground/85 sm:text-muted-foreground",
      )}
    >
      {verse.t}
    </span>
  </div>
);
