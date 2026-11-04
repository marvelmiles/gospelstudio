import type {
  Align,
  ImageSettings,
  Manuscript,
  MediaFit,
  ScripturePassage,
  VerticalAlign,
  VideoSettings,
} from "../../../types";

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface LayerFrame extends Position, Dimensions {}

export type LayerType =
  | "camera"
  | "bible"
  | "manuscript"
  | "text"
  | "image"
  | "video"
  | "announcement"
  | "lowerThird"
  | "qr"
  | "shape"
  | "background";

export type LayerEntrance =
  | "none"
  | "fade"
  | "zoom"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right";

export interface LayerAnimation {
  entrance: LayerEntrance;
  durationMs: number;
}

export type TextAlign = Align | "justify";

export interface TextAppearance {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: TextAlign;
  verticalAlign: VerticalAlign;
  lineHeight: number;
  uppercase: boolean;
  shadow: boolean;
  padding: number;
}

export interface Gradient {
  to: string;
  angle: number;
}

export type FillKind = "source" | "none" | "color" | "image" | "video";

export interface LayerFill {
  kind: FillKind;
  color: string;
  gradient: Gradient | null;
  opacity: number;
  imageId: string | null;
  videoId: string | null;
}

export interface LayerBorder {
  width: number;
  color: string;
  gradient: Gradient | null;
}

export interface CornerRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface LayerShadow {
  blur: number;
  distance: number;
  color: string;
  opacity: number;
}

interface LayerBase {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  position: Position;
  dimensions: Dimensions;
  opacity: number;
  rotation: number;
  radius: number;
  corners: CornerRadii | null;
  border: LayerBorder;
  shadow: LayerShadow;
  animation: LayerAnimation;
}

export interface CameraLayer extends LayerBase {
  type: "camera";
  sourceId: string | null;
  fit: MediaFit;
  mirror: boolean;
  muted: boolean;
  keepAspect: boolean;
}

interface DeckLayerBase extends LayerBase {
  slideIndex: number;
  fill: LayerFill;
}

export interface BibleLayer extends DeckLayerBase {
  type: "bible";
  passageId: string | null;
  passage: ScripturePassage | null;
}

export interface ManuscriptLayer extends DeckLayerBase {
  type: "manuscript";
  manuscriptId: string | null;
  manuscript: Manuscript | null;
}

export type DeckLayer = BibleLayer | ManuscriptLayer;

export type TextPreset = "body" | "heading" | "subtitle";

export interface TextLayer extends LayerBase {
  type: "text";
  preset: TextPreset;
  content: string;
  fill: LayerFill;
  text: TextAppearance;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  mediaId: string | null;
  overrides: Partial<ImageSettings>;
  focusX: number;
  focusY: number;
  zoom: number;
}

interface VideoPlayback {
  playing: boolean;
  restartToken: number;
}

export interface VideoLayer extends LayerBase {
  type: "video";
  mediaId: string | null;
  overrides: Partial<VideoSettings>;
  autoplay: boolean;
  playback: VideoPlayback;
}

export type AnnouncementVariant = "card" | "ticker";

export interface AnnouncementLayer extends LayerBase {
  type: "announcement";
  variant: AnnouncementVariant;
  heading: string;
  body: string;
  detail: string;
  accent: string;
  tickerSeconds: number;
  fill: LayerFill;
  text: TextAppearance;
}

export type LowerThirdVariant = "bar" | "minimal";

export interface LowerThirdLayer extends LayerBase {
  type: "lowerThird";
  variant: LowerThirdVariant;
  title: string;
  subtitle: string;
  accent: string;
  fill: LayerFill;
  text: TextAppearance;
}

export interface QrLayer extends LayerBase {
  type: "qr";
  value: string;
  caption: string;
  foreground: string;
  background: string;
}

export type ShapeKind =
  | "rectangle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "arrow"
  | "cross"
  | "slant";

export interface ShapeLayer extends LayerBase {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  gradient: Gradient | null;
  fillOpacity: number;
}

export interface BackgroundLayer extends LayerBase {
  type: "background";
  backgroundId: string | null;
}

export type Layer =
  | CameraLayer
  | BibleLayer
  | ManuscriptLayer
  | TextLayer
  | ImageLayer
  | VideoLayer
  | AnnouncementLayer
  | LowerThirdLayer
  | QrLayer
  | ShapeLayer
  | BackgroundLayer;

export type FilledLayer = Extract<Layer, { fill: LayerFill }>;

export type LayerOfType<T extends LayerType> = Extract<Layer, { type: T }>;

export type LayerPatch<T extends Layer = Layer> = Partial<
  Omit<T, "id" | "type">
>;
