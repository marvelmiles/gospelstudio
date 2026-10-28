import { forwardRef } from "react";
import type { MediaItem, VideoSettings } from "../../types";
import type { MediaPlayback } from "../../lib/presentChannel";
import { buildFilter, videoSettingsOf } from "../../lib/media";
import { useBlobUrl } from "../../lib/blobUrls";
import { cn } from "../../lib/cn";
import {
  useMediaElementPlayback,
  type MediaSurfaceHandle,
} from "../../hooks/useMediaElementPlayback";

export type VideoSurfaceHandle = MediaSurfaceHandle;

interface VideoSurfaceProps {
  item: MediaItem;
  settings?: VideoSettings;
  playback?: MediaPlayback;
  forceMuted?: boolean;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

export const VideoSurface = forwardRef<VideoSurfaceHandle, VideoSurfaceProps>(
  (
    { item, settings, playback, forceMuted, onTimeUpdate, onEnded, className },
    ref,
  ) => {
    const src = useBlobUrl(item.id);
    const applied = settings ?? videoSettingsOf(item);
    const element = useMediaElementPlayback<HTMLVideoElement>({
      handleRef: ref,
      sourceKey: item.id,
      src,
      settings: applied,
      playback,
      forceMuted,
      onTimeUpdate,
      onEnded,
    });

    return (
      <div
        className={cn(
          "absolute inset-0 grid place-items-center overflow-hidden bg-black",
          className,
        )}
      >
        {src && (
          <video
            ref={element.ref}
            src={src}
            playsInline
            onLoadedMetadata={element.onLoadedMetadata}
            onTimeUpdate={element.onTimeUpdate}
            onEnded={element.onEnded}
            style={{ objectFit: applied.fit, filter: buildFilter(applied) }}
            className="size-full"
          />
        )}
      </div>
    );
  },
);

VideoSurface.displayName = "VideoSurface";
