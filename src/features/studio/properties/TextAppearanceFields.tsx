import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from "lucide-react";
import type { VerticalAlign } from "../../../types";
import { FONTS, FONT_WEIGHT_OPTIONS } from "../../../data/slideFonts";
import { SwitchField } from "@/components/shared/SwitchField";
import type { TextAlign, TextAppearance } from "../types/layer";
import {
  ChoiceField,
  ColorField,
  FieldRow,
  PropertySection,
  SelectField,
  SliderField,
  type Choice,
} from "./fields";

const ALIGN_CHOICES: Choice<TextAlign>[] = [
  { value: "left", label: "Align left", icon: AlignLeft },
  { value: "center", label: "Align centre", icon: AlignCenter },
  { value: "right", label: "Align right", icon: AlignRight },
  { value: "justify", label: "Justify", icon: AlignJustify },
];

const VERTICAL_CHOICES: Choice<VerticalAlign>[] = [
  { value: "top", label: "Top", icon: AlignVerticalJustifyStart },
  { value: "middle", label: "Middle", icon: AlignVerticalJustifyCenter },
  { value: "bottom", label: "Bottom", icon: AlignVerticalJustifyEnd },
];

const FONT_OPTIONS = FONTS.map((font) => ({ value: font, label: font }));

const MAX_TEXT_SIZE = 600;
const MAX_LINE_SPACING = 4;
const MAX_TEXT_PADDING = 400;

interface TextAppearanceFieldsProps {
  text: TextAppearance;
  onChange: (text: TextAppearance, field: string) => void;
  title?: string;
  sizeLabel?: string;
}

export const TextAppearanceFields = ({
  text,
  onChange,
  title = "Text style",
  sizeLabel = "Text size",
}: TextAppearanceFieldsProps) => {
  const change = <K extends keyof TextAppearance>(
    key: K,
    value: TextAppearance[K],
  ) => onChange({ ...text, [key]: value }, `text.${key}`);

  return (
    <>
      <PropertySection title={title}>
        <FieldRow>
          <SelectField
            label="Font"
            value={text.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) => change("fontFamily", fontFamily)}
          />
          <SelectField
            label="Weight"
            value={String(text.fontWeight)}
            options={FONT_WEIGHT_OPTIONS}
            onChange={(weight) => change("fontWeight", Number(weight))}
          />
        </FieldRow>
        <SliderField
          label={sizeLabel}
          value={text.fontSize}
          min={16}
          max={220}
          typedMax={MAX_TEXT_SIZE}
          suffix="px"
          onChange={(fontSize) => change("fontSize", fontSize)}
        />
        <ColorField
          label="Text colour"
          value={text.color}
          allowGradient
          onChange={(color) => change("color", color)}
        />
        <FieldRow>
          <ChoiceField
            label="Across"
            value={text.align}
            choices={ALIGN_CHOICES}
            onChange={(align) => change("align", align)}
          />
          <ChoiceField
            label="Up and down"
            value={text.verticalAlign}
            choices={VERTICAL_CHOICES}
            onChange={(verticalAlign) => change("verticalAlign", verticalAlign)}
          />
        </FieldRow>
      </PropertySection>

      <PropertySection title="More text options" defaultOpen={false}>
        <SliderField
          label="Line spacing"
          value={text.lineHeight}
          min={0.9}
          max={2.2}
          typedMax={MAX_LINE_SPACING}
          step={0.05}
          onChange={(lineHeight) => change("lineHeight", lineHeight)}
        />
        <SwitchField
          label="Capital letters"
          checked={text.uppercase}
          onChange={(uppercase) => change("uppercase", uppercase)}
        />
        <SwitchField
          label="Soft shadow behind the letters"
          checked={text.shadow}
          onChange={(shadow) => change("shadow", shadow)}
        />
        <SliderField
          label="Space around the text"
          value={text.padding}
          min={0}
          max={160}
          typedMax={MAX_TEXT_PADDING}
          suffix="px"
          onChange={(padding) => change("padding", padding)}
        />
      </PropertySection>
    </>
  );
};
