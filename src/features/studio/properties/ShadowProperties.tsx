import type { Layer, LayerShadow } from "../types/layer";
import { hasShadow } from "../lib/paint";
import { ColorField, PropertySection, SliderField } from "./fields";
import type { LayerEdit } from "./useLayerEditor";

const MAX_SHADOW = 200;

export const ShadowProperties = ({
  layer,
  edit,
}: {
  layer: Layer;
  edit: LayerEdit<Layer>;
}) => {
  const { shadow } = layer;
  const change = (patch: Partial<LayerShadow>, field: string) =>
    edit({ shadow: { ...shadow, ...patch } }, `shadow.${field}`);

  return (
    <PropertySection
      title="Shadow and glow"
      defaultOpen={hasShadow(shadow)}
      info="Softness with no drop makes a glow around the item. Add drop to cast a shadow below it."
    >
      <SliderField
        label="Softness"
        value={shadow.blur}
        min={0}
        max={80}
        typedMax={MAX_SHADOW}
        suffix="px"
        onChange={(blur) => change({ blur }, "blur")}
      />
      <SliderField
        label="Drop"
        value={shadow.distance}
        min={0}
        max={60}
        typedMax={MAX_SHADOW}
        suffix="px"
        onChange={(distance) => change({ distance }, "distance")}
      />
      {hasShadow(shadow) && (
        <>
          <ColorField
            label="Shadow colour"
            value={shadow.color}
            onChange={(color) => change({ color }, "color")}
          />
          <SliderField
            label="Strength"
            value={shadow.opacity}
            min={0}
            max={100}
            suffix="%"
            onChange={(opacity) => change({ opacity }, "opacity")}
          />
        </>
      )}
    </PropertySection>
  );
};
