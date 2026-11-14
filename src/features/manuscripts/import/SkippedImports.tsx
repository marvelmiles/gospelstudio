import { ChevronDown } from "lucide-react";
import { formatCountLabel } from "../../../lib/formatNumber";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SKIP_REASON_LABELS } from "./importLabels";
import type { SkippedImport } from "./useManuscriptImport";

interface SkippedImportsProps {
  items: SkippedImport[];
}

export const SkippedImports = ({ items }: SkippedImportsProps) => {
  if (!items.length) return null;

  return (
    <Collapsible className="mt-3.5">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2.5 [&[data-state=open]>svg]:rotate-180"
        >
          <ChevronDown className="transition-transform" />
          {formatCountLabel(items.length, "item")} left out
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="m-0 mt-1.5 flex list-none flex-col gap-1.5 p-0">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg bg-secondary/40 px-3 py-2 text-[12.5px]"
            >
              <span
                className="min-w-0 flex-[1_1_160px] truncate text-foreground"
                title={item.name}
              >
                {item.name}
              </span>
              <span className="text-subtle-foreground">
                {SKIP_REASON_LABELS[item.reason]}
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};
