import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Align, ResolvedStyle, TextStyle } from "../../types";
import { FONTS, FONT_WEIGHT_OPTIONS } from "../../data/slideFonts";
import { cn } from "../../lib/utils";
import { TEXT_SHADOW_PRESET } from "../../lib/inlineStyle";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Input } from "@/components/ui/input";
import { SwitchField } from "@/components/shared/SwitchField";

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
        <OptionSelect
          value={style.fontFamily}
          options={FONTS}
          onValueChange={(next) => onChange("fontFamily", next)}
        />
      </Field>
      <Field label={`Font Size (${style.fontSize})`}>
        <RangeSlider
          value={Number(style.fontSize)}
          min={2.5}
          max={10}
          step={0.1}
          onValueChange={(next) => onChange("fontSize", next)}
        />
      </Field>
      <Field label="Weight">
        <OptionSelect
          value={String(style.fontWeight)}
          options={FONT_WEIGHT_OPTIONS}
          onValueChange={(next) => onChange("fontWeight", next)}
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
                    ? "border-primary/35 bg-primary/16 text-primary-soft"
                    : "border-border bg-secondary text-muted-foreground",
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
            className="h-9.5 w-10.5 cursor-pointer rounded-[9px] border border-border bg-transparent"
          />
          <Input
            value={style.color}
            onChange={(e) => onChange("color", e.target.value)}
          />
        </div>
      </Field>
      <Field label={`Line Height (${style.lineHeight})`}>
        <RangeSlider
          value={Number(style.lineHeight)}
          min={1}
          max={2}
          step={0.05}
          onValueChange={(next) => onChange("lineHeight", next)}
        />
      </Field>
      <Field label={`Letter Spacing (${style.letterSpacing || 0})`}>
        <RangeSlider
          value={Number(style.letterSpacing || 0)}
          min={-1}
          max={2}
          step={0.1}
          onValueChange={(next) => onChange("letterSpacing", next)}
        />
      </Field>
      <div className="mb-1.5">
        <SwitchField
          label="Uppercase"
          checked={Boolean(style.uppercase)}
          onChange={(checked) => onChange("uppercase", checked)}
        />
      </div>
      <div className="mb-1">
        <SwitchField
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
