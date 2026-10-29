import { useState } from "react";
import type { ComponentProps, MouseEvent } from "react";
import {
  Bold,
  ChevronDown,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { INLINE_FORMATS } from "../../lib/textFormatting";
import type { InlineFormatName } from "../../lib/textFormatting";
import { LIST_KIND_LABELS, ORDERED_LIST_KINDS } from "../../lib/lists";
import type { ListKind } from "../../lib/lists";
import type { TextFormattingController } from "../../hooks/useTextFormatting";

const ICONS: Record<InlineFormatName, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  highlight: Highlighter,
};

const ORDER: InlineFormatName[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "highlight",
];

const LIST_SAMPLES: Record<ListKind, string> = {
  bullet: "•",
  decimal: "1. 2. 3.",
  "lower-alpha": "a. b. c.",
  "upper-alpha": "A. B. C.",
  "lower-roman": "i. ii. iii.",
  "upper-roman": "I. II. III.",
};

interface FormatToolbarProps {
  controller: TextFormattingController;
  block?: boolean;
  className?: string;
}

export const FormatToolbar = ({
  controller,
  block,
  className,
}: FormatToolbarProps) => {
  const [listMenu, setListMenu] = useState(false);
  const { list } = controller;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className={cn(
        "flex flex-wrap items-center gap-1",
        block && "rounded-[10px] border border-border bg-secondary p-1.5",
        !controller.ready && "opacity-50",
        className,
      )}
    >
      {ORDER.map((name) => (
        <FormatButton
          key={name}
          icon={ICONS[name]}
          label={`${INLINE_FORMATS[name].label} (${INLINE_FORMATS[name].shortcutHint})`}
          active={controller.isActive(name)}
          disabled={!controller.ready}
          onToggle={() => controller.toggle(name)}
        />
      ))}

      <Divider />

      <FormatButton
        icon={List}
        label={LIST_KIND_LABELS.bullet}
        active={list.kind === "bullet"}
        disabled={!controller.ready}
        onToggle={() => controller.toggleList("bullet")}
      />
      <FormatButton
        icon={ListOrdered}
        label={LIST_KIND_LABELS.decimal}
        active={list.kind === "decimal"}
        disabled={!controller.ready}
        onToggle={() => controller.toggleList("decimal")}
      />
      <Popover open={listMenu} onOpenChange={setListMenu}>
        <PopoverTrigger asChild disabled={!controller.ready}>
          <FormatButton
            icon={ChevronDown}
            label="More list styles"
            narrow
            active={
              list.kind !== null &&
              list.kind !== "bullet" &&
              list.kind !== "decimal"
            }
            disabled={!controller.ready}
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          role="menu"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="w-auto min-w-52 p-1.5"
        >
          <ListStyleMenu
            active={list.kind}
            onPick={(kind) => {
              controller.toggleList(kind);
              setListMenu(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <FormatButton
        icon={IndentDecrease}
        label="Decrease indent (Shift+Tab)"
        disabled={!controller.ready || list.level === 0}
        onToggle={controller.outdent}
      />
      <FormatButton
        icon={IndentIncrease}
        label="Increase indent (Tab)"
        disabled={!controller.ready}
        onToggle={controller.indent}
      />

      <Divider />

      <FormatButton
        icon={RemoveFormatting}
        label="Clear formatting"
        disabled={!controller.ready}
        onToggle={controller.clear}
      />
    </div>
  );
};

const Divider = () => (
  <Separator
    orientation="vertical"
    className="mx-0.75 data-[orientation=vertical]:h-4.5"
  />
);

interface ListStyleMenuProps {
  active: ListKind | null;
  onPick: (kind: ListKind) => void;
}

const ListStyleMenu = ({ active, onPick }: ListStyleMenuProps) => (
  <>
    {ORDERED_LIST_KINDS.map((kind) => {
      const selected = active === kind;
      return (
        <Button
          key={kind}
          variant="ghost"
          size="sm"
          role="menuitemradio"
          aria-checked={selected}
          onMouseDown={(event: MouseEvent) => event.preventDefault()}
          onClick={() => onPick(kind)}
          className={cn(
            "w-full justify-between gap-3 text-[13px] font-normal",
            selected ? "bg-primary/16 text-primary-soft" : "text-foreground",
          )}
        >
          {LIST_KIND_LABELS[kind]}
          <span className="text-xs text-subtle-foreground tabular-nums">
            {LIST_SAMPLES[kind]}
          </span>
        </Button>
      );
    })}
  </>
);

interface FormatButtonProps extends Omit<
  ComponentProps<typeof Toggle>,
  "onToggle"
> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  narrow?: boolean;
  onToggle?: () => void;
}

const FormatButton = ({
  icon: Icon,
  label,
  active,
  disabled,
  narrow,
  onToggle,
  ...props
}: FormatButtonProps) => (
  <Toggle
    size="sm"
    title={label}
    aria-label={label}
    pressed={Boolean(active)}
    disabled={disabled}
    onMouseDown={(event: MouseEvent) => event.preventDefault()}
    onPressedChange={() => onToggle?.()}
    className={cn("h-7.5 min-w-0", narrow ? "w-5.5" : "w-7.5")}
    {...props}
  >
    <Icon className="size-3.75" />
  </Toggle>
);
