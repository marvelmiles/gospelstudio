import { useEffect, useEffectEvent, useRef } from "react";
import type { CSSProperties } from "react";
import type { SlideMedia } from "../../types";
import { useSlideMediaFile } from "../../hooks/useSlideMediaFile";
import { buildFilter } from "../../lib/media";
import { cn } from "../../lib/utils";
import { placedImageSettings, placedVideoSettings } from "../../lib/slideMedia";
import { ImageLayer } from "./ImageLayer";

interface SlideMediaLayersProps {
  media: SlideMedia[];
  live?: boolean;
  controlsFor?: string | null;
}

const frameStyle = (media: SlideMedia): CSSProperties => ({
  left: `${media.frame.x}%`,
  top: `${media.frame.y}%`,
  width: `${media.frame.width}%`,
  height: `${media.frame.height}%`,
  borderRadius: `${media.radius ?? 0}cqw`,
  opacity: (media.opacity ?? 100) / 100,
});

export const SlideMediaLayers = ({
  media,
  live,
  controlsFor,
}: SlideMediaLayersProps) => {
  return (
    <>
      {media.map((placed) => {
        const controls = placed.kind === "video" && placed.id === controlsFor;
        return (
          <div
            key={placed.id}
            aria-hidden={!controls}
            style={frameStyle(placed)}
            className={cn(
              "absolute overflow-hidden",
              controls ? "pointer-events-auto" : "pointer-events-none",
            )}
          >
            {placed.kind === "image" ? (
              <PlacedImage media={placed} />
            ) : (
              <PlacedVideo media={placed} live={live} controls={controls} />
            )}
          </div>
        );
      })}
    </>
  );
};

const PlacedImage = ({ media }: { media: SlideMedia }) => {
  const file = useSlideMediaFile(media);
  return (
    <ImageLayer
      src={file.url}
      alt={file.name}
      settings={placedImageSettings(media)}
      className="bg-transparent"
    />
  );
};

const PlacedVideo = ({
  media,
  live,
  controls,
}: {
  media: SlideMedia;
  live?: boolean;
  controls: boolean;
}) => {
  const file = useSlideMediaFile(media);
  const url = file.url;
  const videoRef = useRef<HTMLVideoElement>(null);
  const settings = placedVideoSettings(media);
  const resetToTrimStart = useEffectEvent((element: HTMLVideoElement) => {
    element.currentTime = settings.trimStart;
    element.playbackRate = settings.playbackRate;
  });

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !url || controls) return;
    resetToTrimStart(element);
    if (live) void element.play().catch(() => {});
    else element.pause();
  }, [url, live, controls]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.muted = controls || live ? settings.muted : true;
    element.volume = Math.min(1, Math.max(0, settings.volume / 100));
  }, [live, controls, settings.muted, settings.volume]);

  const handleTimeUpdate = () => {
    const element = videoRef.current;
    if (!element) return;
    const { trimStart, trimEnd, loop } = settings;
    if (trimEnd === null || element.currentTime < trimEnd) return;
    if (loop) {
      element.currentTime = trimStart;
      void element.play().catch(() => {});
      return;
    }
    element.pause();
  };

  const handleEnded = () => {
    const element = videoRef.current;
    if (!element || !settings.loop) return;
    element.currentTime = settings.trimStart;
    void element.play().catch(() => {});
  };

  if (!url) return null;
  return (
    <video
      ref={videoRef}
      src={url}
      playsInline
      controls={controls}
      loop={settings.loop && settings.trimEnd === null}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      style={{ objectFit: settings.fit, filter: buildFilter(settings) }}
      className="size-full"
    />
  );
};
