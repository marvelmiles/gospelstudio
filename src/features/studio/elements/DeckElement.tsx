import { useMemo } from "react";
import { BookOpen, FileText } from "lucide-react";
import type { Background, Slide, SlideDeckDoc, Theme } from "../../../types";
import {
  resolveAnimation,
  resolveLineStyle,
  resolveStyle,
} from "../../../lib/resolve";
import { SlideCanvas } from "../../../components/SlideCanvas";
import { TransitionLayers } from "@/components/shared/TransitionLayers";
import type { DeckLayer } from "../types/layer";
import { clampIndex } from "../lib/slidePosition";
import { backdropKeyOf } from "../lib/layerFill";
import {
  useContentTransitions,
  useDeckLook,
  useFallbackAnimation,
  useResolvedBackground,
} from "../hooks/useContentLook";
import { ElementPlaceholder } from "./ElementPlaceholder";
import { LayerBackdrop } from "./LayerBackdrop";

export const DeckElement = ({ layer }: { layer: DeckLayer }) => {
  const { doc, theme } = useDeckLook(layer);
  const slides = doc?.slides ?? [];
  const slideIndex = clampIndex(layer.slideIndex, slides.length);
  const slide: Slide | undefined = slides[slideIndex];
  const background = useResolvedBackground(slide, doc, theme);
  const fallbackAnimation = useFallbackAnimation();
  const animation =
    slide && theme
      ? resolveAnimation(slide, doc ?? undefined, theme, fallbackAnimation)
      : fallbackAnimation;
  const transitions = useContentTransitions(animation);

  if (!doc || !slide || !theme) return <DeckPlaceholder layer={layer} />;

  return (
    <div className="relative size-full overflow-hidden">
      <TransitionLayers
        transitionKey={backdropKeyOf(layer.fill, background)}
        transition={transitions.backdrop}
        className="absolute inset-0"
      >
        <LayerBackdrop fill={layer.fill} source={background} />
      </TransitionLayers>
      <TransitionLayers
        transitionKey={`${doc.id}:${slideIndex}`}
        transition={transitions.content}
        className="absolute inset-0"
      >
        <FittedSlide doc={doc} slide={slide} theme={theme} live />
      </TransitionLayers>
    </div>
  );
};

const DeckPlaceholder = ({ layer }: { layer: DeckLayer }) => {
  const hasContent = Boolean(
    layer.type === "manuscript"
      ? layer.manuscriptId || layer.manuscript
      : layer.passageId || layer.passage,
  );
  if (layer.type === "bible")
    return (
      <ElementPlaceholder
        icon={BookOpen}
        title={
          hasContent ? "This passage has no slides yet" : "Choose a passage"
        }
        hint="Select this box, then find a Bible passage."
      />
    );
  return (
    <ElementPlaceholder
      icon={FileText}
      title={
        hasContent ? "This manuscript has no slides yet" : "Choose a manuscript"
      }
      hint="Select this box, then pick a manuscript from your library."
    />
  );
};

const EMPTY_BACKGROUND: Background = {
  id: "studio-transparent",
  name: "None",
  category: "studio",
  type: "solid",
  color: "transparent",
};

interface SlideContentProps {
  doc: SlideDeckDoc;
  slide: Slide;
  theme: Theme;
  live: boolean;
}

export const FittedSlide = (props: SlideContentProps) => (
  <div className="@container-size grid size-full place-items-center">
    <div className="aspect-video w-[min(100cqw,calc(100cqh*16/9))]">
      <DesignedSlide {...props} />
    </div>
  </div>
);

const DesignedSlide = ({ doc, slide, theme, live }: SlideContentProps) => {
  const looks = useMemo(
    () => ({
      style: resolveStyle(slide, doc, theme),
      lineStyles: slide.lines.map((_, index) =>
        resolveLineStyle(slide, index, doc, theme),
      ),
    }),
    [slide, doc, theme],
  );
  return (
    <SlideCanvas
      slide={slide}
      style={looks.style}
      lineStyles={looks.lineStyles}
      bg={EMPTY_BACKGROUND}
      radius={0}
      fill
      noBackground
      live={live}
    />
  );
};
