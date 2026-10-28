import { useMemo } from "react";
import type { MediaItem, VideoSettings } from "../../types";
import type { MediaPlayback } from "../../lib/presentChannel";
import { backgroundVideoSettings } from "../../lib/media";
import { VideoSurface } from "./VideoSurface";

interface BackgroundVideoLayerProps {
  item: MediaItem;
  settings?: VideoSettings | null;
  className?: string;
}

export const BackgroundVideoLayer = ({
  item,
  settings: usage,
  className,
}: BackgroundVideoLayerProps) => {
  const settings = useMemo(
    () => ({
      ...(usage ?? backgroundVideoSettings(item)),
      loop: true,
      muted: true,
    }),
    [item, usage],
  );
  const playback = useMemo<MediaPlayback>(
    () => ({
      playing: true,
      muted: true,
      volume: 0,
      seekTime: settings.trimStart,
      seekToken: 0,
    }),
    [settings.trimStart],
  );
  return (
    <VideoSurface
      item={item}
      settings={settings}
      playback={playback}
      className={className}
    />
  );
};
