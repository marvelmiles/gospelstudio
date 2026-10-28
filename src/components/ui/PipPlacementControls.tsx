import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PipCorner, PipPlacement } from "../../types";
import {
  PIP_CORNER_LABELS,
  PIP_CORNERS,
  PIP_SIZE_MAX,
  PIP_SIZE_MIN,
} from "../../lib/pipPlacement";
import { cn } from "../../lib/cn";

const CORNER_ICONS: Record<PipCorner, LucideIcon> = {
  "top-left": ArrowUpLeft,
  "top-right": ArrowUpRight,
  "bottom-left": ArrowDownLeft,
  "bottom-right": ArrowDownRight,
};

interface PipPlacementControlsProps {
  placement: PipPlacement;
  onChange: (patch: Partial<PipPlacement>) => void;
  takenCorners?: PipCorner[];
  compact?: boolean;
}

const ControlLabel = ({ text }: { text: string }) => (
  <span className="text-[11px] font-bold tracking-[0.4px] text-dim uppercase">
    {text}
  </span>
);

export const PipPlacementControls = ({
  placement,
  onChange,
  takenCorners = [],
  compact,
}: PipPlacementControlsProps) => (
  <div className="flex flex-col gap-2.25">
    <div className="flex items-center gap-2.5">
      {!compact && <ControlLabel text="Position" />}
      <div className="flex gap-1.25">
        {PIP_CORNERS.map((corner) => {
          const Icon = CORNER_ICONS[corner];
          const active = placement.corner === corner;
          const taken = !active && takenCorners.includes(corner);
          return (
            <button
              key={corner}
              onClick={() => onChange({ corner })}
              title={
                taken
                  ? `${PIP_CORNER_LABELS[corner]} (shared with another window)`
                  : PIP_CORNER_LABELS[corner]
              }
              aria-label={PIP_CORNER_LABELS[corner]}
              aria-pressed={active}
              className={cn(
                "grid size-7.5 place-items-center rounded-lg border",
                active
                  ? "border-accent/36 bg-accent/18 text-accent-soft"
                  : "border-line bg-raise",
                !active && (taken ? "text-dim" : "text-sub"),
              )}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>
    </div>

    <div className="flex items-center gap-2.5">
      {!compact && <ControlLabel text="Size" />}
      <input
        type="range"
        className="slider min-w-22.5 flex-1"
        aria-label="Window size"
        min={PIP_SIZE_MIN}
        max={PIP_SIZE_MAX}
        value={placement.size}
        onChange={(event) => onChange({ size: Number(event.target.value) })}
      />
      <span className="min-w-8.5 text-right text-[11.5px] font-bold text-sub tabular-nums">
        {placement.size}%
      </span>
    </div>
  </div>
);
