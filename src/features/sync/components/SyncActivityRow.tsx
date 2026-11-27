import { memo } from "react";
import { CircleStop, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import type { SyncActivityItem } from "../syncActivity";
import {
  SYNC_ITEM_KINDS,
  syncItemMeta,
  syncItemTitle,
} from "../syncItemLabels";
import { TransferProgress } from "./TransferProgress";

export interface SyncItemActions {
  pause(item: SyncActivityItem): void;
  resume(item: SyncActivityItem): void;
  retry(item: SyncActivityItem): void;
  stop(item: SyncActivityItem): void;
}

interface SyncActivityRowProps {
  item: SyncActivityItem;
  actions: SyncItemActions;
}

export const SyncActivityRow = memo(
  ({ item, actions }: SyncActivityRowProps) => {
    const title = syncItemTitle(item);
    const KindIcon = SYNC_ITEM_KINDS[item.kind].icon;
    const isPaused = item.status === "paused";
    const transferLabel = `${item.direction === "upload" ? "Uploading" : "Downloading"} ${title}`;

    return (
      <li className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              item.status === "failed"
                ? "bg-destructive/14 text-destructive"
                : "bg-primary/14 text-primary-soft",
              isPaused && "opacity-60",
            )}
          >
            <KindIcon size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div
              title={title}
              className="truncate text-[14px] font-semibold text-foreground"
            >
              {title}
            </div>
            <div className="text-[12.5px] leading-snug text-muted-foreground">
              {syncItemMeta(item)}
            </div>
            {item.status === "active" && (
              <TransferProgress label={transferLabel} />
            )}
            {item.status === "failed" && item.failure && (
              <p className="m-0 mt-1 text-[12.5px] leading-snug text-destructive">
                {item.failure.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 pl-12 sm:pl-0">
          {item.status === "failed" && (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`Try syncing ${title} again`}
              onClick={() => actions.retry(item)}
            >
              <RotateCcw />
              Retry
            </Button>
          )}
          {isPaused ? (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`Resume syncing ${title}`}
              onClick={() => actions.resume(item)}
            >
              <Play />
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Pause syncing ${title}`}
              onClick={() => actions.pause(item)}
            >
              <Pause />
              Pause
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Stop syncing ${title}`}
            className="enabled:hover:text-destructive"
            onClick={() => actions.stop(item)}
          >
            <CircleStop />
            Stop
          </Button>
        </div>
      </li>
    );
  },
);

SyncActivityRow.displayName = "SyncActivityRow";
