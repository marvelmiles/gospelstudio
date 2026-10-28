import { useState } from "react";
import type { MouseEvent } from "react";
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
import { cn } from "../../lib/cn";
import { Popover } from "../ui/Popover";
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
        block && "rounded-[10px] border border-line bg-raise p-1.5",
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
          onClick={() => controller.toggle(name)}
        />
      ))}

      <Divider />

      <FormatButton
        icon={List}
        label={LIST_KIND_LABELS.bullet}
        active={list.kind === "bullet"}
        disabled={!controller.ready}
        onClick={() => controller.toggleList("bullet")}
      />
      <FormatButton
        icon={ListOrdered}
        label={LIST_KIND_LABELS.decimal}
        active={list.kind === "decimal"}
        disabled={!controller.ready}
        onClick={() => controller.toggleList("decimal")}
      />
      <Popover
        open={listMenu}
        onOpenChange={setListMenu}
        disabled={!controller.ready}
        align="start"
        trigger={
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
        }
      >
        <ListStyleMenu
          active={list.kind}
          onPick={(kind) => {
            controller.toggleList(kind);
            setListMenu(false);
          }}
        />
      </Popover>

      <FormatButton
        icon={IndentDecrease}
        label="Decrease indent (Shift+Tab)"
        disabled={!controller.ready || list.level === 0}
        onClick={controller.outdent}
      />
      <FormatButton
        icon={IndentIncrease}
        label="Increase indent (Tab)"
        disabled={!controller.ready}
        onClick={controller.indent}
      />

      <Divider />

      <FormatButton
        icon={RemoveFormatting}
        label="Clear formatting"
        disabled={!controller.ready}
        onClick={controller.clear}
      />
    </div>
  );
};

const Divider = () => (
  <span aria-hidden className="mx-0.75 h-4.5 w-px bg-line" />
);

interface ListStyleMenuProps {
  active: ListKind | null;
  onPick: (kind: ListKind) => void;
}

const ListStyleMenu = ({ active, onPick }: ListStyleMenuProps) => (
  <div
    role="menu"
    className="min-w-52 rounded-xl border border-line bg-panel-solid p-1.5 shadow-[0_18px_44px_rgb(0_0_0/0.45)]"
  >
    {ORDERED_LIST_KINDS.map((kind) => {
      const selected = active === kind;
      return (
        <button
          key={kind}
          role="menuitemradio"
          aria-checked={selected}
          onMouseDown={(event: MouseEvent) => event.preventDefault()}
          onClick={() => onPick(kind)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-lg border-none px-2.5 py-2 text-left text-[13px]",
            selected
              ? "bg-accent/16 text-accent-soft"
              : "bg-transparent text-fg hover:bg-raise",
          )}
        >
          {LIST_KIND_LABELS[kind]}
          <span className="text-xs text-dim tabular-nums">
            {LIST_SAMPLES[kind]}
          </span>
        </button>
      );
    })}
  </div>
);

interface FormatButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  narrow?: boolean;
  onClick?: () => void;
}

const FormatButton = ({
  icon: Icon,
  label,
  active,
  disabled,
  narrow,
  onClick,
}: FormatButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(event: MouseEvent) => event.preventDefault()}
    onClick={onClick}
    className={cn(
      "inline-flex h-7.5 items-center justify-center rounded-lg border transition-all duration-150 disabled:cursor-not-allowed",
      narrow ? "w-5.5" : "w-7.5",
      active
        ? "border-accent/32 bg-accent/18 text-accent-soft enabled:hover:bg-accent/24"
        : "border-transparent bg-transparent text-sub enabled:hover:bg-raise",
    )}
  >
    <Icon size={15} />
  </button>
);
