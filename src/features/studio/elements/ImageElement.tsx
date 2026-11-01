import { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import { useMediaUrl } from "../../../lib/blobUrls";
import { ImageLayer as ImagePicture } from "../../../components/media/ImageLayer";
import type { ImageLayer } from "../types/layer";
import { imageLookOf } from "../lib/mediaLooks";
import { ElementPlaceholder } from "./ElementPlaceholder";

export const ImageElement = ({ layer }: { layer: ImageLayer }) => {
  const library = useMediaLibrary();
  const item = findMediaItem(library, layer.mediaId ?? undefined, "image");
  const src = useMediaUrl(item);
  const settings = useMemo(
    () => (item ? imageLookOf(item, layer.overrides) : null),
    [item, layer.overrides],
  );

  if (!item || !settings)
    return (
      <ElementPlaceholder
        icon={ImageIcon}
        title={layer.mediaId ? "Image not found" : "Choose an image"}
        hint="Select this box, then pick an image from your library."
      />
    );

  const focus = `${layer.focusX}% ${layer.focusY}%`;

  return (
    <div className="relative size-full overflow-hidden">
      <div
        style={{
          transform:
            layer.zoom !== 100 ? `scale(${layer.zoom / 100})` : undefined,
          transformOrigin: focus,
        }}
        className="absolute inset-0 select-none"
      >
        <ImagePicture
          src={src}
          alt={item.name}
          settings={settings}
          objectPosition={focus}
          className="bg-transparent"
        />
      </div>
    </div>
  );
};
