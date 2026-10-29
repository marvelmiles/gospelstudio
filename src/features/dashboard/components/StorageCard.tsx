import { HardDrive } from "lucide-react";
import { getStorageLabel, type StorageInfo } from "../../../lib/storageStats";
import { cn } from "../../../lib/utils";

interface StorageCardProps {
  storage: StorageInfo;
}

const LEVEL_CLASSES: Record<
  StorageInfo["level"],
  { badge: string; bar: string; summary: string }
> = {
  critical: {
    badge: "bg-destructive/14 text-destructive",
    bar: "bg-destructive",
    summary: "Critical: free up space soon",
  },
  warn: {
    badge: "bg-warning/14 text-warning",
    bar: "bg-primary",
    summary: "Storage is filling up",
  },
  ok: {
    badge: "bg-success/14 text-success",
    bar: "bg-success",
    summary: "Plenty of space available",
  },
};

export const StorageCard = ({ storage }: StorageCardProps) => {
  const level = LEVEL_CLASSES[storage.level];
  return (
    <div className="mb-6.5 glass px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.75">
          <div
            className={cn(
              "grid size-9.5 shrink-0 place-items-center rounded-[11px]",
              level.badge,
            )}
          >
            <HardDrive size={19} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              Storage used
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {storage.blocked
                ? "Storage full. Delete manuscripts, audio or backgrounds to continue"
                : level.summary}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-[22px] leading-none font-semibold",
              storage.level === "critical"
                ? "text-destructive"
                : "text-foreground",
            )}
          >
            {Math.min(100, Math.round(storage.pct * 100))}%
          </div>
          <div className="mt-1 text-[11.5px] text-subtle-foreground">
            {getStorageLabel(storage)}
          </div>
        </div>
      </div>
      <div className="mt-3.25 h-2.25 overflow-hidden rounded-full bg-muted">
        <div
          style={{ width: `${Math.max(2, Math.min(100, storage.pct * 100))}%` }}
          className={cn(
            "h-full rounded-full transition-[width] duration-400",
            level.bar,
          )}
        />
      </div>
    </div>
  );
};
