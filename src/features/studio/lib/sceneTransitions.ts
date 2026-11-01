import {
  fadeOverTransition,
  type LayerMotion,
  type SlideTransition,
} from "../../../lib/animation";
import type { LayerAnimation, LayerEntrance } from "../types/layer";
import type { SceneTransition, SceneTransitionKind } from "../types/scene";

export const DEFAULT_SCENE_TRANSITION: SceneTransition = {
  kind: "crossfade",
  durationMs: 400,
};

export const TRANSITION_DURATION_MIN_MS = 100;
export const TRANSITION_DURATION_MAX_MS = 2000;

export const SCENE_TRANSITION_OPTIONS: {
  value: SceneTransitionKind;
  label: string;
}[] = [
  { value: "crossfade", label: "Crossfade" },
  { value: "fade", label: "Fade through black" },
  { value: "slide", label: "Slide" },
  { value: "cut", label: "Cut (instant)" },
];

export const LAYER_ENTRANCE_OPTIONS: { value: LayerEntrance; label: string }[] =
  [
    { value: "none", label: "No animation" },
    { value: "fade", label: "Fade in" },
    { value: "zoom", label: "Zoom in" },
    { value: "slide-right", label: "Slide in from the left" },
    { value: "slide-left", label: "Slide in from the right" },
    { value: "slide-up", label: "Slide up from below" },
    { value: "slide-down", label: "Slide down from above" },
  ];

const SLIDE_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";

const motion = (
  keyframes: Keyframe[],
  durationMs: number,
  easing: string,
): LayerMotion => ({ keyframes, durationMs, easing });

const INSTANT: SlideTransition = {
  enter: motion([{ opacity: 1 }, { opacity: 1 }], 0, "linear"),
  exit: motion([{ opacity: 0 }], 0, "linear"),
  waitForExit: false,
};

export const sceneTransitionMotion = (
  transition: SceneTransition,
): SlideTransition => {
  const { durationMs } = transition;
  switch (transition.kind) {
    case "cut":
      return INSTANT;
    case "fade":
      return {
        enter: motion(
          [{ opacity: 0 }, { opacity: 1 }],
          durationMs / 2,
          "ease-out",
        ),
        exit: motion([{ opacity: 0 }], durationMs / 2, "ease-in"),
        waitForExit: true,
      };
    case "crossfade":
      return fadeOverTransition(durationMs, "ease-in-out");
    case "slide":
      return {
        enter: motion(
          [{ transform: "translateX(100%)" }, { transform: "none" }],
          durationMs,
          SLIDE_EASING,
        ),
        exit: motion(
          [{ transform: "none" }, { transform: "translateX(-100%)" }],
          durationMs,
          SLIDE_EASING,
        ),
        waitForExit: false,
      };
  }
};

const ENTRANCE_FROM: Record<Exclude<LayerEntrance, "none">, Keyframe> = {
  fade: { opacity: 0 },
  zoom: { opacity: 0, transform: "scale(0.86)" },
  "slide-right": { opacity: 0, transform: "translateX(-30%)" },
  "slide-left": { opacity: 0, transform: "translateX(30%)" },
  "slide-up": { opacity: 0, transform: "translateY(30%)" },
  "slide-down": { opacity: 0, transform: "translateY(-30%)" },
};

const RESTING: Keyframe = { opacity: 1, transform: "none" };

const ENTRANCE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const EXIT_EASING = "cubic-bezier(0.64, 0, 0.78, 0)";

export const layerEntranceMotion = (
  animation: LayerAnimation,
): LayerMotion | null => {
  if (animation.entrance === "none" || animation.durationMs <= 0) return null;
  return motion(
    [ENTRANCE_FROM[animation.entrance], RESTING],
    animation.durationMs,
    ENTRANCE_EASING,
  );
};

export const layerExitMotion = (
  animation: LayerAnimation,
): LayerMotion | null => {
  if (animation.entrance === "none" || animation.durationMs <= 0) return null;
  return motion(
    [RESTING, ENTRANCE_FROM[animation.entrance]],
    Math.round(animation.durationMs * 0.75),
    EXIT_EASING,
  );
};
