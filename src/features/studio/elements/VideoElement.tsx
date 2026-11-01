import { useMemo } from "react";
import { Film } from "lucide-react";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import type { MediaPlayback } from "../../../lib/presentChannel";
import { VideoSurface } from "../../../components/media/VideoSurface";
import type { VideoLayer } from "../types/layer";
import { videoLookOf } from "../lib/mediaLooks";
import { useRenderSurface } from "../render/renderSurface";
import { ElementPlaceholder } from "./ElementPlaceholder";

export const VideoElement = ({ layer }: { layer: VideoLayer }) => {
  const surface = useRenderSurface();
  const library = useMediaLibrary();
  const item = findMediaItem(library, layer.mediaId ?? undefined, "video");
  const { playing, restartToken } = layer.playback;
  const isPlaying = surface === "editor" ? layer.autoplay : playing;

  const settings = useMemo(
    () => (item ? videoLookOf(item, layer.overrides) : null),
    [item, layer.overrides],
  );
  const playback = useMemo<MediaPlayback | undefined>(
    () =>
      settings
        ? {
            playing: isPlaying,
            muted: settings.muted,
            volume: settings.volume,
            seekTime: settings.trimStart,
            seekToken: restartToken,
          }
        : undefined,
    [settings, isPlaying, restartToken],
  );

  if (!item || !settings)
    return (
      <ElementPlaceholder
        icon={Film}
        title={layer.mediaId ? "Video not found" : "Choose a video"}
        hint="Select this box, then pick a video from your library."
      />
    );

  return (
    <VideoSurface
      item={item}
      settings={settings}
      playback={playback}
      forceMuted={surface !== "output"}
      className="bg-transparent"
    />
  );
};
