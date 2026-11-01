import type { LowerThirdLayer, LowerThirdVariant } from "../types/layer";
import { BackgroundFields } from "./BackgroundFields";
import {
  ChoiceField,
  ColorField,
  PropertySection,
  TextField,
  type Choice,
} from "./fields";
import { TextAppearanceFields } from "./TextAppearanceFields";
import { useLayerEditor } from "./useLayerEditor";

const VARIANT_CHOICES: Choice<LowerThirdVariant>[] = [
  { value: "bar", label: "Panel" },
  { value: "minimal", label: "Simple" },
];

export const LowerThirdProperties = ({ layer }: { layer: LowerThirdLayer }) => {
  const edit = useLayerEditor(layer);
  return (
    <>
      <PropertySection title="Speaker">
        <TextField
          label="Name"
          value={layer.title}
          onChange={(title) => edit({ title }, "title")}
        />
        <TextField
          label="Title or role"
          value={layer.subtitle}
          onChange={(subtitle) => edit({ subtitle }, "subtitle")}
          placeholder="For example Senior Pastor"
        />
        <ChoiceField
          label="Style"
          value={layer.variant}
          choices={VARIANT_CHOICES}
          onChange={(variant) => edit({ variant })}
        />
        <ColorField
          label="Highlight colour"
          value={layer.accent}
          onChange={(accent) => edit({ accent }, "accent")}
        />
      </PropertySection>
      {layer.variant === "bar" && (
        <BackgroundFields
          fill={layer.fill}
          onChange={(fill, field) => edit({ fill }, field)}
        />
      )}
      <TextAppearanceFields
        text={layer.text}
        sizeLabel="Name size"
        onChange={(text, field) => edit({ text }, field)}
      />
    </>
  );
};
