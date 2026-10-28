export const SCREEN_FIT_OPTIONS = [
  { value: "contain", label: "Contain (fit, letterboxed)" },
  { value: "cover", label: "Cover (fill, may crop)" },
  { value: "fill", label: "Fill (stretch)" },
];

export const PLAYBACK_RATE_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(
  (rate) => ({ value: String(rate), label: `${rate}x` }),
);
