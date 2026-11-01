import type { ShapeLayer } from "../types/layer";
import { withOpacity } from "../lib/colors";
import { SHAPES, outlinePoints } from "../lib/shapeCatalog";

export const ShapeElement = ({ layer }: { layer: ShapeLayer }) => {
  const { outline } = SHAPES[layer.shape];
  const fill = withOpacity(layer.fill, layer.fillOpacity);
  const hasBorder = layer.borderWidth > 0;

  if (!outline)
    return (
      <div
        style={{
          background: fill,
          border: hasBorder
            ? `${layer.borderWidth}px solid ${layer.borderColor}`
            : undefined,
          borderRadius: layer.shape === "ellipse" ? "50%" : "inherit",
        }}
        className="size-full"
      />
    );

  const { width, height } = layer.dimensions;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block size-full"
    >
      <polygon
        points={outlinePoints(outline, layer.dimensions, layer.borderWidth / 2)}
        fill={fill}
        stroke={hasBorder ? layer.borderColor : "none"}
        strokeWidth={layer.borderWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
};
