import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

interface MiniButtonProps {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export const MiniButton = ({
  icon: Icon,
  title,
  onClick,
  active,
  danger,
  disabled,
}: MiniButtonProps) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "grid size-7 shrink-0 place-items-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-45",
      active
        ? "border-accent/30 bg-accent/18"
        : "border-transparent bg-transparent",
      danger ? "text-danger" : active ? "text-accent-soft" : "text-sub",
    )}
  >
    <Icon size={15} />
  </button>
);
