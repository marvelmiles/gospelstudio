import { useMemo } from "react";
import type { ResolvedBackground } from "../../../lib/resolve";
import {
  backgroundVideoSettings,
  findMediaItem,
  imageSettingsOf,
  isMediaBackground,
} from "../../../lib/media";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { BackgroundSurface } from "../../../components/media/BackgroundSurface";
import { BackgroundVideoLayer } from "../../../components/media/BackgroundVideoLayer";
import { ImageSurface } from "../../../components/media/ImageSurface";
import { backgroundCssOf } from "../../presentation/lib/stageBackground";
import type { LayerFill } from "../types/layer";
import { paintStyle } from "../lib/paint";

interface LayerBackdropProps {
  fill: LayerFill;
  source?: ResolvedBackground | null;
}

export const LayerBackdrop = ({ fill, source = null }: LayerBackdropProps) => {
  switch (fill.kind) {
    case "none":
      return null;
    case "color":
      return (
        <div
          aria-hidden
          style={paintStyle(fill.color, fill.gradient, fill.opacity)}
          className="absolute inset-0"
        />
      );
    case "image":
      return <PictureBackdrop mediaId={fill.imageId} opacity={fill.opacity} />;
    case "video":
      return <MovieBackdrop mediaId={fill.videoId} opacity={fill.opacity} />;
    case "source":
      return source ? <SourceBackdrop source={source} /> : null;
  }
};

const SourceBackdrop = ({ source }: { source: ResolvedBackground }) => (
  <div
    aria-hidden
    style={{ background: backgroundCssOf(source.background) }}
    className="absolute inset-0"
  >
    {isMediaBackground(source.background) && (
      <BackgroundSurface
        background={source.background}
        settings={source.image}
        videoSettings={source.video}
      />
    )}
  </div>
);

interface MediaBackdropProps {
  mediaId: string | null;
  opacity: number;
}

const PictureBackdrop = ({ mediaId, opacity }: MediaBackdropProps) => {
  const library = useMediaLibrary();
  const item = findMediaItem(library, mediaId ?? undefined, "image");
  const settings = useMemo(
    () => (item ? { ...imageSettingsOf(item), fit: "cover" as const } : null),
    [item],
  );
  if (!item || !settings) return null;
  return (
    <div
      aria-hidden
      style={{ opacity: opacity / 100 }}
      className="absolute inset-0"
    >
      <ImageSurface
        item={item}
        settings={settings}
        className="bg-transparent"
      />
    </div>
  );
};

const MovieBackdrop = ({ mediaId, opacity }: MediaBackdropProps) => {
  const library = useMediaLibrary();
  const item = findMediaItem(library, mediaId ?? undefined, "video");
  const settings = useMemo(
    () =>
      item ? { ...backgroundVideoSettings(item), fit: "cover" as const } : null,
    [item],
  );
  if (!item || !settings) return null;
  return (
    <div
      aria-hidden
      style={{ opacity: opacity / 100 }}
      className="absolute inset-0"
    >
      <BackgroundVideoLayer
        item={item}
        settings={settings}
        className="bg-transparent"
      />
    </div>
  );
};
