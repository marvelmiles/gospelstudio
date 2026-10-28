import type { DraftEditOptions } from "../hooks/useDraftHistory";

const CONTINUOUS_KEYS = new Set([
  "brightness",
  "contrast",
  "saturation",
  "grayscale",
  "sepia",
  "blur",
  "volume",
  "trimStart",
  "trimEnd",
]);

export const settingsGrouping = (
  changes: object,
  scope: string,
): DraftEditOptions | undefined => {
  const keys = Object.keys(changes);
  return keys.every((key) => CONTINUOUS_KEYS.has(key))
    ? { coalesceKey: `${scope}:${keys.join(",")}` }
    : undefined;
};
