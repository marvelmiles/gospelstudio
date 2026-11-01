import { Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { cn } from "../../../lib/utils";
import { MiniButton } from "@/components/shared/MiniButton";
import type { DeckLayer, Layer } from "../types/layer";
import { LAYER_ICONS } from "../lib/layerCatalog";
import { clampIndex } from "../lib/slidePosition";
import { useProgram } from "../store/productionStore";
import { updateLiveLayer } from "../store/programActions";
import { useDeckLook } from "../hooks/useContentLook";
import { StepControl } from "../properties/StepControl";
import { VideoTransport } from "./VideoTransport";

export const LiveControls = ({ className }: { className?: string }) => {
  const program = useProgram();
  const layers = program?.layers ?? [];
  if (layers.length === 0) return null;

  return (
    <section
      aria-label="Live controls"
      className={cn("flex flex-col gap-2.5", className)}
    >
      <h3 className="m-0 flex items-center gap-1.5 section-label">
        <SlidersHorizontal size={13} />
        Live controls
      </h3>
      {layers.map((layer) => (
        <LiveLayerControl key={layer.id} layer={layer} />
      ))}
    </section>
  );
};

const LiveLayerControl = ({ layer }: { layer: Layer }) => {
  const Icon = LAYER_ICONS[layer.type];
  return (
    <div
      className={cn(
        "rounded-[11px] border border-border bg-background p-2",
        !layer.visible && "opacity-70",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
          {layer.name}
        </span>
        <MiniButton
          icon={layer.visible ? Eye : EyeOff}
          active={!layer.visible}
          title={
            layer.visible
              ? `Hide ${layer.name} on the live screen`
              : `Show ${layer.name} on the live screen`
          }
          onClick={() => updateLiveLayer(layer.id, { visible: !layer.visible })}
        />
      </div>
      {layer.visible && <LiveContentControl layer={layer} />}
    </div>
  );
};

const LiveContentControl = ({ layer }: { layer: Layer }) => {
  switch (layer.type) {
    case "manuscript":
    case "bible":
      return <LiveDeck layer={layer} />;
    case "video":
      return (
        <div className="mt-2">
          <VideoTransport layer={layer} />
        </div>
      );
    default:
      return null;
  }
};

const LiveDeck = ({ layer }: { layer: DeckLayer }) => {
  const slides = useDeckLook(layer).doc?.slides ?? [];
  if (slides.length < 2) return null;
  const current = clampIndex(layer.slideIndex, slides.length);
  const show = (slideIndex: number) =>
    updateLiveLayer<DeckLayer>(layer.id, { slideIndex });

  return (
    <div className="mt-2 flex flex-col gap-2">
      <StepControl
        label="Slide on screen"
        index={current}
        count={slides.length}
        describe={(index) => slides[index].label || `Slide ${index + 1}`}
        onChange={show}
      />
      <div className="flex flex-wrap gap-1">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => show(index)}
            aria-pressed={index === current}
            title={slide.lines.join(" / ")}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors",
              index === current
                ? "border-destructive/60 bg-destructive/18 text-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {slide.label || `Slide ${index + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
};
