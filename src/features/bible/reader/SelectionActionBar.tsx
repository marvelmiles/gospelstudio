import { BookmarkPlus, Pencil, Square, Volume2, X } from "lucide-react";
import type { PassageRange } from "../../../types";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import type { ScriptureSelection } from "../../../store/useStore";
import { formatRange } from "../lib/reference";
import { PresentButton } from "../PresentButton";

interface SelectionActionBarProps {
  range: PassageRange;
  verseCount: number;
  buildSelection: () => ScriptureSelection | null;
  onEdit: () => void;
  isSpeechSupported: boolean;
  isSpeaking: boolean;
  onToggleReadAloud: () => void;
  onSave: () => void;
  onClear: () => void;
}

export const SelectionActionBar = ({
  range,
  verseCount,
  buildSelection,
  onEdit,
  isSpeechSupported,
  isSpeaking,
  onToggleReadAloud,
  onSave,
  onClear,
}: SelectionActionBarProps) => (
  <div className="sticky bottom-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[14px] border border-input bg-card/85 px-3 py-2 shadow-overlay backdrop-blur-sm sm:px-3.5 sm:py-2.5">
    <span className="flex min-w-0 flex-[1_1_auto] items-baseline gap-2.5">
      <span className="truncate text-[13.5px] font-semibold text-primary-soft">
        {formatRange(range)}
      </span>
      <span className="shrink-0 text-xs text-subtle-foreground max-sm:hidden">
        {verseCount} verse{verseCount === 1 ? "" : "s"}
      </span>
    </span>
    <span className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
      <PresentButton selection={buildSelection} title="Present these verses" />
      <Button
        size="sm"
        variant="secondary"
        onClick={onEdit}
        title="Edit these verses as slides before presenting"
        aria-label="Edit"
      >
        <Pencil size={13} />
        <span className="max-sm:hidden">Edit</span>
      </Button>
      {isSpeechSupported && (
        <Button
          size="sm"
          variant="secondary"
          onClick={onToggleReadAloud}
          title={isSpeaking ? "Stop reading" : "Read these verses aloud"}
          aria-label={isSpeaking ? "Stop" : "Read"}
        >
          {isSpeaking ? <Square size={13} /> : <Volume2 size={13} />}
          <span className="max-sm:hidden">{isSpeaking ? "Stop" : "Read"}</span>
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        onClick={onSave}
        title="Save passage"
        aria-label="Save passage"
      >
        <BookmarkPlus size={13} />
        <span className="max-sm:hidden">Save passage</span>
      </Button>
      <IconButton icon={X} title="Clear selection" onClick={onClear} />
    </span>
  </div>
);
