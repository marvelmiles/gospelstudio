import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
    <TabsList variant="line" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);
