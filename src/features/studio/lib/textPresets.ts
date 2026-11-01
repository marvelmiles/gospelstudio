import type {
  LayerFill,
  LayerFrame,
  TextAppearance,
  TextLayer,
  TextPreset,
} from "../types/layer";
import { centeredFrame, percentFrame } from "./canvasCoordinates";
import { colorFill, fillOf } from "./layerFill";

interface TextPresetLook {
  label: string;
  hint: string;
  frame: LayerFrame;
  radius: number;
  fill: LayerFill;
  text: Partial<TextAppearance>;
}

export const TEXT_PRESETS: Record<TextPreset, TextPresetLook> = {
  body: {
    label: "Normal",
    hint: "Words in the middle of the screen",
    frame: centeredFrame({ width: 1100, height: 220 }),
    radius: 0,
    fill: fillOf("none"),
    text: {
      fontSize: 76,
      fontWeight: 700,
      align: "center",
      verticalAlign: "middle",
      shadow: true,
      padding: 32,
    },
  },
  heading: {
    label: "Heading",
    hint: "Big and bold across the top",
    frame: percentFrame(6, 6, 88, 16),
    radius: 0,
    fill: fillOf("none"),
    text: {
      fontSize: 104,
      fontWeight: 800,
      align: "center",
      verticalAlign: "middle",
      shadow: true,
      padding: 24,
    },
  },
  subtitle: {
    label: "Subtitle",
    hint: "A caption along the bottom",
    frame: percentFrame(10, 82, 80, 12),
    radius: 14,
    fill: colorFill("#000000", 72),
    text: {
      fontSize: 48,
      fontWeight: 600,
      align: "center",
      verticalAlign: "middle",
      shadow: false,
      padding: 18,
    },
  },
};

export const TEXT_PRESET_ORDER: TextPreset[] = ["body", "heading", "subtitle"];

type TextPresetPatch = Pick<
  TextLayer,
  "preset" | "radius" | "fill" | "text" | "position" | "dimensions"
>;

export const textPresetPatch = (
  preset: TextPreset,
  text: TextAppearance,
): TextPresetPatch => {
  const { frame, radius, fill, text: look } = TEXT_PRESETS[preset];
  return {
    preset,
    radius,
    fill,
    text: { ...text, ...look },
    position: { x: frame.x, y: frame.y },
    dimensions: { width: frame.width, height: frame.height },
  };
};
