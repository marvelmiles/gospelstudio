import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { pillTabId, pillTabPanelId } from "./tabPanel";

export interface PillTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface PillTabsProps<T extends string> {
  tabs: PillTab<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  idPrefix?: string;
}

const pillClassName = (active: boolean): string =>
  cn(
    "inline-flex cursor-pointer items-center gap-1.75 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap",
    active
      ? "border-accent/45 bg-accent/16 text-accent-soft"
      : "border-line bg-transparent text-sub",
  );

export const PillTabs = <T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  idPrefix,
}: PillTabsProps<T>) => (
  <div
    className="flex flex-wrap items-center gap-1.75"
    role="tablist"
    aria-label={ariaLabel}
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
          className={pillClassName(active)}
        >
          {Icon && <Icon size={14} />}
          {tab.label}
        </button>
      );
    })}
  </div>
);
