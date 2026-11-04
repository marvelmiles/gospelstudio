import type { SelectOption } from "@/components/shared/OptionSelect";
import { TEXT_SHADOW_PRESET } from "../lib/inlineStyle";

const NO_TEXT_SHADOW = "none";

const OUTLINE_WIDTH_EM = 0.035;

const outline = (color: string): string =>
  [-1, 1]
    .flatMap((x) => [-1, 1].map((y) => [x, y]))
    .map(
      ([x, y]) =>
        `${x * OUTLINE_WIDTH_EM}em ${y * OUTLINE_WIDTH_EM}em 0 ${color}`,
    )
    .join(", ");

const TEXT_SHADOW_OPTIONS: { value: string; label: string }[] = [
  { value: NO_TEXT_SHADOW, label: "None" },
  { value: TEXT_SHADOW_PRESET, label: "Soft glow" },
  { value: "0.04em 0.06em 0.05em rgba(0,0,0,0.85)", label: "Sharp drop" },
  { value: outline("rgba(0,0,0,0.9)"), label: "Outline" },
];

export const textShadowOptions = (current: string): SelectOption[] =>
  TEXT_SHADOW_OPTIONS.some((option) => option.value === current)
    ? TEXT_SHADOW_OPTIONS
    : [...TEXT_SHADOW_OPTIONS, { value: current, label: "Custom" }];
