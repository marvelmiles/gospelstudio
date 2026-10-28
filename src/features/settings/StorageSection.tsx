import { SectionTitle } from "../../components/ui/Field";
import { getStorageLabel, type StorageInfo } from "../../lib/storageStats";
import { cn } from "../../lib/cn";

const BAR_CLASSES: Record<StorageInfo["level"], string> = {
  critical: "from-danger to-danger-fg",
  warn: "from-warning to-warning-fg",
  ok: "from-success to-success-fg",
};

export const StorageSection = ({ storage }: { storage: StorageInfo }) => {
  const usedPercent = Math.min(100, Math.round(storage.pct * 100));

  return (
    <>
      <SectionTitle>Storage</SectionTitle>
      <div className="mb-4.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5">
          <div
            className={cn(
              "text-xl leading-none font-semibold",
              storage.level === "critical" ? "text-danger" : "text-fg",
            )}
          >
            {usedPercent}%
          </div>
          <div className="text-xs text-sub">{getStorageLabel(storage)}</div>
        </div>
        <div className="mt-2.25 h-1.75 overflow-hidden rounded-full bg-raise">
          <div
            style={{ width: `${Math.max(2, usedPercent)}%` }}
            className={cn(
              "h-full rounded-full bg-linear-to-r transition-[width] duration-400",
              BAR_CLASSES[storage.level],
            )}
          />
        </div>
      </div>
    </>
  );
};
