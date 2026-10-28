import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const mergeClasses = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas",
        "canvas-2",
        "panel",
        "panel-solid",
        "raise",
        "line",
        "line-strong",
        "accent",
        "accent-soft",
        "on-accent",
        "fg",
        "sub",
        "dim",
        "danger",
        "success",
        "warning",
        "info",
        "danger-fg",
        "success-fg",
        "warning-fg",
        "info-fg",
        "scrim",
        "scrim-strong",
        "glass",
        "track",
        "toggle-off",
        "thumb",
        "stage",
        "stage-overlay",
        "stage-overlay-strong",
        "stage-line",
        "thumbnail",
        "qr-surface",
        "qr-ink",
        "qr-eye",
      ],
    },
  },
});

export const cn = (...inputs: ClassValue[]): string =>
  mergeClasses(clsx(inputs));
