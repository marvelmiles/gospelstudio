import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { formatCount, formatCountLabel } from "../../../lib/formatNumber";
import type { SyncActivityItem } from "../syncActivity";
import { SyncActivityRow, type SyncItemActions } from "./SyncActivityRow";

const PAGE_SIZE = 50;

interface SyncQueueSectionProps {
  title: string;
  icon: LucideIcon;
  info: string;
  items: readonly SyncActivityItem[];
  emptyMessage: string;
  actions: SyncItemActions;
}

export const SyncQueueSection = ({
  title,
  icon,
  info,
  items,
  emptyMessage,
  actions,
}: SyncQueueSectionProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hiddenCount = items.length - visibleCount;

  return (
    <Panel>
      <PanelTitle
        title={title}
        icon={icon}
        info={info}
        trailing={
          items.length > 0 && (
            <span className="text-[12.5px] text-muted-foreground tabular-nums">
              {formatCountLabel(items.length, "item")}
            </span>
          )
        }
      />
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {items.slice(0, visibleCount).map((item) => (
            <SyncActivityRow key={item.id} item={item} actions={actions} />
          ))}
        </ul>
      )}
      {hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          <ChevronDown />
          Show {formatCount(Math.min(PAGE_SIZE, hiddenCount))} more
        </Button>
      )}
    </Panel>
  );
};
