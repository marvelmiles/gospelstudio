import type {
  CameraLayer,
  LayerBorder,
  LayerFrame,
  LayerShadow,
  ShapeLayer,
  TextAppearance,
} from "../types/layer";
import type { TemplateContext } from "./sceneTemplates";
import { FULL_FRAME } from "./canvasCoordinates";
import { IMAGE_SIZE_PRESETS } from "./imagePresets";
import { createLayer, placement, textAppearance } from "./layerDefaults";
import { colorFill, fillOf } from "./layerFill";

export const DARK_BACKGROUND = "#0b0f19";
export const BLACK_BACKGROUND = "#000000";

export const camera = (
  context: TemplateContext,
  frame = FULL_FRAME,
  overrides: Partial<Omit<CameraLayer, "id" | "type">> = {},
) =>
  createLayer("camera", {
    sourceId: context.cameraSourceId,
    ...placement(frame),
    ...overrides,
  });

export const background = (context: TemplateContext) =>
  createLayer("background", { backgroundId: context.backgroundId });

export const churchLogo = (frame = IMAGE_SIZE_PRESETS.logo.frame) =>
  createLayer("image", { name: "Church logo", ...placement(frame) });

export const coverImage = (name: string, mediaId: string | null = null) =>
  createLayer("image", {
    name,
    mediaId,
    overrides: { fit: "cover" },
    ...placement(FULL_FRAME),
  });

export const panel = (
  name: string,
  frame: LayerFrame,
  paint: string,
  overrides: Partial<Omit<ShapeLayer, "id" | "type">> = {},
) =>
  createLayer("shape", {
    name,
    fill: paint,
    ...placement(frame),
    ...overrides,
  });

export const wash = (name: string, paint: string, frame = FULL_FRAME) =>
  panel(name, frame, paint, { locked: true });

interface WordsOptions {
  frame: LayerFrame;
  text: Partial<TextAppearance>;
  paint?: string;
  radius?: number;
}

export const words = (
  name: string,
  content: string,
  { frame, text, paint, radius = 0 }: WordsOptions,
) =>
  createLayer("text", {
    name,
    content,
    radius,
    fill: paint ? colorFill(paint, 100) : fillOf("none"),
    text: textAppearance({ shadow: false, ...text }),
    ...placement(frame),
  });

interface TagOptions {
  frame: LayerFrame;
  paint: string;
  color: string;
  fontSize?: number;
  uppercase?: boolean;
}

export const tag = (
  name: string,
  content: string,
  { frame, paint, color, fontSize = 36, uppercase = true }: TagOptions,
) =>
  words(name, content, {
    frame,
    paint,
    radius: 10,
    text: {
      fontFamily: "Montserrat",
      fontSize,
      fontWeight: 800,
      color,
      align: "center",
      uppercase,
      lineHeight: 1.1,
      padding: 10,
    },
  });

export const dateTag = (x = 56, y = 900) => [
  tag("Day tag", "Day 1", {
    frame: { x, y, width: 170, height: 58 },
    paint: "linear-gradient(135deg, #fde047, #f59e0b)",
    color: "#111827",
    fontSize: 32,
  }),
  tag("Date tag", "Sunday service", {
    frame: { x, y: y + 64, width: 330, height: 58 },
    paint: "#ffffff",
    color: "#111827",
    fontSize: 28,
  }),
];

export const GOLD_FRAME: LayerBorder = {
  width: 10,
  color: "#fde68a",
  gradient: { to: "#b45309", angle: 135 },
};

export const LIFTED: LayerShadow = {
  blur: 40,
  distance: 14,
  color: "#000000",
  opacity: 55,
};

export const BOTTOM_SHADE =
  "linear-gradient(180deg, rgb(0 0 0 / 0) 0%, rgb(0 0 0 / 0.78) 100%)";
