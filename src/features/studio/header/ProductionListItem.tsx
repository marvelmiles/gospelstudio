import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { MoreMenu } from "@/components/shared/MoreMenu";
import { activeMenuItemClassName } from "@/components/shared/menuItem";
import type { ProductionSummary } from "../types/production";

interface ProductionListItemProps {
  production: ProductionSummary;
  isOpen: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const sceneCountLabel = (count: number): string =>
  `${count} scene${count === 1 ? "" : "s"}`;

export const ProductionListItem = ({
  production,
  isOpen,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: ProductionListItemProps) => (
  <li
    className={cn(
      "flex items-center gap-1 rounded-md pr-1",
      isOpen ? activeMenuItemClassName : "hover:bg-accent",
    )}
  >
    <button
      type="button"
      onClick={onOpen}
      aria-current={isOpen ? "true" : undefined}
      className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pl-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Check
        size={16}
        aria-hidden
        className={cn("shrink-0", !isOpen && "invisible")}
      />
      <span className="min-w-0 flex-1 truncate">{production.name}</span>
      <span className="shrink-0 text-[11px] text-subtle-foreground">
        {sceneCountLabel(production.sceneCount)}
      </span>
    </button>
    <MoreMenu
      size="sm"
      title={`More actions for ${production.name}`}
      items={[
        { label: "Rename", icon: Pencil, onClick: onRename },
        { label: "Duplicate", icon: Copy, onClick: onDuplicate },
        { divider: true },
        {
          label: "Delete production",
          icon: Trash2,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  </li>
);
