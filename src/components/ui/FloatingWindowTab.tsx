import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import type {
  FloatingWindowEdge,
  FloatingWindowStash,
} from "../../hooks/useFloatingWindow";

const MIN_LENGTH = 64;
const EDGE_GAP = 8;
const DRAG_SLOP = 4;

const ARROW: Record<FloatingWindowEdge, LucideIcon> = {
  left: ChevronRight,
  right: ChevronLeft,
  top: ChevronDown,
  bottom: ChevronUp,
};

const EDGE_CLASSES: Record<FloatingWindowEdge, string> = {
  left: "left-0 rounded-r-[10px]",
  right: "right-0 rounded-l-[10px]",
  top: "top-0 rounded-b-[10px]",
  bottom: "bottom-0 rounded-t-[10px]",
};

interface FloatingWindowTabProps {
  stash: FloatingWindowStash;
  name: string;
  detail?: string;
  zIndex?: number;
}

export const FloatingWindowTab = ({
  stash,
  name,
  detail,
  zIndex,
}: FloatingWindowTabProps) => {
  const [length, setLength] = useState(MIN_LENGTH);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);
  const { edge, offset, restore, handleProps } = stash;
  const isVertical = edge === "left" || edge === "right";

  const measure = useCallback(
    (node: HTMLButtonElement | null) => {
      if (!node) return;
      setLength(isVertical ? node.offsetHeight : node.offsetWidth);
    },
    [isVertical],
  );

  if (!edge) return null;

  const limit = isVertical ? window.innerHeight : window.innerWidth;
  const along = Math.max(EDGE_GAP, Math.min(limit - length - EDGE_GAP, offset));
  const Arrow = ARROW[edge];
  const description = `${name}${detail ? ` (${detail})` : ""}. Click to bring it back, or drag to move it.`;

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    pressOrigin.current = { x: event.clientX, y: event.clientY };
    wasDragged.current = false;
    handleProps.onPointerDown(event);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const origin = pressOrigin.current;
    const travelled = origin
      ? Math.abs(event.clientX - origin.x) + Math.abs(event.clientY - origin.y)
      : 0;
    if (travelled > DRAG_SLOP) wasDragged.current = true;
    handleProps.onPointerMove(event);
  };

  const finishDrag = (end: () => void) => () => {
    pressOrigin.current = null;
    end();
  };

  return (
    <button
      key={`${edge}:${name}`}
      ref={measure}
      type="button"
      title={description}
      aria-label={description}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag(handleProps.onPointerUp)}
      onPointerCancel={finishDrag(handleProps.onPointerCancel)}
      onClick={() => {
        if (!wasDragged.current) restore();
      }}
      style={{
        ...handleProps.style,
        zIndex,
        ...(isVertical ? { top: along } : { left: along }),
      }}
      className={cn(
        "fixed flex items-center justify-center gap-1 border border-line bg-panel-solid text-sub shadow-overlay hover:text-fg",
        isVertical
          ? "max-h-42 min-h-16 w-6.5 flex-col py-2.25"
          : "h-6.5 max-w-42 min-w-16 flex-row px-2.25",
        EDGE_CLASSES[edge],
      )}
    >
      <Arrow size={14} className="shrink-0" />
      <span
        className={cn(
          "min-h-0 min-w-0 truncate text-[11.5px] leading-none font-bold tracking-[0.2px]",
          isVertical && "[writing-mode:vertical-rl]",
        )}
      >
        {name}
      </span>
    </button>
  );
};
