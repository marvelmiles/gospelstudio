import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";

interface AssetTileProps {
  id: string;
  name: string;
  preview: ReactNode;
  highlighted: boolean;
  detail?: ReactNode;
  overlayActions?: ReactNode;
  footerAction?: ReactNode;
}

export const AssetTile = ({
  id,
  name,
  preview,
  highlighted,
  detail,
  overlayActions,
  footerAction,
}: AssetTileProps) => (
  <div
    {...attentionAttribute(id)}
    className={cn(
      "group/tile relative rounded-[11px]",
      highlighted && ATTENTION_CLASS,
    )}
  >
    <div className="relative aspect-video overflow-hidden rounded-[9px] border border-border bg-black">
      {preview}
      {overlayActions && (
        <div className="absolute top-1.5 right-1.5 flex gap-1.25 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within/tile:opacity-100 sm:group-hover/tile:opacity-100">
          {overlayActions}
        </div>
      )}
    </div>
    <div className="mt-1.5 flex items-center justify-between gap-1.5">
      <div className="min-w-0">
        <div className="truncate text-xs text-foreground">{name}</div>
        {detail && (
          <div className="truncate text-[11.5px] text-muted-foreground tabular-nums">
            {detail}
          </div>
        )}
      </div>
      {footerAction}
    </div>
  </div>
);
