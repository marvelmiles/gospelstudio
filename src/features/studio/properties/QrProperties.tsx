import type { QrLayer } from "../types/layer";
import { ColorField, FieldRow, PropertySection, TextField } from "./fields";
import { useLayerEditor } from "./useLayerEditor";

export const QrProperties = ({ layer }: { layer: QrLayer }) => {
  const edit = useLayerEditor(layer);
  return (
    <PropertySection
      title="QR code"
      info="Keep a dark code on a light card so phones can read it from the back of the room. Test it with your own phone before the service."
    >
      <TextField
        label="Link or text"
        value={layer.value}
        onChange={(value) => edit({ value }, "value")}
        placeholder="https://yourchurch.org/connect"
      />
      <TextField
        label="Caption under the code"
        value={layer.caption}
        onChange={(caption) => edit({ caption }, "caption")}
      />
      <FieldRow>
        <ColorField
          label="Code colour"
          value={layer.foreground}
          onChange={(foreground) => edit({ foreground }, "foreground")}
        />
        <ColorField
          label="Card colour"
          value={layer.background}
          onChange={(background) => edit({ background }, "background")}
        />
      </FieldRow>
    </PropertySection>
  );
};
