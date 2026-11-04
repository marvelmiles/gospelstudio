import { isGradientValue } from "../../../lib/cssColors";

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const expandHex = (hex: string): string =>
  hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

const hexWithAlpha = (color: string, alpha: number): string => {
  const hex = expandHex(color);
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const withOpacity = (color: string, opacity: number): string => {
  const alpha = Math.min(Math.max(opacity, 0), 100) / 100;
  if (HEX_COLOR.test(color)) return hexWithAlpha(color, alpha);
  if (alpha === 1 || isGradientValue(color)) return color;
  return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
};
