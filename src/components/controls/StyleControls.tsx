import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  Align,
  ResolvedStyle,
  TextStyle,
  VerticalAlign,
} from "../../types";
import { FONTS, FONT_WEIGHT_OPTIONS } from "../../data/slideFonts";
import { textShadowOptions } from "../../data/textShadows";
import { cn } from "../../lib/utils";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { ColorInput } from "@/components/shared/ColorInput";
import { SwitchField } from "@/components/shared/SwitchField";

interface StyleControlsProps {
  style: ResolvedStyle;
  onChange: (key: keyof TextStyle, value: unknown) => void;
  showPosition?: boolean;
}

interface IconChoice<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

const ALIGNMENTS: IconChoice<Align>[] = [
  { value: "left", label: "Align left", icon: AlignLeft },
  { value: "center", label: "Align centre", icon: AlignCenter },
  { value: "right", label: "Align right", icon: AlignRight },
];

const POSITIONS: IconChoice<VerticalAlign>[] = [
  { value: "top", label: "Top", icon: AlignVerticalJustifyStart },
  { value: "middle", label: "Middle", icon: AlignVerticalJustifyCenter },
  { value: "bottom", label: "Bottom", icon: AlignVerticalJustifyEnd },
];

const IconChoices = <T extends string>({
  choices,
  value,
  onSelect,
}: {
  choices: IconChoice<T>[];
  value: T;
  onSelect: (value: T) => void;
}) => (
  <div className="flex gap-1.5">
    {choices.map((choice) => {
      const active = value === choice.value;
      return (
        <button
          key={choice.value}
          type="button"
          title={choice.label}
          aria-label={choice.label}
          aria-pressed={active}
          onClick={() => onSelect(choice.value)}
          className={cn(
            "grid flex-1 place-items-center rounded-[9px] border p-2.25",
            active
              ? "border-primary/35 bg-primary/16 text-primary-soft"
              : "border-border bg-secondary text-muted-foreground",
          )}
        >
          <choice.icon size={16} />
        </button>
      );
    })}
  </div>
);

export const StyleControls = ({
  style,
  onChange,
  showPosition = false,
}: StyleControlsProps) => {
  return (
    <>
      <Field label="Font Family">
        <OptionSelect
          value={style.fontFamily}
          options={FONTS}
          onValueChange={(next) => onChange("fontFamily", next)}
        />
      </Field>
      <Field label="Font Size">
        <RangeSlider
          aria-label="Font size"
          value={Number(style.fontSize)}
          min={2.5}
          max={10}
          step={0.1}
          inputMin={1}
          inputMax={20}
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
        <IconChoices
          choices={ALIGNMENTS}
          value={style.align}
          onSelect={(align) => onChange("align", align)}
        />
      </Field>
      {showPosition && (
        <Field label="Text position">
          <IconChoices
            choices={POSITIONS}
            value={style.verticalAlign ?? "middle"}
            onSelect={(position) => onChange("verticalAlign", position)}
          />
        </Field>
      )}
      <Field label="Text Color">
        <ColorInput
          aria-label="Text colour"
          value={style.color}
          onChange={(color) => onChange("color", color)}
        />
      </Field>
      <Field label="Line Height">
        <RangeSlider
          aria-label="Line height"
          value={Number(style.lineHeight)}
          min={1}
          max={2}
          step={0.05}
          inputMin={0.8}
          inputMax={3}
          onValueChange={(next) => onChange("lineHeight", next)}
        />
      </Field>
      <Field label="Letter Spacing">
        <RangeSlider
          aria-label="Letter spacing"
          value={Number(style.letterSpacing || 0)}
          min={-1}
          max={2}
          step={0.1}
          inputMin={-2}
          inputMax={5}
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
      <Field label="Text shadow">
        <OptionSelect
          value={style.textShadow}
          options={textShadowOptions(style.textShadow)}
          onValueChange={(next) => onChange("textShadow", next)}
        />
      </Field>
    </>
  );
};
