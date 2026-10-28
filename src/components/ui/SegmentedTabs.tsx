import type { LucideIcon } from "lucide-react";
import { formatCount } from "../../lib/formatNumber";
import { cn } from "../../lib/cn";
import { pillTabId, pillTabPanelId } from "./tabPanel";

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  idPrefix?: string;
  minSegmentWidth?: number;
}

export const SegmentedTabs = <T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  idPrefix,
  minSegmentWidth = 124,
}: SegmentedTabsProps<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    style={{
      gridTemplateColumns: `repeat(auto-fit,minmax(${minSegmentWidth}px,1fr))`,
    }}
    className="grid gap-1.25 rounded-[14px] border border-line bg-raise p-1.25"
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const active = value === tab.id;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active}
          id={idPrefix ? pillTabId(idPrefix, tab.id) : undefined}
          aria-controls={
            idPrefix ? pillTabPanelId(idPrefix, tab.id) : undefined
          }
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex min-w-0 items-center justify-center gap-2 rounded-[10px] border px-3 py-2.25 text-[12.5px] font-semibold",
            active
              ? "border-accent/42 bg-accent/18 text-accent-soft shadow-[inset_0_1px_0_rgb(59_130_246/0.2)]"
              : "border-transparent bg-transparent text-sub",
          )}
        >
          {Icon && <Icon size={15} className="shrink-0" />}
          <span className="truncate">{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                "min-w-5 shrink-0 rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums",
                active
                  ? "bg-accent-soft/22 text-accent-soft"
                  : "bg-fg/8 text-dim",
              )}
            >
              {formatCount(tab.count)}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
