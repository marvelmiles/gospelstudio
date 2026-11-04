import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Square,
  Volume2,
} from "lucide-react";
import { IconButton } from "@/components/shared/IconButton";
import { ReferenceField } from "./ReferenceField";

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
}: ChapterToolbarProps) => (
  <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
    <ReferenceField
      value={reference}
      onChange={onReferenceChange}
      onJump={onJumpToReference}
      className="min-w-[min(11.875rem,100%)] flex-1"
    />
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
