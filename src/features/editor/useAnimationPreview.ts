import { useEffect, useRef, type RefObject } from "react";
import type { AnimationKind } from "../../types";
import { slideTransition } from "../../lib/animation";
import { useStore } from "../../store/useStore";

const MIN_PREVIEW_MS = 450;

interface PreviewedAnimation {
  slideId: string;
  animation: AnimationKind;
  replay: number;
}

export const useAnimationPreview = (
  target: RefObject<HTMLElement | null>,
  { slideId, animation, replay }: PreviewedAnimation,
): void => {
  const durationMs = useStore((s) => s.prefs.transitionDuration);
  const easing = useStore((s) => s.prefs.easing);
  const shown = useRef<PreviewedAnimation>({ slideId, animation, replay });

  useEffect(() => {
    const previous = shown.current;
    shown.current = { slideId, animation, replay };
    const changedOnThisSlide =
      previous.slideId === slideId &&
      (previous.animation !== animation || previous.replay !== replay);
    const element = target.current;
    if (!changedOnThisSlide || !element) return;
    const { enter } = slideTransition(animation, durationMs, easing);
    const playing = element.animate(enter.keyframes, {
      duration: Math.max(MIN_PREVIEW_MS, enter.durationMs),
      easing: enter.easing,
      fill: "backwards",
    });
    return () => playing.cancel();
  }, [animation, durationMs, easing, replay, slideId, target]);
};
