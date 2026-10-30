import type { Ref } from "react";
import type { MediaItem, VideoSettings } from "../../types";
import type { MediaPlayback } from "../../lib/presentChannel";
import { buildFilter, videoSettingsOf } from "../../lib/media";
import { useMediaUrl } from "../../lib/blobUrls";
import { cn } from "../../lib/utils";
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

export const VideoSurface = ({
  item,
  settings,
  playback,
  forceMuted,
  onTimeUpdate,
  onEnded,
  className,
  ref,
}: VideoSurfaceProps & { ref?: Ref<VideoSurfaceHandle> }) => {
  const src = useMediaUrl(item);
  const applied = settings ?? videoSettingsOf(item);
  const { elementRef, mediaEvents } = useMediaElementPlayback<HTMLVideoElement>(
    {
      handleRef: ref,
      sourceKey: item.id,
      src,
      settings: applied,
      playback,
      forceMuted,
      onTimeUpdate,
      onEnded,
    },
  );

  return (
    <div
      className={cn(
        "absolute inset-0 grid place-items-center overflow-hidden bg-black",
        className,
      )}
    >
      {src && (
        <video
          ref={elementRef}
          src={src}
          playsInline
          {...mediaEvents}
          style={{ objectFit: applied.fit, filter: buildFilter(applied) }}
          className="size-full"
        />
      )}
    </div>
  );
};
