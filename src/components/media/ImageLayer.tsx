import { useRef, type RefObject } from "react";
import type { ImageSettings } from "../../types";
import { buildFilter, imageTransformParts } from "../../lib/media";
import { useResizeObserver } from "usehooks-ts";
import { cn } from "../../lib/utils";

const scrimClassName = "bg-linear-to-t from-black/55 to-black/25";

interface ImageLayerProps {
  src: string | null;
  alt: string;
  settings: ImageSettings;
  className?: string;
}

export const ImageLayer = ({
  src,
  alt,
  settings,
  className,
}: ImageLayerProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: frameRef as RefObject<HTMLDivElement>,
  });
  const swapAxes =
    (settings.rotate === 90 || settings.rotate === 270) &&
    width > 0 &&
    height > 0;

  return (
    <div
      ref={frameRef}
      className={cn("absolute inset-0 overflow-hidden bg-black", className)}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            width: swapAxes ? height : "100%",
            height: swapAxes ? width : "100%",
            objectFit: settings.fit,
            filter: buildFilter(settings),
            transform: [
              "translate(-50%, -50%)",
              ...imageTransformParts(settings),
            ].join(" "),
          }}
          className="absolute top-1/2 left-1/2"
        />
      )}
      {settings.scrim && (
        <div className={cn("absolute inset-0", scrimClassName)} />
      )}
    </div>
  );
};
