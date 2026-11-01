import type { AnnouncementLayer, AnnouncementVariant } from "../types/layer";
import { BackgroundFields } from "./BackgroundFields";
import {
  ChoiceField,
  ColorField,
  PropertySection,
  SliderField,
  TextAreaField,
  TextField,
  type Choice,
} from "./fields";
import { TextAppearanceFields } from "./TextAppearanceFields";
import { useLayerEditor } from "./useLayerEditor";

const VARIANT_CHOICES: Choice<AnnouncementVariant>[] = [
  { value: "card", label: "Card" },
  { value: "ticker", label: "Scrolling" },
];

export const AnnouncementProperties = ({
  layer,
}: {
  layer: AnnouncementLayer;
}) => {
  const edit = useLayerEditor(layer);
  return (
    <>
      <PropertySection title="Announcement">
        <ChoiceField
          label="Style"
          value={layer.variant}
          choices={VARIANT_CHOICES}
          onChange={(variant) => edit({ variant })}
        />
        <TextField
          label={layer.variant === "ticker" ? "Label" : "Heading"}
          value={layer.heading}
          onChange={(heading) => edit({ heading }, "heading")}
        />
        <TextAreaField
          label="Message"
          value={layer.body}
          onChange={(body) => edit({ body }, "body")}
        />
        <TextField
          label="Details, like a date or website"
          value={layer.detail}
          onChange={(detail) => edit({ detail }, "detail")}
        />
        <ColorField
          label="Highlight colour"
          value={layer.accent}
          onChange={(accent) => edit({ accent }, "accent")}
        />
        {layer.variant === "ticker" && (
          <SliderField
            label="Seconds to cross the screen"
            value={layer.tickerSeconds}
            min={4}
            max={40}
            suffix="s"
            onChange={(tickerSeconds) =>
              edit({ tickerSeconds }, "tickerSeconds")
            }
          />
        )}
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
