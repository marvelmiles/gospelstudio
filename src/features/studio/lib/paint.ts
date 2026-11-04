import type { CSSProperties } from "react";
import { isGradientValue } from "../../../lib/cssColors";
import type { Gradient, LayerBorder, LayerShadow } from "../types/layer";
import { withOpacity } from "./colors";

export const DEFAULT_GRADIENT: Gradient = { to: "#000000", angle: 180 };

export const NO_BORDER: LayerBorder = {
  width: 0,
  color: "#ffffff",
  gradient: null,
};

export const NO_SHADOW: LayerShadow = {
  blur: 0,
  distance: 0,
  color: "#000000",
  opacity: 60,
};

export const paintCss = (
  color: string,
  gradient: Gradient | null,
  opacity = 100,
): string => {
  if (isGradientValue(color)) return color;
  return gradient
    ? `linear-gradient(${gradient.angle}deg, ${withOpacity(color, opacity)}, ${withOpacity(gradient.to, opacity)})`
    : withOpacity(color, opacity);
};

export const paintStyle = (
  color: string,
  gradient: Gradient | null,
  opacity = 100,
): CSSProperties => ({
  background: paintCss(color, gradient, opacity),
  opacity: isGradientValue(color) && opacity < 100 ? opacity / 100 : undefined,
});

export const hasBorder = (border: LayerBorder): boolean => border.width > 0;

export const hasShadow = (shadow: LayerShadow): boolean =>
  shadow.blur > 0 || shadow.distance > 0;

export const shadowFilter = (shadow: LayerShadow): string | undefined =>
  hasShadow(shadow)
    ? `drop-shadow(0 ${shadow.distance}px ${shadow.blur}px ${withOpacity(shadow.color, shadow.opacity)})`
    : undefined;
