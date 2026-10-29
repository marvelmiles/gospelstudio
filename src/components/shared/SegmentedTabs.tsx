import type { LucideIcon } from "lucide-react";
import { formatCount } from "../../lib/formatNumber";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { externalPanelProps } from "./tabPanel";

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
  <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
    <TabsList
      variant="segmented"
      aria-label={ariaLabel}
      style={{
        gridTemplateColumns: `repeat(auto-fit,minmax(${minSegmentWidth}px,1fr))`,
      }}
    >
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className="group/tab"
          {...externalPanelProps(idPrefix, tab.id)}
        >
          {tab.icon && <tab.icon />}
          <span className="truncate">{tab.label}</span>
          {tab.count !== undefined && (
            <span className="min-w-5 shrink-0 rounded-full bg-foreground/8 px-1.5 py-px text-[11px] font-bold text-subtle-foreground tabular-nums group-data-[state=active]/tab:bg-primary-soft/22 group-data-[state=active]/tab:text-primary-soft">
              {formatCount(tab.count)}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
