import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "./Button";
import { Popover } from "./Popover";
import type { PopoverAlign, PopoverSide } from "./Popover";

export interface MoreMenuItem {
  label?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  divider?: boolean;
}

interface MoreMenuProps {
  items: MoreMenuItem[];
  title?: string;
  side?: PopoverSide;
  align?: PopoverAlign;
  size?: "sm" | "md";
  filled?: boolean;
}

export const menuSurfaceClassName =
  "rounded-xl border border-line bg-panel-solid/97 p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.55)] backdrop-blur-[18px] backdrop-saturate-150";

export const MoreMenu = ({
  items,
  title = "More actions",
  side = "bottom",
  align = "end",
  size = "md",
  filled,
}: MoreMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side={side}
      align={align}
      trigger={
        <IconButton
          icon={MoreHorizontal}
          title={title}
          active={open}
          size={size}
          filled={filled}
        />
      }
    >
      <div role="menu" className={cn(menuSurfaceClassName, "min-w-52.5")}>
        {items.map((item, index) =>
          item.divider ? (
            <div key={index} className="mx-2 my-1.25 h-px bg-line" />
          ) : (
            <MoreMenuButton
              key={index}
              item={item}
              onDone={() => setOpen(false)}
            />
          ),
        )}
      </div>
    </Popover>
  );
};

const MoreMenuButton = ({
  item,
  onDone,
}: {
  item: MoreMenuItem;
  onDone: () => void;
}) => {
  const Icon = item.icon;
  return (
    <button
      role="menuitem"
      title={item.title}
      disabled={item.disabled}
      onClick={() => {
        item.onClick?.();
        onDone();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[9px] border-none px-2.75 py-2.25 text-left text-[13.5px] font-semibold disabled:cursor-not-allowed disabled:text-dim",
        item.active ? "bg-accent/12" : "bg-transparent",
        item.danger
          ? "text-danger enabled:hover:bg-danger/12"
          : item.active
            ? "text-accent-soft enabled:hover:bg-accent/20"
            : "text-fg enabled:hover:bg-raise",
      )}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      {item.label}
    </button>
  );
};
