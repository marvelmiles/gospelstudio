import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Ref } from "react";
import type { AnimationKind, EasingKind, PresentationView } from "../../types";
import type { MediaPlayback } from "../../lib/presentChannel";
import { ANIMATION_VARIANTS, buildTransition } from "../../lib/animation";
import { useBlobUrl } from "../../lib/blobUrls";
import { isMediaBackground } from "../../lib/media";
import { cn } from "../../lib/cn";
import { SlideCanvas } from "../../components/SlideCanvas";
import { PortalSlot } from "../../components/ui/PortalSlot";
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
  const variant = ANIMATION_VARIANTS[animation] || ANIMATION_VARIANTS.fade;
  const transition = buildTransition(durationMs, easing);

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);

  const backdrop = content.kind === "text" ? content.background : null;
  const backdropImage =
    content.kind === "text" ? content.backgroundImage : null;
  const backdropVideo =
    content.kind === "text" ? content.backgroundVideo : null;
  const ambientUrl = useBlobUrl(
    content.kind === "image" ? content.item.id : null,
  );

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
      <div
        aria-hidden
        style={
          backdrop
            ? { background: backgroundCssOf(backdrop) }
            : ambientUrl
              ? { backgroundImage: `url(${ambientUrl})` }
              : undefined
        }
        className={cn(
          "pointer-events-none absolute inset-0 bg-black",
          !backdrop &&
            ambientUrl &&
            "scale-112 bg-cover bg-center blur-[48px] brightness-55 saturate-110",
        )}
      >
        {isMediaBackground(backdrop ?? undefined) && (
          <BackgroundSurface
            background={backdrop ?? undefined}
            settings={backdropImage}
            videoSettings={backdropVideo}
          />
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={slideIndex}
          initial={variant.initial}
          animate={variant.animate}
          exit={{ opacity: 0 }}
          transition={transition}
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
                  className="pointer-events-auto"
                />
              ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
