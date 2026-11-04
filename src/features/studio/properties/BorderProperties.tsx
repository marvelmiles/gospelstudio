import type { Layer, LayerBorder } from "../types/layer";
import { hasBorder } from "../lib/paint";
import { PropertySection, SliderField } from "./fields";
import { PaintFields } from "./PaintFields";
import type { LayerEdit } from "./useLayerEditor";

const SLIDER_MAX_WIDTH = 60;
const MAX_WIDTH = 300;

export const BorderProperties = ({
  layer,
  edit,
}: {
  layer: Layer;
  edit: LayerEdit<Layer>;
}) => {
  const { border } = layer;
  const change = (patch: Partial<LayerBorder>, field: string) =>
    edit({ border: { ...border, ...patch } }, `border.${field}`);

  return (
    <PropertySection
      title="Border"
      defaultOpen={hasBorder(border)}
      info="The border is drawn just inside the edge, so the item keeps its size."
    >
      <SliderField
        label="Thickness"
        value={border.width}
        min={0}
        max={SLIDER_MAX_WIDTH}
        typedMax={MAX_WIDTH}
        suffix="px"
        onChange={(width) => change({ width }, "width")}
      />
      {hasBorder(border) && (
        <PaintFields
          label="Border colour"
          color={border.color}
          gradient={border.gradient}
          onChange={(color, gradient, field) =>
            change({ color, gradient }, field)
          }
        />
      )}
    </PropertySection>
  );
};
