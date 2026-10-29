import type { Background, ImageSettings, VideoSettings } from "../../types";
import {
  backgroundImageSettings,
  isImageBackground,
  isVideoBackground,
} from "../../lib/media";
import { useBlobUrl, useThumbUrl } from "../../lib/blobUrls";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { ImageLayer } from "./ImageLayer";
import { VideoThumb } from "./VideoThumb";
import { BackgroundVideoLayer } from "./BackgroundVideoLayer";

const backgroundCss = (background?: Background): string | undefined => {
  if (!background) return undefined;
  if (background.type === "solid") return background.color || "#111";
  return background.css || "#111";
};

type SurfaceVariant = "full" | "thumb";

interface BackgroundSurfaceProps {
  background?: Background;
  settings?: ImageSettings | null;
  videoSettings?: VideoSettings | null;
  variant?: SurfaceVariant;
  className?: string;
}

export const BackgroundSurface = ({
  background,
  settings,
  videoSettings,
  variant = "full",
  className,
}: BackgroundSurfaceProps) => {
  if (isVideoBackground(background))
    return (
      <VideoBackgroundSurface
        mediaId={background?.mediaId ?? ""}
        settings={videoSettings}
        variant={variant}
        className={className}
      />
    );
  if (isImageBackground(background))
    return (
      <ImageBackgroundSurface
        background={background}
        settings={settings}
        variant={variant}
        className={className}
      />
    );
  return (
    <div
      style={{ background: backgroundCss(background) }}
      className={cn("absolute inset-0 bg-thumbnail", className)}
    />
  );
};

const ImageBackgroundSurface = ({
  background,
  settings,
  variant,
  className,
}: Required<Pick<BackgroundSurfaceProps, "variant">> &
  Omit<BackgroundSurfaceProps, "variant">) => {
  const blobId = background?.blobId;
  const thumbUrl = useThumbUrl(variant === "thumb" ? blobId : null);
  const fullUrl = useBlobUrl(variant === "full" ? blobId : null);
  const src = blobId
    ? variant === "thumb"
      ? thumbUrl
      : fullUrl
    : background?.dataUrl || null;

  return (
    <ImageLayer
      src={src}
      alt={background?.name || ""}
      settings={settings ?? backgroundImageSettings(background)}
      className={cn("bg-thumbnail", className)}
    />
  );
};

const VideoBackgroundSurface = ({
  mediaId,
  settings,
  variant,
  className,
}: {
  mediaId: string;
  settings?: VideoSettings | null;
  variant: SurfaceVariant;
  className?: string;
}) => {
  const item = useStore((s) =>
    s.media.find((entry) => entry.id === mediaId && entry.kind === "video"),
  );
  const surfaceClassName = cn("absolute inset-0 bg-thumbnail", className);

  if (!item) return <div className={surfaceClassName} />;
  if (variant === "full")
    return (
      <BackgroundVideoLayer
        item={item}
        settings={settings}
        className={cn("bg-thumbnail", className)}
      />
    );
  return (
    <div className={surfaceClassName}>
      <VideoThumb item={item} applySettings />
    </div>
  );
};
