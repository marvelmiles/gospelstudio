import type { CSSProperties } from "react";
import type { VerticalAlign } from "../../../types";
import type { TextAppearance } from "../types/layer";

const TEXT_SHADOW =
  "0 2px 12px rgba(0, 0, 0, 0.65), 0 1px 3px rgba(0, 0, 0, 0.6)";

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

export const typeStyle = (text: TextAppearance): CSSProperties => ({
  fontFamily: fontStack(text.fontFamily),
  fontWeight: text.fontWeight,
  color: text.color,
  textAlign: text.align,
  lineHeight: text.lineHeight,
  textTransform: text.uppercase ? "uppercase" : undefined,
  textShadow: text.shadow ? TEXT_SHADOW : undefined,
});
