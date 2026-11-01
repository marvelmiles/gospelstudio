import type { ReactNode } from "react";
import { MonitorPlay, MonitorUp, Play, type LucideIcon } from "lucide-react";
import {
  usePresentActions,
  type PresentOptions,
} from "../../hooks/usePresentActions";
import { EDITOR_COMMANDS } from "../../lib/shortcuts";
import { cn } from "../../lib/utils";
import { useHoverOpen } from "../../hooks/useHoverOpen";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";

interface PresentChoice {
  title: string;
  description: string;
  hint?: string;
}

interface PresentMenuButtonProps {
  onGoLive: () => void;
  onPreview: () => void;
  goLive?: PresentChoice;
  preview?: PresentChoice;
  label?: string;
  disabled?: boolean;
  title?: string;
  fill?: boolean;
  align?: "start" | "end";
  children?: ReactNode;
}

const GO_LIVE_CHOICE: PresentChoice = {
  title: "Go live",
  description: "Project to the audience display",
};

const PREVIEW_CHOICE: PresentChoice = {
  title: "Preview here",
  description: "Show on this screen only",
};

export const PresentMenuButton = ({
  onGoLive,
  onPreview,
  goLive = GO_LIVE_CHOICE,
  preview = PREVIEW_CHOICE,
  label = "Present",
  disabled,
  title,
  fill,
  align = "start",
  children,
}: PresentMenuButtonProps) => {
  const { open, setOpen, hoverHandlers } = useHoverOpen(!disabled);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        asChild
        disabled={disabled}
        {...hoverHandlers}
        onPointerDown={(event) => {
          if (open && event.pointerType === "mouse") event.preventDefault();
        }}
      >
        {children ?? (
          <Button
            size="sm"
            disabled={disabled}
            title={title ?? label}
            className={cn(fill && "min-w-0 flex-1")}
          >
            <Play />
            {label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-67" {...hoverHandlers}>
        <PresentOption
          icon={MonitorUp}
          choice={goLive}
          highlighted
          onSelect={onGoLive}
        />
        <PresentOption
          icon={MonitorPlay}
          choice={preview}
          onSelect={onPreview}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface PresentMenuProps {
  onPresent: (options: PresentOptions) => void;
  label?: string;
  disabled?: boolean;
  title?: string;
  fill?: boolean;
  hints?: boolean;
  children?: ReactNode;
}

export const PresentMenu = ({
  onPresent,
  hints,
  ...button
}: PresentMenuProps) => {
  const present = usePresentActions(onPresent);

  return (
    <PresentMenuButton
      {...button}
      onGoLive={present.startLive}
      onPreview={present.startPreview}
      goLive={
        hints
          ? { ...GO_LIVE_CHOICE, hint: EDITOR_COMMANDS.goLive.hint }
          : GO_LIVE_CHOICE
      }
      preview={
        hints
          ? { ...PREVIEW_CHOICE, hint: EDITOR_COMMANDS.preview.hint }
          : PREVIEW_CHOICE
      }
    />
  );
};

interface PresentOptionProps {
  icon: LucideIcon;
  choice: PresentChoice;
  highlighted?: boolean;
  onSelect: () => void;
}

const PresentOption = ({
  icon: Icon,
  choice,
  highlighted,
  onSelect,
}: PresentOptionProps) => (
  <DropdownMenuItem
    onSelect={onSelect}
    className={cn("items-start py-2.5", highlighted && "focus:bg-primary/14")}
  >
    <Icon
      className={cn(
        "mt-0.5",
        highlighted ? "text-primary-soft!" : "text-muted-foreground",
      )}
    />
    <span className="min-w-0 flex-1">
      <span
        className={cn(
          "flex items-baseline justify-between gap-2 font-bold",
          highlighted ? "text-primary-soft" : "text-foreground",
        )}
      >
        {choice.title}
        {choice.hint && <Kbd>{choice.hint}</Kbd>}
      </span>
      <span className="block truncate text-[11.5px] leading-[1.45] text-muted-foreground">
        {choice.description}
      </span>
    </span>
  </DropdownMenuItem>
);
