import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Align, ResolvedStyle, TextStyle } from "../../types";
import { FONTS, FONT_WEIGHT_OPTIONS } from "../../data/slideFonts";
import { cn } from "../../lib/cn";
import { TEXT_SHADOW_PRESET } from "../../lib/inlineStyle";
import { Field, Range, Select, TextInput, Toggle } from "../ui/Field";

interface StyleControlsProps {
  style: ResolvedStyle;
  onChange: (key: keyof TextStyle, value: unknown) => void;
}

const ALIGNMENTS: [Align, LucideIcon][] = [
  ["left", AlignLeft],
  ["center", AlignCenter],
  ["right", AlignRight],
];

export const StyleControls = ({ style, onChange }: StyleControlsProps) => {
  return (
    <>
      <Field label="Font Family">
        <Select
          value={style.fontFamily}
          options={FONTS}
          onChange={(e) => onChange("fontFamily", e.target.value)}
        />
      </Field>
      <Field label={`Font Size (${style.fontSize})`}>
        <Range
          value={Number(style.fontSize)}
          min={2.5}
          max={10}
          step={0.1}
          onChange={(e) => onChange("fontSize", Number(e.target.value))}
        />
      </Field>
      <Field label="Weight">
        <Select
          value={String(style.fontWeight)}
          options={FONT_WEIGHT_OPTIONS}
          onChange={(e) => onChange("fontWeight", Number(e.target.value))}
        />
      </Field>
      <Field label="Alignment">
        <div className="flex gap-1.5">
          {ALIGNMENTS.map(([value, Icon]) => {
            const active = style.align === value;
            return (
              <button
                key={value}
                onClick={() => onChange("align", value)}
                className={cn(
                  "grid flex-1 place-items-center rounded-[9px] border p-2.25",
                  active
                    ? "border-accent/35 bg-accent/16 text-accent-soft"
                    : "border-line bg-raise text-sub",
                )}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Text Color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.color}
            onChange={(e) => onChange("color", e.target.value)}
            className="h-9.5 w-10.5 cursor-pointer rounded-[9px] border border-line bg-transparent"
          />
          <TextInput
            value={style.color}
            onChange={(e) => onChange("color", e.target.value)}
          />
        </div>
      </Field>
      <Field label={`Line Height (${style.lineHeight})`}>
        <Range
          value={Number(style.lineHeight)}
          min={1}
          max={2}
          step={0.05}
          onChange={(e) => onChange("lineHeight", Number(e.target.value))}
        />
      </Field>
      <Field label={`Letter Spacing (${style.letterSpacing || 0})`}>
        <Range
          value={Number(style.letterSpacing || 0)}
          min={-1}
          max={2}
          step={0.1}
          onChange={(e) => onChange("letterSpacing", Number(e.target.value))}
        />
      </Field>
      <div className="mb-1.5">
        <Toggle
          label="Uppercase"
          checked={Boolean(style.uppercase)}
          onChange={(checked) => onChange("uppercase", checked)}
        />
      </div>
      <div className="mb-1">
        <Toggle
          label="Text shadow"
          checked={style.textShadow !== "none"}
          onChange={(checked) =>
            onChange("textShadow", checked ? TEXT_SHADOW_PRESET : "none")
          }
        />
      </div>
    </>
  );
};
