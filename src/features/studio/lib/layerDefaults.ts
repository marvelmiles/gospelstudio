import { uid } from "../../../lib/id";
import type {
  LayerAnimation,
  LayerEntrance,
  LayerFrame,
  LayerOfType,
  LayerType,
  TextAppearance,
} from "../types/layer";
import {
  FULL_FRAME,
  centeredFrame,
  offsetFrame,
  percentFrame,
} from "./canvasCoordinates";
import { colorFill, fillOf } from "./layerFill";
import { NO_BORDER, NO_SHADOW } from "./paint";
import { textPresetPatch } from "./textPresets";

const DEFAULT_ENTRANCE_MS = 450;
const PANEL_COLOR = "#0b0f19";

export const DEFAULT_TEXT_APPEARANCE: TextAppearance = {
  fontFamily: "Outfit",
  fontSize: 56,
  fontWeight: 600,
  color: "#ffffff",
  align: "left",
  verticalAlign: "middle",
  lineHeight: 1.35,
  uppercase: false,
  shadow: true,
  padding: 32,
};

export const LAYER_NAMES: Record<LayerType, string> = {
  camera: "Camera",
  bible: "Bible passage",
  manuscript: "Manuscript",
  text: "Text",
  image: "Image",
  video: "Video",
  announcement: "Announcement",
  lowerThird: "Lower third",
  qr: "QR code",
  shape: "Shape",
  background: "Background",
};

export const textAppearance = (
  overrides: Partial<TextAppearance>,
): TextAppearance => ({
  ...DEFAULT_TEXT_APPEARANCE,
  ...overrides,
});

const animation = (entrance: LayerEntrance): LayerAnimation => ({
  entrance,
  durationMs: DEFAULT_ENTRANCE_MS,
});

export const placement = (frame: LayerFrame) => ({
  position: { x: frame.x, y: frame.y },
  dimensions: { width: frame.width, height: frame.height },
});

const base = (type: LayerType, frame: LayerFrame, entrance: LayerEntrance) => ({
  id: uid(),
  name: LAYER_NAMES[type],
  visible: true,
  locked: false,
  ...placement(frame),
  opacity: 100,
  rotation: 0,
  radius: 0,
  corners: null,
  border: { ...NO_BORDER },
  shadow: { ...NO_SHADOW },
  animation: animation(entrance),
});

type LayerBuilders = { [K in LayerType]: () => LayerOfType<K> };

const BUILDERS: LayerBuilders = {
  camera: () => ({
    ...base("camera", FULL_FRAME, "none"),
    type: "camera",
    sourceId: null,
    fit: "cover",
    mirror: false,
    muted: false,
    keepAspect: true,
  }),
  bible: () => ({
    ...base("bible", FULL_FRAME, "fade"),
    type: "bible",
    passageId: null,
    passage: null,
    slideIndex: 0,
    fill: fillOf("source", { opacity: 55 }),
  }),
  manuscript: () => ({
    ...base("manuscript", FULL_FRAME, "fade"),
    type: "manuscript",
    manuscriptId: null,
    manuscript: null,
    slideIndex: 0,
    fill: fillOf("source", { opacity: 55 }),
  }),
  text: () => ({
    ...base("text", FULL_FRAME, "fade"),
    type: "text",
    content: "Your text here",
    ...textPresetPatch("body", DEFAULT_TEXT_APPEARANCE),
  }),
  image: () => ({
    ...base("image", centeredFrame({ width: 960, height: 540 }), "fade"),
    type: "image",
    mediaId: null,
    overrides: {},
    focusX: 50,
    focusY: 50,
    zoom: 100,
  }),
  video: () => ({
    ...base("video", centeredFrame({ width: 960, height: 540 }), "fade"),
    type: "video",
    mediaId: null,
    overrides: {},
    autoplay: true,
    playback: { playing: true, restartToken: 0 },
  }),
  announcement: () => ({
    ...base("announcement", percentFrame(8, 12, 84, 76), "zoom"),
    type: "announcement",
    radius: 32,
    variant: "card",
    heading: "Join us this Sunday",
    body: "Worship starts at 9am. Everyone is welcome.",
    detail: "",
    accent: "#2563eb",
    tickerSeconds: 14,
    fill: colorFill(PANEL_COLOR, 92),
    text: textAppearance({
      fontFamily: "Sora",
      fontSize: 48,
      fontWeight: 500,
      align: "center",
      shadow: false,
      padding: 72,
    }),
  }),
  lowerThird: () => ({
    ...base(
      "lowerThird",
      { x: 80, y: 812, width: 920, height: 168 },
      "slide-right",
    ),
    type: "lowerThird",
    radius: 16,
    variant: "bar",
    title: "Speaker name",
    subtitle: "Title or role",
    accent: "#2563eb",
    fill: colorFill(PANEL_COLOR, 92),
    text: textAppearance({
      fontSize: 54,
      fontWeight: 700,
      shadow: false,
      padding: 28,
    }),
  }),
  qr: () => ({
    ...base("qr", { x: 1480, y: 560, width: 360, height: 440 }, "zoom"),
    type: "qr",
    radius: 24,
    value: "https://",
    caption: "Scan to register",
    foreground: "#111827",
    background: "#ffffff",
  }),
  shape: () => ({
    ...base("shape", centeredFrame({ width: 800, height: 450 }), "fade"),
    type: "shape",
    radius: 0,
    shape: "rectangle",
    fill: "#2563eb",
    gradient: null,
    fillOpacity: 100,
  }),
  background: () => ({
    ...base("background", FULL_FRAME, "fade"),
    type: "background",
    locked: true,
    backgroundId: null,
  }),
};

export const createLayer = <T extends LayerType>(
  type: T,
  overrides: Partial<Omit<LayerOfType<T>, "id" | "type">> = {},
): LayerOfType<T> => ({ ...BUILDERS[type](), ...overrides });

export const copyLayer = <T extends LayerOfType<LayerType>>(
  layer: T,
  nameSuffix = " copy",
): T => {
  const frame = offsetFrame({ ...layer.position, ...layer.dimensions }, 40);
  return {
    ...structuredClone(layer),
    id: uid(),
    name: `${layer.name}${nameSuffix}`,
    ...placement(frame),
  };
};

export const withFreshIds = <T extends { id: string }>(layers: T[]): T[] =>
  layers.map((layer) => ({ ...structuredClone(layer), id: uid() }));
