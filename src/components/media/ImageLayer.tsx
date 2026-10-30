import { useRef, type CSSProperties, type RefObject } from "react";
import type { ImageSettings } from "../../types";
import { buildFilter, imageTransformParts } from "../../lib/media";
import { useResizeObserver } from "usehooks-ts";
import { cn } from "../../lib/utils";

const scrimClassName = "bg-linear-to-t from-black/55 to-black/25";

const imageClassName = "absolute top-1/2 left-1/2";

interface ImageLayerProps {
  src: string | null;
  alt: string;
  settings: ImageSettings;
  className?: string;
}

interface PictureProps {
  src: string;
  alt: string;
  settings: ImageSettings;
}

const isQuarterTurn = (rotate: number): boolean =>
  rotate === 90 || rotate === 270;

const pictureStyle = (
  settings: ImageSettings,
  width: number | string,
  height: number | string,
): CSSProperties => ({
  width,
  height,
  objectFit: settings.fit,
  filter: buildFilter(settings),
  transform: ["translate(-50%, -50%)", ...imageTransformParts(settings)].join(
    " ",
  ),
});

const Picture = ({ src, alt, settings }: PictureProps) => (
  <img
    src={src}
    alt={alt}
    draggable={false}
    style={pictureStyle(settings, "100%", "100%")}
    className={imageClassName}
  />
);

const QuarterTurnPicture = ({ src, alt, settings }: PictureProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: frameRef as RefObject<HTMLDivElement>,
  });
  const measured = width > 0 && height > 0;

  return (
    <div ref={frameRef} className="absolute inset-0">
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={pictureStyle(
          settings,
          measured ? height : "100%",
          measured ? width : "100%",
        )}
        className={imageClassName}
      />
    </div>
  );
};

export const ImageLayer = ({
  src,
  alt,
  settings,
  className,
}: ImageLayerProps) => {
  const PictureView = isQuarterTurn(settings.rotate)
    ? QuarterTurnPicture
    : Picture;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-black", className)}>
      {src && <PictureView src={src} alt={alt} settings={settings} />}
      {settings.scrim && (
        <div className={cn("absolute inset-0", scrimClassName)} />
      )}
    </div>
  );
};
