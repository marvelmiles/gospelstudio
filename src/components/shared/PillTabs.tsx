import type { LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { externalPanelProps } from "./tabPanel";

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

export const PillTabs = <T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  idPrefix,
}: PillTabsProps<T>) => (
  <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
    <TabsList variant="pill" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className="gap-1.75"
          {...externalPanelProps(idPrefix, tab.id)}
        >
          {tab.icon && <tab.icon className="size-3.5" />}
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
