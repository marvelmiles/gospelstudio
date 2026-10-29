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
import { cn } from "../../lib/utils";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  <span className="text-[11px] font-bold tracking-[0.4px] text-subtle-foreground uppercase">
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
      <ToggleGroup
        type="single"
        aria-label="Window position"
        value={placement.corner}
        onValueChange={(corner) =>
          corner && onChange({ corner: corner as PipCorner })
        }
        spacing={1.25}
      >
        {PIP_CORNERS.map((corner) => {
          const Icon = CORNER_ICONS[corner];
          const taken =
            placement.corner !== corner && takenCorners.includes(corner);
          return (
            <ToggleGroupItem
              key={corner}
              value={corner}
              title={
                taken
                  ? `${PIP_CORNER_LABELS[corner]} (shared with another window)`
                  : PIP_CORNER_LABELS[corner]
              }
              aria-label={PIP_CORNER_LABELS[corner]}
              className={cn(
                "size-7.5 border bg-secondary px-0 data-[state=on]:border-primary/36",
                taken && "text-subtle-foreground",
              )}
            >
              <Icon className="size-3.75" />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>

    <div className="flex items-center gap-2.5">
      {!compact && <ControlLabel text="Size" />}
      <Slider
        className="min-w-22.5 flex-1"
        aria-label="Window size"
        min={PIP_SIZE_MIN}
        max={PIP_SIZE_MAX}
        value={[placement.size]}
        onValueChange={([size]) => onChange({ size })}
      />
      <span className="min-w-8.5 text-right text-[11.5px] font-bold text-muted-foreground tabular-nums">
        {placement.size}%
      </span>
    </div>
  </div>
);
