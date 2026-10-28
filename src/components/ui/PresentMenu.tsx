import { useState, type ReactNode } from "react";
import { MonitorPlay, MonitorUp, Play } from "lucide-react";
import {
  usePresentActions,
  type PresentOptions,
} from "../../hooks/usePresentActions";
import { EDITOR_COMMANDS } from "../../lib/shortcuts";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import { Popover } from "./Popover";
import { menuSurfaceClassName } from "./MoreMenu";

interface PresentMenuProps {
  onPresent: (options: PresentOptions) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "ghost" | "subtle";
  disabled?: boolean;
  title?: string;
  fill?: boolean;
  hints?: boolean;
  children?: ReactNode;
}

export const PresentMenu = ({
  onPresent,
  label = "Present",
  size = "sm",
  variant = "primary",
  disabled,
  title,
  fill,
  hints,
  children,
}: PresentMenuProps) => {
  const present = usePresentActions(onPresent);
  const [open, setOpen] = useState(false);

  const startLive = () => {
    setOpen(false);
    present.startLive();
  };

  const startPreview = () => {
    setOpen(false);
    present.startPreview();
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      openOnHover
      disabled={disabled}
      side="bottom"
      align="start"
      triggerClassName={fill ? "min-w-0 flex-1" : undefined}
      trigger={
        children ?? (
          <Button
            size={size}
            variant={variant}
            disabled={disabled}
            title={title ?? "Present"}
            className={fill ? "w-full" : undefined}
          >
            <Play size={size === "sm" ? 13 : 14} />
            {label}
          </Button>
        )
      }
    >
      <div
        role="menu"
        className={cn(menuSurfaceClassName, "w-67 shadow-overlay")}
      >
        <MenuOption
          icon={MonitorUp}
          title="Go live"
          description="Project to the audience display"
          hint={hints ? EDITOR_COMMANDS.goLive.hint : undefined}
          accent
          onClick={startLive}
        />
        <MenuOption
          icon={MonitorPlay}
          title="Preview here"
          description="Show on this screen only"
          hint={hints ? EDITOR_COMMANDS.preview.hint : undefined}
          onClick={startPreview}
        />
      </div>
    </Popover>
  );
};

const MenuOption = ({
  icon: Icon,
  title: optionTitle,
  description,
  hint,
  accent,
  onClick,
}: {
  icon: typeof MonitorUp;
  title: string;
  description: string;
  hint?: string;
  accent?: boolean;
  onClick: () => void;
}) => (
  <button
    role="menuitem"
    onClick={onClick}
    className={cn(
      "flex w-full items-start gap-2.5 rounded-[9px] border-none bg-transparent px-2.75 py-2.5 text-left text-fg",
      accent ? "hover:bg-accent/14" : "hover:bg-white/5",
    )}
  >
    <Icon
      size={16}
      className={cn(
        "mt-0.5 shrink-0",
        accent ? "text-accent-soft" : "text-sub",
      )}
    />
    <span className="min-w-0 flex-1">
      <span
        className={cn(
          "flex items-baseline justify-between gap-2 text-[13.5px] font-bold",
          accent ? "text-accent-soft" : "text-fg",
        )}
      >
        {optionTitle}
        {hint && <KeyHint>{hint}</KeyHint>}
      </span>
      <span className="block truncate text-[11.5px] leading-[1.45] text-sub">
        {description}
      </span>
    </span>
  </button>
);

const KeyHint = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-[5px] border border-line bg-fg/7 px-1.25 py-0.5 font-mono text-[10.5px] font-semibold whitespace-nowrap text-dim">
    {children}
  </kbd>
);
