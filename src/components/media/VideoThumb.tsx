import type { SyntheticEvent } from "react";
import type { MediaItem } from "../../types";
import { useMediaUrl } from "../../lib/blobUrls";
import { buildFilter, videoSettingsOf } from "../../lib/media";
import { cn } from "../../lib/utils";

const COVER_OFFSET_RATIO = 0.1;
const COVER_OFFSET_MAX_SECONDS = 1;
const END_MARGIN_SECONDS = 0.05;

interface VideoThumbProps {
  item: MediaItem;
  applySettings?: boolean;
  className?: string;
}

/* A video's first frame is often black, so the preview jumps a little way in to show a real picture. */
const coverTime = (trimStart: number, duration: number): number => {
  const target =
    trimStart > 0
      ? trimStart
      : Math.min(duration * COVER_OFFSET_RATIO, COVER_OFFSET_MAX_SECONDS);
  return Math.max(0, Math.min(target, duration - END_MARGIN_SECONDS));
};

export const VideoThumb = ({
  item,
  applySettings,
  className,
}: VideoThumbProps) => {
  const src = useMediaUrl(item);
  if (!src) return null;
  const { trimStart } = videoSettingsOf(item);
  const settings = applySettings ? videoSettingsOf(item) : null;

  const showCover = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = coverTime(trimStart, video.duration);
  };

  return (
    <video
      src={src}
      muted
      playsInline
      preload="metadata"
      onLoadedMetadata={showCover}
      style={{
        objectFit: settings?.fit ?? "cover",
        filter: settings ? buildFilter(settings) : undefined,
      }}
      className={cn("absolute inset-0 size-full", className)}
    />
  );
};
