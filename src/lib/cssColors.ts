const GRADIENT_VALUE = /^\s*(repeating-)?(linear|radial|conic)-gradient\(/i;
const SIX_DIGIT_HEX = /^#[0-9a-f]{6}$/i;
const THREE_DIGIT_HEX = /^#[0-9a-f]{3}$/i;
const PICKER_FALLBACK = "#000000";

export const isGradientValue = (value: string): boolean =>
  GRADIENT_VALUE.test(value);

const supports = (property: string, value: string): boolean =>
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports(property, value);

export const isCssColor = (value: string): boolean =>
  value.trim() !== "" && supports("color", value.trim());

const isCssGradient = (value: string): boolean =>
  isGradientValue(value) && supports("background-image", value.trim());

export const isCssPaint = (value: string, allowGradient: boolean): boolean =>
  isCssColor(value) || (allowGradient && isCssGradient(value));

let paintContext: CanvasRenderingContext2D | null = null;

const normalizedColor = (value: string): string => {
  paintContext ??= document.createElement("canvas").getContext("2d");
  if (!paintContext) return PICKER_FALLBACK;
  paintContext.fillStyle = PICKER_FALLBACK;
  paintContext.fillStyle = value;
  return String(paintContext.fillStyle);
};

const channelHex = (channel: string): string =>
  Math.round(Number(channel)).toString(16).padStart(2, "0");

/* The native picker only understands #rrggbb, so any other colour is converted through a canvas, which normalises every CSS colour it can paint. */
export const pickerHex = (value: string): string => {
  const trimmed = value.trim();
  if (SIX_DIGIT_HEX.test(trimmed)) return trimmed.toLowerCase();
  if (THREE_DIGIT_HEX.test(trimmed))
    return `#${[...trimmed.slice(1)].map((digit) => digit + digit).join("")}`.toLowerCase();
  if (!isCssColor(trimmed)) return PICKER_FALLBACK;
  const normalized = normalizedColor(trimmed);
  if (SIX_DIGIT_HEX.test(normalized)) return normalized;
  const channels = normalized.match(/[\d.]+/g);
  return channels && channels.length >= 3
    ? `#${channels.slice(0, 3).map(channelHex).join("")}`
    : PICKER_FALLBACK;
};
