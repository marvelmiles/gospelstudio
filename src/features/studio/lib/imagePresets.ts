import type { MediaFit } from "../../../types";
import type { LayerFrame } from "../types/layer";
import { FULL_FRAME, centeredFrame, percentFrame } from "./canvasCoordinates";

export type ImageSizePreset = "full" | "large" | "medium" | "logo";

interface ImageSizeLook {
  label: string;
  hint: string;
  frame: LayerFrame;
  fit: MediaFit;
}

export const IMAGE_SIZE_PRESETS: Record<ImageSizePreset, ImageSizeLook> = {
  full: {
    label: "Full",
    hint: "Fill the whole screen",
    frame: FULL_FRAME,
    fit: "cover",
  },
  large: {
    label: "Large",
    hint: "Big, in the middle",
    frame: centeredFrame({ width: 1440, height: 810 }),
    fit: "contain",
  },
  medium: {
    label: "Medium",
    hint: "Half size, in the middle",
    frame: centeredFrame({ width: 960, height: 540 }),
    fit: "contain",
  },
  logo: {
    label: "Logo",
    hint: "Small, in the top right corner",
    frame: percentFrame(86, 3, 11, 12),
    fit: "contain",
  },
};

export const IMAGE_SIZE_ORDER: ImageSizePreset[] = [
  "full",
  "large",
  "medium",
  "logo",
];

const sameFrame = (a: LayerFrame, b: LayerFrame): boolean =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

export const matchingSizePreset = (frame: LayerFrame): ImageSizePreset | "" =>
  IMAGE_SIZE_ORDER.find((preset) =>
    sameFrame(IMAGE_SIZE_PRESETS[preset].frame, frame),
  ) ?? "";
