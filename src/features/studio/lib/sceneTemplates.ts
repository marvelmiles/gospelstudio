import type { CameraLayer, Layer, LayerFrame } from "../types/layer";
import { FULL_FRAME, percentFrame } from "./canvasCoordinates";
import { IMAGE_SIZE_PRESETS } from "./imagePresets";
import {
  DEFAULT_TEXT_APPEARANCE,
  createLayer,
  placement,
  textAppearance,
} from "./layerDefaults";
import { colorFill, fillOf } from "./layerFill";
import { textPresetPatch } from "./textPresets";

export interface TemplateContext {
  cameraSourceId: string | null;
  backgroundId: string | null;
}

export type TemplateGroup = "camera" | "content" | "worship";

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  group: TemplateGroup;
  background: string;
  build: (context: TemplateContext) => Layer[];
}

export const TEMPLATE_GROUP_LABELS: Record<TemplateGroup, string> = {
  camera: "Camera layouts",
  content: "Full-screen content",
  worship: "Worship and announcements",
};

const DARK_BACKGROUND = "#0b0f19";
const BLACK_BACKGROUND = "#000000";

const camera = (
  context: TemplateContext,
  frame = FULL_FRAME,
  overrides: Partial<Omit<CameraLayer, "id" | "type">> = {},
) =>
  createLayer("camera", {
    sourceId: context.cameraSourceId,
    ...placement(frame),
    ...overrides,
  });

const background = (context: TemplateContext) =>
  createLayer("background", { backgroundId: context.backgroundId });

const subtitle = (frame?: LayerFrame) => {
  const look = textPresetPatch("subtitle", DEFAULT_TEXT_APPEARANCE);
  return createLayer("text", {
    name: "Subtitle",
    content: "Type a caption here",
    ...look,
    ...(frame ? placement(frame) : {}),
  });
};

const pictureInPicture = (context: TemplateContext) =>
  camera(context, percentFrame(68, 63, 29, 31), {
    name: "Camera (small window)",
    radius: 24,
  });

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: "full-camera",
    name: "Full-screen camera",
    description: "The camera fills the whole screen.",
    group: "camera",
    background: BLACK_BACKGROUND,
    build: (context) => [camera(context)],
  },
  {
    id: "camera-bible",
    name: "Camera with Bible passage",
    description: "The preacher and the passage side by side.",
    group: "camera",
    background: DARK_BACKGROUND,
    build: (context) => [
      camera(context, percentFrame(1.7, 26.25, 47.5, 47.5), { radius: 24 }),
      createLayer("bible", {
        radius: 24,
        ...placement(percentFrame(50.8, 26.25, 47.5, 47.5)),
      }),
    ],
  },
  {
    id: "camera-manuscript",
    name: "Camera with manuscript",
    description: "The worship leader with the words over the picture.",
    group: "camera",
    background: BLACK_BACKGROUND,
    build: (context) => [
      camera(context),
      createLayer("manuscript", { fill: colorFill("#000000", 35) }),
    ],
  },
  {
    id: "camera-speaker",
    name: "Camera with speaker name",
    description: "A name and title slide in at the bottom left.",
    group: "camera",
    background: BLACK_BACKGROUND,
    build: (context) => [camera(context), createLayer("lowerThird")],
  },
  {
    id: "picture-in-picture",
    name: "Picture-in-picture",
    description:
      "A promo graphic fills the screen, the camera sits in a corner.",
    group: "camera",
    background: BLACK_BACKGROUND,
    build: (context) => [
      createLayer("image", {
        name: "Promo graphic",
        overrides: { fit: "cover" },
        ...placement(FULL_FRAME),
      }),
      pictureInPicture(context),
    ],
  },
  {
    id: "split-screen",
    name: "Split screen",
    description: "The camera on one half, an image or slide on the other.",
    group: "camera",
    background: DARK_BACKGROUND,
    build: (context) => [
      camera(context, percentFrame(0, 0, 50, 100), { keepAspect: false }),
      createLayer("image", {
        name: "Content",
        overrides: { fit: "cover" },
        ...placement(percentFrame(50, 0, 50, 100)),
      }),
    ],
  },
  {
    id: "scripture-subtitle",
    name: "Preacher with scripture and subtitle",
    description: "Camera, a passage at the top right and a caption below.",
    group: "camera",
    background: BLACK_BACKGROUND,
    build: (context) => [
      camera(context),
      createLayer("bible", {
        radius: 24,
        ...placement(percentFrame(60, 6, 36, 36)),
      }),
      subtitle(),
    ],
  },
  {
    id: "full-service",
    name: "Sermon with everything",
    description:
      "Moving background, camera, passage, logo, speaker name and a subtitle.",
    group: "camera",
    background: DARK_BACKGROUND,
    build: (context) => [
      background(context),
      camera(context, percentFrame(3, 6, 58, 70), {
        radius: 24,
        keepAspect: false,
      }),
      createLayer("bible", {
        radius: 24,
        ...placement(percentFrame(63, 6, 34, 34)),
      }),
      createLayer("image", {
        name: "Church logo",
        ...placement(IMAGE_SIZE_PRESETS.logo.frame),
      }),
      createLayer("lowerThird", {
        ...placement({ x: 60, y: 760, width: 860, height: 140 }),
      }),
      subtitle(percentFrame(25, 88, 72, 9)),
    ],
  },
  {
    id: "full-image",
    name: "Full-screen image",
    description: "One image fills the screen.",
    group: "content",
    background: BLACK_BACKGROUND,
    build: () => [
      createLayer("image", {
        overrides: { fit: "cover" },
        ...placement(FULL_FRAME),
      }),
    ],
  },
  {
    id: "full-video",
    name: "Full-screen video",
    description: "One video fills the screen.",
    group: "content",
    background: BLACK_BACKGROUND,
    build: () => [
      createLayer("video", {
        overrides: { fit: "cover" },
        ...placement(FULL_FRAME),
      }),
    ],
  },
  {
    id: "full-announcement",
    name: "Full-screen announcement",
    description: "A heading and details on a background.",
    group: "worship",
    background: DARK_BACKGROUND,
    build: (context) => [background(context), createLayer("announcement")],
  },
  {
    id: "new-converts",
    name: "Welcome new believers",
    description: "Heading, message, QR code, website and a small camera.",
    group: "worship",
    background: DARK_BACKGROUND,
    build: (context) => [
      background(context),
      createLayer("text", {
        name: "Heading",
        content: "Welcome to the family!",
        ...placement(percentFrame(5, 10, 58, 18)),
        text: textAppearance({ fontSize: 96, fontWeight: 800 }),
      }),
      createLayer("text", {
        name: "Message",
        content:
          "If you gave your life to Jesus today, we would love to pray with you and help you take your next step.",
        ...placement(percentFrame(5, 30, 54, 28)),
        text: textAppearance({
          fontSize: 44,
          fontWeight: 500,
          verticalAlign: "top",
          shadow: false,
        }),
      }),
      createLayer("text", {
        name: "Website",
        content: "yourchurch.org/next-steps",
        ...placement(percentFrame(5, 62, 54, 10)),
        text: textAppearance({
          fontSize: 48,
          fontWeight: 700,
          color: "#93c5fd",
          shadow: false,
        }),
      }),
      createLayer("qr", {
        ...placement(percentFrame(66, 10, 22, 50)),
        caption: "Scan to connect",
      }),
      pictureInPicture(context),
    ],
  },
  {
    id: "worship-manuscript",
    name: "Worship background with manuscript",
    description: "Big, centred words over a moving background.",
    group: "worship",
    background: DARK_BACKGROUND,
    build: (context) => [
      background(context),
      createLayer("manuscript", { fill: fillOf("none") }),
    ],
  },
  {
    id: "blank",
    name: "Blank scene",
    description: "Start from nothing and add what you need.",
    group: "content",
    background: BLACK_BACKGROUND,
    build: () => [],
  },
];

export const BLANK_TEMPLATE_ID = "blank";

export const findTemplate = (id: string): SceneTemplate | undefined =>
  SCENE_TEMPLATES.find((template) => template.id === id);
