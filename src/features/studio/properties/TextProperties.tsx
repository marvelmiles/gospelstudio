import type { TextLayer, TextPreset } from "../types/layer";
import {
  TEXT_PRESETS,
  TEXT_PRESET_ORDER,
  textPresetPatch,
} from "../lib/textPresets";
import { BackgroundFields } from "./BackgroundFields";
import {
  ChoiceField,
  PropertySection,
  TextAreaField,
  type Choice,
} from "./fields";
import { TextAppearanceFields } from "./TextAppearanceFields";
import { useLayerEditor } from "./useLayerEditor";

const PRESET_CHOICES: Choice<TextPreset>[] = TEXT_PRESET_ORDER.map(
  (preset) => ({
    value: preset,
    label: TEXT_PRESETS[preset].label,
    hint: TEXT_PRESETS[preset].hint,
  }),
);

export const TextProperties = ({ layer }: { layer: TextLayer }) => {
  const edit = useLayerEditor(layer);
  return (
    <>
      <PropertySection title="Words">
        <ChoiceField
          label="Type"
          value={layer.preset}
          choices={PRESET_CHOICES}
          onChange={(preset) => edit(textPresetPatch(preset, layer.text))}
        />
        <TextAreaField
          label="Text"
          value={layer.content}
          onChange={(content) => edit({ content }, "content")}
        />
      </PropertySection>
      <BackgroundFields
        fill={layer.fill}
        onChange={(fill, field) => edit({ fill }, field)}
      />
      <TextAppearanceFields
        text={layer.text}
        onChange={(text, field) => edit({ text }, field)}
      />
    </>
  );
};
