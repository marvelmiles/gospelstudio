import { cn } from "../../lib/cn";

export interface PanelTab<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
}

interface PanelTabsProps<T extends string> {
  tabs: PanelTab<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

export const PanelTabs = <T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: PanelTabsProps<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="flex border-b border-line"
  >
    {tabs.map((tab) => {
      const active = value === tab.id;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 border-0 border-b-2 bg-transparent py-3 text-[13px] font-semibold disabled:cursor-not-allowed",
            active
              ? "border-accent text-accent-soft"
              : "border-transparent text-sub disabled:text-dim",
          )}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);
