import { BookmarkPlus, Pencil, Square, Volume2, X } from "lucide-react";
import type { PassageRange } from "../../../types";
import { Button, IconButton } from "../../../components/ui/Button";
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
  <div className="sticky bottom-2.5 flex flex-wrap items-center gap-2.5 rounded-[14px] border border-line-strong bg-panel px-3.5 py-2.5 shadow-overlay backdrop-blur-sm">
    <span className="text-[13.5px] font-semibold text-accent-soft">
      {formatRange(range)}
    </span>
    <span className="text-xs text-dim">
      {verseCount} verse{verseCount === 1 ? "" : "s"}
    </span>
    <span className="flex-1" />
    <PresentButton selection={buildSelection} title="Present these verses" />
    <Button
      size="sm"
      variant="ghost"
      onClick={onEdit}
      title="Edit these verses as slides before presenting"
    >
      <Pencil size={13} />
      Edit
    </Button>
    {isSpeechSupported && (
      <Button size="sm" variant="ghost" onClick={onToggleReadAloud}>
        {isSpeaking ? <Square size={13} /> : <Volume2 size={13} />}
        {isSpeaking ? "Stop" : "Read"}
      </Button>
    )}
    <Button size="sm" variant="ghost" onClick={onSave}>
      <BookmarkPlus size={13} />
      Save passage
    </Button>
    <IconButton icon={X} title="Clear selection" onClick={onClear} />
  </div>
);
