import type { ReactNode } from "react";
import {
  ArrowLeft,
  MonitorDown,
  MonitorUp,
  Play,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { useEditorShortcuts } from "../../hooks/useEditorShortcuts";
import {
  usePresentActions,
  type PresentOptions,
} from "../../hooks/usePresentActions";
import { EDITOR_COMMANDS } from "../../lib/shortcuts";
import { Button, IconButton } from "../ui/Button";
import { PresentMenu } from "../ui/PresentMenu";

const ignorePresent = () => {};

interface EditorTopBarProps {
  title: string;
  onTitle?: (title: string) => void;
  compact: boolean;
  titleLabel?: string;
  backTitle?: string;
  onBack?: () => void;
  leading?: ReactNode;
  onPresent?: (options: PresentOptions) => void;
  actions?: ReactNode;
  dirty: boolean;
  titleError?: string | null;
  invalid?: boolean;
  invalidReason?: string | null;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave: () => void;
  saveLabel?: string;
  savedLabel?: string;
  onUpdatePresentation?: () => void;
  onSyncFromPresentation?: () => void;
}

export const EditorTopBar = ({
  title,
  onTitle,
  compact,
  titleLabel = "Title",
  backTitle,
  onBack,
  leading,
  onPresent,
  actions,
  dirty,
  titleError,
  invalid,
  invalidReason,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  saveLabel = "Save",
  savedLabel = "Saved",
  onUpdatePresentation,
  onSyncFromPresentation,
}: EditorTopBarProps) => {
  const blocked = Boolean(invalid);
  const present = usePresentActions(onPresent ?? ignorePresent);
  const saveTitle = blocked
    ? (invalidReason ?? "Fix the highlighted fields to save")
    : dirty
      ? `Save changes (${EDITOR_COMMANDS.save.hint})`
      : "No changes to save";

  useEditorShortcuts({
    save: dirty || blocked ? onSave : undefined,
    updatePresentation: onUpdatePresentation,
    goLive: onPresent ? present.startLive : undefined,
    preview: onPresent ? present.startPreview : undefined,
  });

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.75">
      {onBack && (
        <IconButton
          icon={ArrowLeft}
          title={backTitle ?? "Back"}
          onClick={onBack}
        />
      )}
      {leading}
      <div className="min-w-30 flex-1">
        {onTitle ? (
          <input
            value={title}
            onChange={(event) => onTitle(event.target.value)}
            aria-label={titleLabel}
            aria-invalid={titleError ? true : undefined}
            className={cn(
              "w-full border-0 border-b bg-transparent font-semibold text-fg outline-none",
              compact ? "text-[17px]" : "text-xl",
              titleError ? "border-danger" : "border-transparent",
            )}
          />
        ) : (
          <h1
            className={cn(
              "m-0 truncate font-semibold text-fg",
              compact ? "text-[17px]" : "text-xl",
            )}
          >
            {title}
          </h1>
        )}
        {titleError && (
          <span
            role="alert"
            className="mt-0.75 block text-[11.5px] leading-[1.4] text-danger"
          >
            {titleError}
          </span>
        )}
      </div>
      {onUndo && (
        <IconButton
          icon={Undo2}
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        />
      )}
      {onRedo && (
        <IconButton
          icon={Redo2}
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onClick={onRedo}
        />
      )}
      {actions}
      {onSyncFromPresentation &&
        (compact ? (
          <IconButton
            icon={MonitorDown}
            title="Sync with the presentation"
            onClick={onSyncFromPresentation}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={onSyncFromPresentation}>
            <MonitorDown size={14} />
            Sync with presentation
          </Button>
        ))}
      {onUpdatePresentation &&
        (compact ? (
          <IconButton
            icon={MonitorUp}
            title={`Update presentation (${EDITOR_COMMANDS.updatePresentation.hint})`}
            onClick={onUpdatePresentation}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            title={`Update presentation (${EDITOR_COMMANDS.updatePresentation.hint})`}
            onClick={onUpdatePresentation}
          >
            <MonitorUp size={14} />
            Update presentation
          </Button>
        ))}
      {compact ? (
        <IconButton
          icon={Save}
          title={saveTitle}
          disabled={!dirty || blocked}
          active={dirty && !blocked}
          onClick={onSave}
        />
      ) : (
        <Button
          variant={dirty && !blocked ? "primary" : "ghost"}
          size="sm"
          title={saveTitle}
          disabled={!dirty || blocked}
          onClick={onSave}
        >
          <Save size={14} />
          {dirty ? saveLabel : savedLabel}
        </Button>
      )}
      {onPresent && (
        <PresentMenu onPresent={onPresent} title="Present" hints>
          {compact ? (
            <IconButton icon={Play} title="Present" active />
          ) : (
            <Button variant="primary" size="sm">
              <Play size={14} />
              Present
            </Button>
          )}
        </PresentMenu>
      )}
    </div>
  );
};
