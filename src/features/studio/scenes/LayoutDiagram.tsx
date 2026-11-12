import { memo, type CSSProperties } from "react";
import { cn } from "../../../lib/utils";
import { stripInlineFormatting } from "../../../lib/inlineFormat";
import { findMediaItem, type MediaLibrary } from "../../../lib/media";
import { FormattedText } from "../../../components/FormattedText";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import type { DeckLayer, Layer, TextLayer } from "../types/layer";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../lib/canvasCoordinates";
import { isDeckLayer } from "../lib/deckContent";
import { LAYER_ICONS, LAYER_TINTS } from "../lib/layerCatalog";
import { hasBorder, paintCss } from "../lib/paint";
import { clampIndex } from "../lib/slidePosition";
import { useDeckLook } from "../hooks/useContentLook";
import { FittedSlide } from "../elements/DeckElement";
import { IconElement } from "../elements/IconElement";
import { panelStyle, typeStyle } from "../elements/textAppearanceStyle";

const percent = (value: number, total: number): string =>
  `${(value / total) * 100}%`;

const scaled = (canvasPx: number): string =>
  `${(canvasPx / CANVAS_WIDTH) * 100}cqw`;

const cornersOf = ({ radius, corners }: Layer): string => {
  if (!corners) return scaled(radius);
  return [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ]
    .map(scaled)
    .join(" ");
};

const paintOf = (layer: Layer, library: MediaLibrary): string | undefined => {
  switch (layer.type) {
    case "shape":
      return paintCss(layer.fill, layer.gradient, layer.fillOpacity);
    case "text":
    case "bible":
    case "manuscript":
    case "announcement":
    case "lowerThird":
      return layer.fill.kind === "color"
        ? paintCss(layer.fill.color, layer.fill.gradient, layer.fill.opacity)
        : undefined;
    case "qr":
      return layer.background;
    case "image": {
      const thumb = findMediaItem(
        library,
        layer.mediaId ?? undefined,
        "image",
      )?.thumbSrc;
      return thumb ? `center / cover no-repeat url("${thumb}")` : undefined;
    }
    default:
      return undefined;
  }
};

const frameStyle = (
  layer: Layer,
  paint: string | undefined,
): CSSProperties => ({
  left: percent(layer.position.x, CANVAS_WIDTH),
  top: percent(layer.position.y, CANVAS_HEIGHT),
  width: percent(layer.dimensions.width, CANVAS_WIDTH),
  height: percent(layer.dimensions.height, CANVAS_HEIGHT),
  opacity: layer.opacity / 100,
  borderRadius:
    layer.type === "shape" && layer.shape === "ellipse"
      ? "50%"
      : cornersOf(layer),
  background: paint,
  boxShadow: hasBorder(layer.border)
    ? `inset 0 0 0 max(1px, ${scaled(layer.border.width)}) ${layer.border.color}`
    : undefined,
});

const MIN_FIT_SCALE = 0.4;
const GLYPH_WIDTH = 0.56;
const CAPITAL_GLYPH_WIDTH = 0.7;

const wrappedLineCount = (text: string, charsPerLine: number): number =>
  text.split("\n").reduce((count, paragraph) => {
    let lines = 1;
    let used = 0;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const needed = used === 0 ? word.length : used + 1 + word.length;
      if (needed > charsPerLine && used > 0) {
        lines += 1;
        used = word.length;
      } else used = needed;
    }
    return count + lines;
  }, 0);

const fittedFontSize = ({ content, text, dimensions }: TextLayer): number => {
  const width = Math.max(1, dimensions.width - text.padding * 2);
  const height = Math.max(1, dimensions.height - text.padding * 2);
  const glyph = text.uppercase ? CAPITAL_GLYPH_WIDTH : GLYPH_WIDTH;
  const minimum = text.fontSize * MIN_FIT_SCALE;
  const visible = stripInlineFormatting(content);
  let size = text.fontSize;
  while (size > minimum) {
    const charsPerLine = Math.max(1, Math.floor(width / (glyph * size)));
    const lines = wrappedLineCount(visible, charsPerLine);
    if (lines * size * text.lineHeight <= height) break;
    size = Math.max(minimum, size * 0.92);
  }
  return size;
};

const DiagramWords = ({ layer }: { layer: TextLayer }) => (
  <span
    style={{ ...panelStyle(layer.text), padding: scaled(layer.text.padding) }}
    className="absolute inset-0 flex flex-col overflow-hidden"
  >
    <span
      style={{
        ...typeStyle({ ...layer.text, shadow: false }),
        fontSize: scaled(fittedFontSize(layer)),
      }}
      className="block w-full whitespace-pre-wrap"
    >
      <FormattedText text={layer.content} baseWeight={layer.text.fontWeight} />
    </span>
  </span>
);

const TINTED_FRAME = "border border-white/25 text-white/80";

const DiagramDeckLayer = ({
  layer,
  paint,
}: {
  layer: DeckLayer;
  paint: string | undefined;
}) => {
  const { doc, theme } = useDeckLook(layer);
  const slide = doc?.slides[clampIndex(layer.slideIndex, doc.slides.length)];
  const Icon = LAYER_ICONS[layer.type];
  const showsSlide = Boolean(doc && slide && theme);

  return (
    <span
      style={frameStyle(layer, paint)}
      className={cn(
        "absolute grid place-items-center overflow-hidden",
        !paint && !showsSlide && cn(TINTED_FRAME, LAYER_TINTS[layer.type]),
      )}
    >
      {doc && slide && theme ? (
        <FittedSlide doc={doc} slide={slide} theme={theme} live={false} />
      ) : (
        !paint && <Icon className="size-[min(14px,60%)]" />
      )}
    </span>
  );
};

const DiagramLayer = ({
  layer,
  library,
}: {
  layer: Layer;
  library: MediaLibrary;
}) => {
  const paint = paintOf(layer, library);
  if (isDeckLayer(layer))
    return <DiagramDeckLayer layer={layer} paint={paint} />;
  if (layer.type === "icon")
    return (
      <span style={frameStyle(layer, paint)} className="absolute">
        <IconElement layer={layer} />
      </span>
    );
  const Icon = LAYER_ICONS[layer.type];
  const showsWords = layer.type === "text";
  const showsIcon = !paint || layer.type === "qr";

  return (
    <span
      style={frameStyle(layer, paint)}
      className={cn(
        "absolute grid place-items-center overflow-hidden",
        !paint &&
          !showsWords &&
          cn("border border-white/25", LAYER_TINTS[layer.type]),
        showsIcon && "text-white/80",
      )}
    >
      {showsWords && <DiagramWords layer={layer} />}
      {showsIcon && !showsWords && (
        <Icon
          style={layer.type === "qr" ? { color: layer.foreground } : undefined}
          className="size-[min(14px,60%)]"
        />
      )}
    </span>
  );
};

export const LayoutDiagram = memo(
  ({
    layers,
    background,
    className,
  }: {
    layers: Layer[];
    background: string;
    className?: string;
  }) => {
    const library = useMediaLibrary();
    return (
      <div
        aria-hidden
        style={{ background }}
        className={cn(
          "@container relative aspect-video w-full overflow-hidden rounded-md border border-white/8",
          className,
        )}
      >
        {layers
          .filter((layer) => layer.visible)
          .map((layer) => (
            <DiagramLayer key={layer.id} layer={layer} library={library} />
          ))}
      </div>
    );
  },
);

LayoutDiagram.displayName = "LayoutDiagram";
