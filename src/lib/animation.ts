import type { AnimationKind, EasingKind } from "../types";

export const ANIMATION_OPTIONS: { value: AnimationKind; label: string }[] = [
  { value: "fade", label: "Fade" },
  { value: "crossfade", label: "Cross Fade" },
  { value: "dissolve", label: "Dissolve" },
  { value: "zoom", label: "Zoom" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
];

export interface LayerMotion {
  keyframes: Keyframe[];
  durationMs: number;
  easing: string;
  delayMs?: number;
}

export interface SlideTransition {
  enter: LayerMotion;
  exit: LayerMotion;
  waitForExit: boolean;
}

interface TransitionShape {
  enterFrom: Keyframe;
  exitTo: Keyframe;
  clearsFirst?: boolean;
}

const SLIDE_DISTANCE = "16%";
const ZOOM_FROM = "scale(0.88)";
const ZOOM_PAST = "scale(1.12)";
const DISSOLVE_BLUR = "blur(14px)";

const SHAPES: Record<AnimationKind, TransitionShape> = {
  fade: { enterFrom: {}, exitTo: {}, clearsFirst: true },
  crossfade: { enterFrom: {}, exitTo: {} },
  dissolve: {
    enterFrom: { filter: DISSOLVE_BLUR },
    exitTo: { filter: DISSOLVE_BLUR },
  },
  zoom: {
    enterFrom: { transform: ZOOM_FROM },
    exitTo: { transform: ZOOM_PAST },
  },
  "slide-left": {
    enterFrom: { transform: `translateX(${SLIDE_DISTANCE})` },
    exitTo: { transform: `translateX(-${SLIDE_DISTANCE})` },
  },
  "slide-right": {
    enterFrom: { transform: `translateX(-${SLIDE_DISTANCE})` },
    exitTo: { transform: `translateX(${SLIDE_DISTANCE})` },
  },
  "slide-up": {
    enterFrom: { transform: `translateY(${SLIDE_DISTANCE})` },
    exitTo: { transform: `translateY(-${SLIDE_DISTANCE})` },
  },
  "slide-down": {
    enterFrom: { transform: `translateY(-${SLIDE_DISTANCE})` },
    exitTo: { transform: `translateY(${SLIDE_DISTANCE})` },
  },
};

const RESTING: Keyframe = {
  transform: "none",
  filter: "none",
};

const CSS_EASING: Record<EasingKind, string> = {
  ease: "ease-in-out",
  "ease-in-out": "ease-in-out",
  "ease-out": "ease-out",
  linear: "linear",
};

const OUTGOING_GONE_AT = 0.55;
const INCOMING_SHOWS_FROM = 0.3;

const CLEAR_SHARE = 0.35;
const MAX_CLEAR_MS = 180;

const restingKeysOf = (keyframe: Keyframe): Keyframe =>
  Object.fromEntries(
    Object.keys(keyframe).map((key) => [key, RESTING[key]]),
  ) as Keyframe;

interface TransitionOptions {
  opaque?: boolean;
}

export const slideTransition = (
  animation: AnimationKind,
  durationMs: number,
  easing: EasingKind,
  { opaque = false }: TransitionOptions = {},
): SlideTransition => {
  const shape = SHAPES[animation] ?? SHAPES.fade;
  const curve = CSS_EASING[easing] ?? CSS_EASING.ease;
  const clearsFirst = Boolean(shape.clearsFirst) && !opaque;
  const staggered = Boolean(shape.exitTo.transform) && !opaque;

  const enter: LayerMotion = {
    keyframes: [
      { opacity: 0, ...shape.enterFrom, offset: 0 },
      ...(staggered ? [{ opacity: 0, offset: INCOMING_SHOWS_FROM }] : []),
      { opacity: 1, ...restingKeysOf(shape.enterFrom), offset: 1 },
    ],
    durationMs,
    easing: curve,
  };

  const exit: LayerMotion = clearsFirst
    ? {
        keyframes: [{ opacity: 0 }],
        durationMs: Math.min(MAX_CLEAR_MS, durationMs * CLEAR_SHARE),
        easing: "ease-out",
      }
    : {
        keyframes: staggered
          ? [
              { opacity: 0, offset: OUTGOING_GONE_AT },
              { opacity: 0, ...shape.exitTo, offset: 1 },
            ]
          : [{ opacity: 0, ...shape.exitTo }],
        durationMs,
        easing: opaque && !shape.exitTo.transform ? "ease-in" : curve,
      };

  return { enter, exit, waitForExit: clearsFirst };
};

export const fadeOverTransition = (
  durationMs: number,
  easing: EasingKind,
): SlideTransition => ({
  enter: slideTransition("crossfade", durationMs, easing).enter,
  exit: { keyframes: [{ opacity: 1 }], durationMs, easing: "linear" },
  waitForExit: false,
});
