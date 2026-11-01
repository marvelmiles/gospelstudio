import { useMemo } from "react";
import { QrCode } from "lucide-react";
import type { QrLayer } from "../types/layer";
import { buildQrPath } from "../lib/qrPath";
import { ElementPlaceholder } from "./ElementPlaceholder";
import { fontStack } from "./textAppearanceStyle";

const CAPTION_RATIO = 0.085;

export const QrElement = ({ layer }: { layer: QrLayer }) => {
  const qr = useMemo(() => buildQrPath(layer.value), [layer.value]);
  if (!qr)
    return (
      <ElementPlaceholder
        icon={QrCode}
        title="Add a link"
        hint="Type the web address this code should open."
      />
    );

  const captionSize = Math.round(layer.dimensions.width * CAPTION_RATIO);

  return (
    <div
      style={{ background: layer.background, color: layer.foreground }}
      className="flex size-full flex-col items-center justify-center gap-[3%] p-[6%]"
    >
      <svg
        viewBox={`0 0 ${qr.modules} ${qr.modules}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`QR code for ${layer.value}`}
        className="min-h-0 w-full flex-1"
      >
        <path d={qr.path} fill="currentColor" />
      </svg>
      {layer.caption && (
        <div
          style={{
            fontSize: captionSize,
            fontFamily: fontStack("Outfit"),
          }}
          className="w-full truncate text-center leading-tight font-bold"
        >
          {layer.caption}
        </div>
      )}
    </div>
  );
};
