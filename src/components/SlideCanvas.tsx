import type { PointerEvent, ReactNode } from "react";
import type {
  Background,
  ImageSettings,
  ResolvedStyle,
  Slide,
  VideoSettings,
} from "../types";
import { cn } from "../lib/cn";
import {
  backgroundImageSettings,
  isImageBackground,
  isVideoBackground,
} from "../lib/media";
import { BackgroundSurface } from "./media/BackgroundSurface";
import { SlideMediaLayers } from "./media/SlideMediaLayers";
import type { SlideTextEditing } from "../hooks/useSlideTextEditor";
import { SlideTextBlock } from "./SlideTextBlock";
import { SlideTextBoxLayers } from "./SlideTextBoxLayers";
import { SLIDE_BODY_PADDING } from "../lib/slideLayout";

export interface ClickPoint {
  x: number;
  y: number;
}

interface SlideCanvasProps {
  slide: Slide;
  style: ResolvedStyle;
  bg: Background;
  bgImage?: ImageSettings | null;
  bgVideo?: VideoSettings | null;
  showLabel?: boolean;
  radius?: number;
  fill?: boolean;
  noBackground?: boolean;
  lineStyles?: ResolvedStyle[];
  selectedLine?: number | null;
  editing?: SlideTextEditing;
  editingTextBoxId?: string | null;
  onActivateText?: (boxId: string | null, point: ClickPoint) => void;
  mediaControlsFor?: string | null;
  live?: boolean;
  playBackground?: boolean;
  overlay?: ReactNode;
}

export const SlideCanvas = ({
  slide,
  style,
  bg,
  bgImage,
  bgVideo,
  showLabel,
  radius = 14,
  fill,
  noBackground,
  lineStyles,
  selectedLine,
  editing,
  editingTextBoxId = null,
  onActivateText,
  mediaControlsFor,
  live,
  playBackground,
  overlay,
}: SlideCanvasProps) => {
  const editable = Boolean(editing);
  const paintsPicture = !noBackground && isImageBackground(bg);
  const paintsVideo = !noBackground && isVideoBackground(bg);
  const pictureSettings = paintsPicture
    ? (bgImage ?? backgroundImageSettings(bg))
    : null;
  const bgStyle =
    noBackground || paintsPicture || paintsVideo
      ? {}
      : bg?.type === "solid"
        ? { background: bg.color }
        : { background: bg?.css || "#111" };

  const textBoxes = slide.textBoxes ?? [];
  const bodyLines = slide.lines ?? [];
  const showBody =
    !textBoxes.length || bodyLines.some((line) => line.trim() !== "");
  const bodyActive = editable && editingTextBoxId === null;

  const activate = (boxId: string | null, event: PointerEvent<HTMLElement>) => {
    if (!onActivateText) return;
    event.stopPropagation();
    onActivateText(boxId, { x: event.clientX, y: event.clientY });
  };

  return (
    <div
      style={{ borderRadius: radius, ...bgStyle }}
      className={cn(
        "@container relative overflow-hidden",
        fill ? "size-full" : "aspect-video",
      )}
    >
      {pictureSettings && (
        <BackgroundSurface
          background={bg}
          settings={pictureSettings}
          variant="thumb"
        />
      )}
      {paintsVideo && (
        <BackgroundSurface
          background={bg}
          videoSettings={bgVideo}
          variant={playBackground || live ? "full" : "thumb"}
        />
      )}
      {showBody && (
        <SlideTextBlock
          lines={bodyLines}
          style={style}
          lineStyles={lineStyles}
          selectedLine={bodyActive ? selectedLine : null}
          editing={bodyActive ? editing : undefined}
          marked={editable}
          padding={SLIDE_BODY_PADDING}
          onPointerDown={
            onActivateText ? (event) => activate(null, event) : undefined
          }
        />
      )}
      {slide.media && slide.media.length > 0 && (
        <SlideMediaLayers
          media={slide.media}
          live={live}
          controlsFor={mediaControlsFor}
        />
      )}
      {textBoxes.length > 0 && (
        <SlideTextBoxLayers
          boxes={textBoxes}
          style={style}
          editing={editing}
          editingBoxId={editingTextBoxId}
          selectedLine={selectedLine}
          marked={editable}
          onPointerDownBox={
            onActivateText
              ? (boxId, event) => activate(boxId, event)
              : undefined
          }
        />
      )}
      {overlay}
      {showLabel && slide.label && (
        <div className="absolute bottom-[3cqw] left-[3.5cqw] rounded-full bg-black/32 px-[1.4cqw] py-[0.6cqw] font-sans text-[2.2cqw] font-semibold tracking-[0.15cqw] text-white/78 uppercase backdrop-blur-xs">
          {slide.label}
        </div>
      )}
    </div>
  );
};
