import type { LayerBorder } from "../types/layer";
import { hasBorder, paintCss } from "../lib/paint";

const RING_MASK =
  "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)";

interface BorderRingProps {
  border: LayerBorder;
  radius?: number | string;
}

export const BorderRing = ({ border, radius = "inherit" }: BorderRingProps) => {
  if (!hasBorder(border)) return null;
  return (
    <div
      aria-hidden
      style={{
        padding: border.width,
        borderRadius: radius,
        background: paintCss(border.color, border.gradient),
        mask: RING_MASK,
      }}
      className="pointer-events-none absolute inset-0"
    />
  );
};
