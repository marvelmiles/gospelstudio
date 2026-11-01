import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContentPickerRowProps {
  icon: LucideIcon;
  name: string | null;
  emptyLabel: string;
  actionLabel: string;
  onPick: () => void;
}

export const ContentPickerRow = ({
  icon: Icon,
  name,
  emptyLabel,
  actionLabel,
  onPick,
}: ContentPickerRowProps) => (
  <div className="flex items-center gap-2.5 rounded-[11px] border border-border bg-background p-2">
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary-soft">
      <Icon size={16} />
    </span>
    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
      {name ?? <span className="text-muted-foreground">{emptyLabel}</span>}
    </span>
    <Button size="sm" variant={name ? "secondary" : "default"} onClick={onPick}>
      {actionLabel}
    </Button>
  </div>
);
