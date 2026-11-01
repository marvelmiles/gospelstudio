import { cn } from "../../../lib/utils";
import type { ShapeKind } from "../types/layer";
import { SHAPES, SHAPE_ORDER, outlinePoints } from "../lib/shapeCatalog";

const ICON_BOX = { width: 40, height: 40 };

const ShapeIcon = ({ shape }: { shape: ShapeKind }) => {
  const { outline } = SHAPES[shape];
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${ICON_BOX.width} ${ICON_BOX.height}`}
      className="size-9"
    >
      {shape === "rectangle" && (
        <rect x="2" y="8" width="36" height="24" rx="4" fill="currentColor" />
      )}
      {shape === "ellipse" && (
        <circle cx="20" cy="20" r="18" fill="currentColor" />
      )}
      {outline && (
        <polygon
          points={outlinePoints(outline, ICON_BOX, 2)}
          fill="currentColor"
        />
      )}
    </svg>
  );
};

interface ShapeGridProps {
  value?: ShapeKind;
  onChoose: (shape: ShapeKind) => void;
}

export const ShapeGrid = ({ value, onChoose }: ShapeGridProps) => (
  <div
    role={value ? "radiogroup" : undefined}
    aria-label="Shapes"
    className="grid grid-cols-3 gap-1.5"
  >
    {SHAPE_ORDER.map((shape) => {
      const isActive = shape === value;
      return (
        <button
          key={shape}
          type="button"
          role={value ? "radio" : undefined}
          aria-checked={value ? isActive : undefined}
          onClick={() => onChoose(shape)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11.5px] font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isActive
              ? "border-primary/60 bg-primary/14 text-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/45 hover:text-foreground",
          )}
        >
          <span
            className={cn(
              isActive ? "text-primary-soft" : "text-primary-soft/80",
            )}
          >
            <ShapeIcon shape={shape} />
          </span>
          {SHAPES[shape].label}
        </button>
      );
    })}
  </div>
);
