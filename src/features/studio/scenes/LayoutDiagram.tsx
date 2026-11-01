import { memo } from "react";
import { cn } from "../../../lib/utils";
import type { Layer } from "../types/layer";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../lib/canvasCoordinates";
import { LAYER_ICONS, LAYER_TINTS } from "../lib/layerCatalog";

const percent = (value: number, total: number): string =>
  `${(value / total) * 100}%`;

export const LayoutDiagram = memo(
  ({
    layers,
    background,
    className,
  }: {
    layers: Layer[];
    background: string;
    className?: string;
  }) => (
    <div
      aria-hidden
      style={{ background }}
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-md border border-white/8",
        className,
      )}
    >
      {layers
        .filter((layer) => layer.visible)
        .map((layer) => {
          const Icon = LAYER_ICONS[layer.type];
          return (
            <span
              key={layer.id}
              style={{
                left: percent(layer.position.x, CANVAS_WIDTH),
                top: percent(layer.position.y, CANVAS_HEIGHT),
                width: percent(layer.dimensions.width, CANVAS_WIDTH),
                height: percent(layer.dimensions.height, CANVAS_HEIGHT),
              }}
              className={cn(
                "absolute grid place-items-center overflow-hidden rounded-[3px] border border-white/25 text-white/80",
                LAYER_TINTS[layer.type],
              )}
            >
              <Icon className="size-[min(14px,60%)]" />
            </span>
          );
        })}
    </div>
  ),
);

LayoutDiagram.displayName = "LayoutDiagram";
