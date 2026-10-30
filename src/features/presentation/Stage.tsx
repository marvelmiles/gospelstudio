import { useRef, useState } from "react";
import type { Ref } from "react";
import type { AnimationKind, EasingKind, PresentationView } from "../../types";
import type { MediaPlayback } from "../../lib/presentChannel";
import { fadeOverTransition, slideTransition } from "../../lib/animation";
import { useMediaUrl } from "../../lib/blobUrls";
import { isMediaBackground } from "../../lib/media";
import { cn } from "../../lib/utils";
import { SlideCanvas } from "../../components/SlideCanvas";
import { PortalSlot } from "@/components/shared/PortalSlot";
import { TransitionLayers } from "@/components/shared/TransitionLayers";
import { BackgroundSurface } from "../../components/media/BackgroundSurface";
import { ImageSurface } from "../../components/media/ImageSurface";
import {
  VideoSurface,
  type VideoSurfaceHandle,
} from "../../components/media/VideoSurface";
import type { StageContent } from "./stageContent";
import { backgroundCssOf } from "./lib/stageBackground";

interface StageProps {
  slideIndex: number;
  content: StageContent;
  animation: AnimationKind;
  view: PresentationView;
  zoom: number;
  pan: { x: number; y: number };
  onPanBy: (dx: number, dy: number) => void;
  durationMs: number;
  easing: EasingKind;
  playback?: MediaPlayback;
  forceMutedVideo?: boolean;
  videoRef?: Ref<VideoSurfaceHandle>;
  onVideoTime?: (time: number, duration: number) => void;
  onVideoEnded?: () => void;
  videoHost?: HTMLElement | null;
}

const VIEW_SIZE: Record<PresentationView, string> = {
  fill: "h-screen w-screen",
  cover: "h-[max(100vh,56.25vw)] w-[max(100vw,177.78vh)]",
  normal: "h-[min(100vh,56.25vw)] w-[min(100vw,177.78vh)]",
};

export const Stage = ({
  slideIndex,
  content,
  animation,
  view,
  zoom,
  pan,
  onPanBy,
  durationMs,
  easing,
  playback,
  forceMutedVideo,
  videoRef,
  onVideoTime,
  onVideoEnded,
  videoHost,
}: StageProps) => {
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);

  const opaqueContent = content.kind !== "text";

  return (
    <div
      onPointerDown={(e) => {
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
        setGrabbing(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        onPanBy(e.clientX - last.current.x, e.clientY - last.current.y);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        dragging.current = false;
        setGrabbing(false);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        setGrabbing(false);
      }}
      className={cn(
        "fixed inset-0 grid touch-none place-items-center overflow-hidden bg-black select-none",
        grabbing ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      <TransitionLayers
        transitionKey={backdropKeyOf(content)}
        transition={fadeOverTransition(durationMs, easing)}
        className="pointer-events-none absolute inset-0"
      >
        <StageBackdrop content={content} />
      </TransitionLayers>

      <TransitionLayers
        transitionKey={slideIndex}
        transition={slideTransition(animation, durationMs, easing, {
          opaque: opaqueContent,
        })}
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
          className={cn("relative origin-center", VIEW_SIZE[view])}
        >
          {content.kind === "text" && (
            <SlideCanvas
              slide={content.slide}
              style={content.style}
              lineStyles={content.lineStyles}
              bg={content.background}
              radius={0}
              fill
              noBackground
              live
            />
          )}
          {content.kind === "image" && (
            <ImageSurface item={content.item} className="bg-transparent" />
          )}
          {content.kind === "video" &&
            (videoHost ? (
              <PortalSlot host={videoHost} className="pointer-events-auto" />
            ) : (
              <VideoSurface
                ref={videoRef}
                item={content.item}
                playback={playback}
                forceMuted={forceMutedVideo}
                onTimeUpdate={onVideoTime}
                onEnded={onVideoEnded}
                className="pointer-events-auto bg-transparent"
              />
            ))}
        </div>
      </TransitionLayers>
    </div>
  );
};

const backdropKeyOf = (content: StageContent): string => {
  if (content.kind === "text") return `background:${content.background.id}`;
  if (content.kind === "image") return `ambient:${content.item.id}`;
  return "video";
};

const StageBackdrop = ({ content }: { content: StageContent }) => {
  const ambientUrl = useMediaUrl(
    content.kind === "image" ? content.item : null,
  );

  if (content.kind === "text") {
    const { background } = content;
    return (
      <div
        aria-hidden
        style={{ background: backgroundCssOf(background) }}
        className="absolute inset-0 bg-black"
      >
        {isMediaBackground(background) && (
          <BackgroundSurface
            background={background}
            settings={content.backgroundImage}
            videoSettings={content.backgroundVideo}
          />
        )}
      </div>
    );
  }

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-black">
      {ambientUrl && (
        <div
          style={{ backgroundImage: `url(${ambientUrl})` }}
          className="absolute inset-0 scale-112 bg-cover bg-center blur-[48px] brightness-55 saturate-110"
        />
      )}
    </div>
  );
};
