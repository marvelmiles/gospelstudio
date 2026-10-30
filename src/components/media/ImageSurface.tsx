import type { ImageSettings, MediaItem } from "../../types";
import { imageSettingsOf } from "../../lib/media";
import { useMediaUrl, useThumbUrl } from "../../lib/blobUrls";
import { ImageLayer } from "./ImageLayer";

interface ImageSurfaceProps {
  item: MediaItem;
  settings?: ImageSettings;
  variant?: "full" | "thumb";
  className?: string;
}

export const ImageSurface = ({
  item,
  settings,
  variant = "full",
  className,
}: ImageSurfaceProps) => {
  const fullUrl = useMediaUrl(variant === "full" ? item : null);
  const thumbUrl = useThumbUrl(
    variant === "thumb" && !item.src ? item.id : null,
  );
  return (
    <ImageLayer
      src={
        variant === "thumb" ? (item.thumbSrc ?? item.src ?? thumbUrl) : fullUrl
      }
      alt={item.name}
      settings={settings ?? imageSettingsOf(item)}
      className={className}
    />
  );
};
