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
  label = "Present",
  disabled,
  title,
  fill,
  hints,
  children,
}: PresentMenuProps) => {
  const present = usePresentActions(onPresent);
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
            title={title ?? "Present"}
            className={cn(fill && "min-w-0 flex-1")}
          >
            <Play />
            {label}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-67" {...hoverHandlers}>
        <PresentOption
          icon={MonitorUp}
          title="Go live"
          description="Project to the audience display"
          hint={hints ? EDITOR_COMMANDS.goLive.hint : undefined}
          highlighted
          onSelect={present.startLive}
        />
        <PresentOption
          icon={MonitorPlay}
          title="Preview here"
          description="Show on this screen only"
          hint={hints ? EDITOR_COMMANDS.preview.hint : undefined}
          onSelect={present.startPreview}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface PresentOptionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  highlighted?: boolean;
  onSelect: () => void;
}

const PresentOption = ({
  icon: Icon,
  title,
  description,
  hint,
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
        {title}
        {hint && <Kbd>{hint}</Kbd>}
      </span>
      <span className="block truncate text-[11.5px] leading-[1.45] text-muted-foreground">
        {description}
      </span>
    </span>
  </DropdownMenuItem>
);
