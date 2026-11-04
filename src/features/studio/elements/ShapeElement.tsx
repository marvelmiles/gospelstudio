import { useId, type CSSProperties } from "react";
import type { ShapeLayer } from "../types/layer";
import { hasBorder, paintCss, paintStyle } from "../lib/paint";
import { SHAPES, outlinePoints, type ShapeOutline } from "../lib/shapeCatalog";
import { BorderRing } from "./BorderRing";

export const ShapeElement = ({ layer }: { layer: ShapeLayer }) => {
  const { outline } = SHAPES[layer.shape];

  if (!outline) {
    const radius = layer.shape === "ellipse" ? "50%" : "inherit";
    return (
      <div style={{ borderRadius: radius }} className="relative size-full">
        <div
          style={{
            ...paintStyle(layer.fill, layer.gradient, layer.fillOpacity),
            borderRadius: radius,
          }}
          className="size-full"
        />
        <BorderRing border={layer.border} radius={radius} />
      </div>
    );
  }

  return <PolygonShape layer={layer} outline={outline} />;
};

interface PolygonShapeProps {
  layer: ShapeLayer;
  outline: ShapeOutline;
}

/* Fill and border are painted by HTML inside the SVG, clipped to the outline, so any CSS colour or gradient works on every shape. */
const PolygonShape = ({ layer, outline }: PolygonShapeProps) => {
  const id = useId();
  const fillId = `${id}-fill`;
  const strokeId = `${id}-stroke`;
  const { width, height } = layer.dimensions;
  const { border } = layer;
  const stroked = hasBorder(border);
  const points = outlinePoints(outline, layer.dimensions, border.width / 2);

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block size-full"
    >
      <defs>
        <clipPath id={fillId}>
          <polygon points={points} />
        </clipPath>
        {stroked && (
          <mask
            id={strokeId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
          >
            <polygon
              points={points}
              fill="none"
              stroke="#ffffff"
              strokeWidth={border.width}
              strokeLinejoin="round"
            />
          </mask>
        )}
      </defs>
      <PaintedArea
        width={width}
        height={height}
        clipPath={`url(#${fillId})`}
        style={paintStyle(layer.fill, layer.gradient, layer.fillOpacity)}
      />
      {stroked && (
        <PaintedArea
          width={width}
          height={height}
          mask={`url(#${strokeId})`}
          style={{ background: paintCss(border.color, border.gradient) }}
        />
      )}
    </svg>
  );
};

interface PaintedAreaProps {
  width: number;
  height: number;
  style: CSSProperties;
  clipPath?: string;
  mask?: string;
}

const PaintedArea = ({
  width,
  height,
  style,
  clipPath,
  mask,
}: PaintedAreaProps) => (
  <foreignObject
    x={0}
    y={0}
    width={width}
    height={height}
    clipPath={clipPath}
    mask={mask}
  >
    <div style={{ ...style, width: "100%", height: "100%" }} />
  </foreignObject>
);
