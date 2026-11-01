import { useId, type ReactNode } from "react";
import {
  ArrowLeft,
  Clapperboard,
  MonitorDown,
  MonitorUp,
  Play,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useEditorShortcuts } from "../../hooks/useEditorShortcuts";
import {
  usePresentActions,
  type PresentOptions,
} from "../../hooks/usePresentActions";
import { EDITOR_COMMANDS } from "../../lib/shortcuts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconButton } from "@/components/shared/IconButton";
import { PresentMenu } from "@/components/shared/PresentMenu";

const ignorePresent = () => {};

export interface SceneUpdateControls {
  autoUpdate: boolean;
  onAutoUpdateChange: (autoUpdate: boolean) => void;
  onPreview: () => void;
}

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
  scene?: SceneUpdateControls;
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
  scene,
}: EditorTopBarProps) => {
  const blocked = Boolean(invalid);
  const present = usePresentActions(onPresent ?? ignorePresent);
  const saveTitle = blocked
    ? (invalidReason ?? "Fix the highlighted fields to save")
    : dirty
      ? `${scene ? "Update the scene" : "Save changes"} (${EDITOR_COMMANDS.save.hint})`
      : scene
        ? "The scene already has these changes"
        : "No changes to save";
  const SaveIcon = scene ? Clapperboard : Save;
  const saveText = scene
    ? dirty
      ? "Update scene"
      : "Scene up to date"
    : dirty
      ? saveLabel
      : savedLabel;

  useEditorShortcuts({
    save: dirty || blocked ? onSave : undefined,
    updatePresentation: onUpdatePresentation,
    goLive: onPresent && !scene ? present.startLive : undefined,
    preview: scene?.onPreview ?? (onPresent ? present.startPreview : undefined),
  });

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-2.75">
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
              "w-full border-0 border-b bg-transparent font-semibold text-foreground outline-none",
              compact ? "text-[17px]" : "text-xl",
              titleError ? "border-destructive" : "border-transparent",
            )}
          />
        ) : (
          <h1
            className={cn(
              "m-0 truncate font-semibold text-foreground",
              compact ? "text-[17px]" : "text-xl",
            )}
          >
            {title}
          </h1>
        )}
        {titleError && (
          <span
            role="alert"
            className="mt-0.75 block text-[11.5px] leading-[1.4] text-destructive"
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
          <Button
            variant="secondary"
            size="sm"
            onClick={onSyncFromPresentation}
          >
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
            variant="secondary"
            size="sm"
            title={`Update presentation (${EDITOR_COMMANDS.updatePresentation.hint})`}
            onClick={onUpdatePresentation}
          >
            <MonitorUp size={14} />
            Update presentation
          </Button>
        ))}
      {scene && (
        <AutoUpdateSwitch
          checked={scene.autoUpdate}
          onChange={scene.onAutoUpdateChange}
          compact={compact}
        />
      )}
      {compact ? (
        <IconButton
          icon={SaveIcon}
          title={saveTitle}
          disabled={!dirty || blocked}
          active={dirty && !blocked}
          onClick={onSave}
        />
      ) : (
        <Button
          variant={dirty && !blocked ? "default" : "secondary"}
          size="sm"
          title={saveTitle}
          disabled={!dirty || blocked}
          onClick={onSave}
        >
          <SaveIcon size={14} />
          {saveText}
        </Button>
      )}
      {scene &&
        (compact ? (
          <IconButton
            icon={Play}
            title={`Preview here (${EDITOR_COMMANDS.preview.hint})`}
            active
            onClick={scene.onPreview}
          />
        ) : (
          <Button
            size="sm"
            title={`Preview here (${EDITOR_COMMANDS.preview.hint})`}
            onClick={scene.onPreview}
          >
            <Play size={14} />
            Preview
          </Button>
        ))}
      {onPresent && !scene && (
        <PresentMenu onPresent={onPresent} title="Present" hints>
          {compact ? (
            <IconButton icon={Play} title="Present" active />
          ) : (
            <Button size="sm">
              <Play size={14} />
              Present
            </Button>
          )}
        </PresentMenu>
      )}
    </div>
  );
};

interface AutoUpdateSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact: boolean;
}

const AutoUpdateSwitch = ({
  checked,
  onChange,
  compact,
}: AutoUpdateSwitchProps) => {
  const id = useId();
  return (
    <div
      className="flex items-center gap-2"
      title="Send every change to the scene as you make it"
    >
      <Label
        htmlFor={id}
        className={cn(
          "cursor-pointer text-[12.5px] font-semibold text-muted-foreground",
          compact && "sr-only",
        )}
      >
        Auto update
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
};
