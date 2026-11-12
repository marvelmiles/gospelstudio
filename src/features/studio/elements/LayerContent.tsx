import { memo } from "react";
import type { Layer } from "../types/layer";
import { cornerRadiusCss } from "../lib/corners";
import { shadowFilter } from "../lib/paint";
import { AnnouncementElement } from "./AnnouncementElement";
import { BackgroundElement } from "./BackgroundElement";
import { BorderRing } from "./BorderRing";
import { CameraElement } from "./CameraElement";
import { DeckElement } from "./DeckElement";
import { IconElement } from "./IconElement";
import { ImageElement } from "./ImageElement";
import { LowerThirdElement } from "./LowerThirdElement";
import { QrElement } from "./QrElement";
import { ShapeElement } from "./ShapeElement";
import { TextElement } from "./TextElement";
import { VideoElement } from "./VideoElement";

const ElementOf = ({ layer }: { layer: Layer }) => {
  switch (layer.type) {
    case "camera":
      return <CameraElement layer={layer} />;
    case "bible":
    case "manuscript":
      return <DeckElement layer={layer} />;
    case "text":
      return <TextElement layer={layer} />;
    case "image":
      return <ImageElement layer={layer} />;
    case "video":
      return <VideoElement layer={layer} />;
    case "announcement":
      return <AnnouncementElement layer={layer} />;
    case "lowerThird":
      return <LowerThirdElement layer={layer} />;
    case "qr":
      return <QrElement layer={layer} />;
    case "shape":
      return <ShapeElement layer={layer} />;
    case "icon":
      return <IconElement layer={layer} />;
    case "background":
      return <BackgroundElement layer={layer} />;
  }
};

export const LayerSurface = memo(({ layer }: { layer: Layer }) => (
  <div
    style={{
      opacity: layer.opacity / 100,
      transform: layer.rotation ? `rotate(${layer.rotation}deg)` : undefined,
      filter: shadowFilter(layer.shadow),
    }}
    className="relative size-full"
  >
    <div
      style={{ borderRadius: cornerRadiusCss(layer) }}
      className="relative size-full overflow-hidden"
    >
      <ElementOf layer={layer} />
      {layer.type !== "shape" && <BorderRing border={layer.border} />}
    </div>
  </div>
));

LayerSurface.displayName = "LayerSurface";
