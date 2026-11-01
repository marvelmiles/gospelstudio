import { useRef, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { resolveAutoPlay } from "../../../lib/resolve";
import { MiniButton } from "@/components/shared/MiniButton";
import type { DeckLayer } from "../types/layer";
import { clampIndex } from "../lib/slidePosition";
import { useDeckLook } from "../hooks/useContentLook";
import { showItemSlide } from "../store/itemActions";
import { toggleAutoPlayPaused, useIsAutoPlayPaused } from "./pipStore";
import { PipFrame } from "./PipFrame";
import { PipToolbar } from "./PipToolbar";

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown", "PageDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp", "PageUp"]);
const DIGIT = /^[0-9]$/;

interface DeckPipProps {
  layer: DeckLayer;
  isLive: boolean;
  sceneName: string;
  stackIndex: number;
}

export const DeckPip = ({
  layer,
  isLive,
  sceneName,
  stackIndex,
}: DeckPipProps) => {
  const { doc, theme } = useDeckLook(layer);
  const isPaused = useIsAutoPlayPaused(layer.id);
  const typedNumber = useRef("");
  const slides = doc?.slides ?? [];
  const count = slides.length;
  const index = clampIndex(layer.slideIndex, count);
  const slide = slides[index];
  const autoPlays = Boolean(doc && theme && resolveAutoPlay(doc, theme));
  const canStepAutoPlay = autoPlays && isLive;

  const show = (target: number) => {
    if (count === 0) return;
    const next = clampIndex(target, count);
    if (next !== index) showItemSlide(layer.id, next);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>): boolean => {
    if (event.ctrlKey && DIGIT.test(event.key)) {
      typedNumber.current += event.key;
      return true;
    }
    if (NEXT_KEYS.has(event.key)) show(index + 1);
    else if (PREVIOUS_KEYS.has(event.key)) show(index - 1);
    else if (event.key === "Home") show(0);
    else if (event.key === "End") show(count - 1);
    else if (event.key === " " && canStepAutoPlay)
      toggleAutoPlayPaused(layer.id);
    else return false;
    return true;
  };

  const jumpToTypedNumber = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Control" || !typedNumber.current) return;
    show(Number(typedNumber.current) - 1);
    typedNumber.current = "";
  };

  return (
    <PipFrame
      layer={layer}
      isLive={isLive}
      sceneName={sceneName}
      stackIndex={stackIndex}
      notes={slide?.notes?.trim() || undefined}
      shortcutsHint="Shortcuts active: arrows, Home, End, Ctrl+number, Space, Esc."
      onKeyDown={handleKey}
      onKeyUp={jumpToTypedNumber}
      controls={
        <PipToolbar layerId={layer.id}>
          {count > 1 && (
            <MiniButton
              icon={ChevronLeft}
              title="Previous slide (Left arrow)"
              disabled={index === 0}
              onClick={() => show(index - 1)}
            />
          )}
          {canStepAutoPlay && (
            <MiniButton
              icon={isPaused ? Play : Pause}
              title={
                isPaused
                  ? "Resume auto play (Space)"
                  : "Pause auto play (Space)"
              }
              active={isPaused}
              onClick={() => toggleAutoPlayPaused(layer.id)}
            />
          )}
          {count > 1 && (
            <MiniButton
              icon={ChevronRight}
              title="Next slide (Right arrow)"
              disabled={index >= count - 1}
              onClick={() => show(index + 1)}
            />
          )}
          <span className="min-w-0 flex-1 truncate text-center text-[10.5px] font-semibold text-subtle-foreground tabular-nums">
            {count > 0 ? `${index + 1}/${count}` : "No slides"}
            {slide?.label ? ` · ${slide.label}` : ""}
          </span>
        </PipToolbar>
      }
    />
  );
};
