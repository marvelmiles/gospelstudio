import { useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Square,
  Volume2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Input } from "@/components/ui/input";
import { ClearInputButton } from "@/components/shared/ClearInputButton";

interface ChapterToolbarProps {
  reference: string;
  onReferenceChange: (value: string) => void;
  onJumpToReference: () => void;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  onToggleReadAloud: () => void;
  chapterLabel: string;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
}

export const ChapterToolbar = ({
  reference,
  onReferenceChange,
  onJumpToReference,
  isAllSelected,
  onToggleSelectAll,
  isSpeechSupported,
  isSpeaking,
  onToggleReadAloud,
  chapterLabel,
  onPreviousChapter,
  onNextChapter,
}: ChapterToolbarProps) => {
  const referenceRef = useRef<HTMLInputElement>(null);

  const clearReference = () => {
    onReferenceChange("");
    referenceRef.current?.focus();
  };

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-47.5 flex-1">
        <Input
          ref={referenceRef}
          value={reference}
          placeholder="Go to reference, like John 3:16-18"
          onChange={(event) => onReferenceChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onJumpToReference();
            if (event.key === "Escape" && reference) {
              event.preventDefault();
              clearReference();
            }
          }}
          className={cn(reference && "pr-9.5")}
        />
        <ClearInputButton
          value={reference}
          onClear={clearReference}
          label="Clear reference"
        />
      </div>
      <Button
        variant="secondary"
        onClick={onJumpToReference}
        title="Go to reference"
      >
        <ArrowRight size={15} />
        Go
      </Button>
      <span className="flex-1" />
      <div className="flex items-center gap-1.5">
        <IconButton
          icon={ListChecks}
          title={
            isAllSelected
              ? "Deselect all verses (Ctrl+A)"
              : "Select all verses (Ctrl+A)"
          }
          active={isAllSelected}
          onClick={onToggleSelectAll}
        />
        {isSpeechSupported && (
          <IconButton
            icon={isSpeaking ? Square : Volume2}
            title={isSpeaking ? "Stop reading" : "Read chapter aloud"}
            active={isSpeaking}
            onClick={onToggleReadAloud}
          />
        )}
        <IconButton
          icon={ChevronLeft}
          title="Previous chapter"
          onClick={onPreviousChapter}
        />
        <span className="min-w-32.5 text-center text-[17px] font-semibold text-foreground">
          {chapterLabel}
        </span>
        <IconButton
          icon={ChevronRight}
          title="Next chapter"
          onClick={onNextChapter}
        />
      </div>
    </div>
  );
};
