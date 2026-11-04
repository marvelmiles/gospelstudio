import type { CSSProperties } from "react";
import type { VerticalAlign } from "../../../types";
import { isGradientValue } from "../../../lib/cssColors";
import type { TextAppearance } from "../types/layer";

const TEXT_SHADOW =
  "0 2px 12px rgba(0, 0, 0, 0.65), 0 1px 3px rgba(0, 0, 0, 0.6)";

const GRADIENT_TEXT_SHADOW = "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))";

const JUSTIFY_BY_VERTICAL_ALIGN: Record<VerticalAlign, string> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

export const fontStack = (fontFamily: string): string =>
  `'${fontFamily}', 'Inter', system-ui, sans-serif`;

export const panelStyle = (text: TextAppearance): CSSProperties => ({
  padding: text.padding,
  justifyContent: JUSTIFY_BY_VERTICAL_ALIGN[text.verticalAlign],
});

/* A gradient is clipped to the letters, and its shadow becomes a filter because a text-shadow would paint over the clipped gradient. */
export const textPaint = (color: string, shadow: boolean): CSSProperties =>
  isGradientValue(color)
    ? {
        backgroundImage: color,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        filter: shadow ? GRADIENT_TEXT_SHADOW : undefined,
      }
    : { color, textShadow: shadow ? TEXT_SHADOW : undefined };

export const typeStyle = (text: TextAppearance): CSSProperties => ({
  fontFamily: fontStack(text.fontFamily),
  fontWeight: text.fontWeight,
  textAlign: text.align,
  hyphens: text.align === "justify" ? "auto" : undefined,
  lineHeight: text.lineHeight,
  textTransform: text.uppercase ? "uppercase" : undefined,
  ...textPaint(text.color, text.shadow),
});
