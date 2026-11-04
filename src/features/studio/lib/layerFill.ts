import type { ResolvedBackground } from "../../../lib/resolve";
import type { FillKind, FilledLayer, Layer, LayerFill } from "../types/layer";

const BLANK_FILL: LayerFill = {
  kind: "none",
  color: "#000000",
  gradient: null,
  opacity: 60,
  imageId: null,
  videoId: null,
};

export const fillOf = (
  kind: FillKind,
  overrides: Partial<Omit<LayerFill, "kind">> = {},
): LayerFill => ({ ...BLANK_FILL, ...overrides, kind });

export const colorFill = (color: string, opacity: number): LayerFill =>
  fillOf("color", { color, opacity });

const FILLED_TYPES = new Set<Layer["type"]>([
  "bible",
  "manuscript",
  "text",
  "announcement",
  "lowerThird",
] satisfies FilledLayer["type"][]);

export const isFilledLayer = (layer: Layer): layer is FilledLayer =>
  FILLED_TYPES.has(layer.type);

export const backdropKeyOf = (
  fill: LayerFill,
  source: ResolvedBackground | null,
): string =>
  fill.kind === "source"
    ? `source:${source?.background.id ?? "none"}`
    : `fill:${fill.kind}`;
