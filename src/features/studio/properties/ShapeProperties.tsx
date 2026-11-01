import type { ShapeKind, ShapeLayer } from "../types/layer";
import { SHAPES } from "../lib/shapeCatalog";
import { ShapeGrid } from "../shapes/ShapeGrid";
import { ColorField, PropertySection, SliderField } from "./fields";
import { useLayerEditor } from "./useLayerEditor";

export const ShapeProperties = ({ layer }: { layer: ShapeLayer }) => {
  const edit = useLayerEditor(layer);
  const changeShape = (shape: ShapeKind) =>
    edit({
      shape,
      radius: SHAPES[shape].radius,
      name:
        layer.name === SHAPES[layer.shape].label
          ? SHAPES[shape].label
          : layer.name,
    });

  return (
    <PropertySection title="Shape">
      <ShapeGrid value={layer.shape} onChoose={changeShape} />
      <ColorField
        label="Fill colour"
        value={layer.fill}
        onChange={(fill) => edit({ fill }, "fill")}
      />
      <SliderField
        label="Fill strength"
        value={layer.fillOpacity}
        min={0}
        max={100}
        suffix="%"
        onChange={(fillOpacity) => edit({ fillOpacity }, "fillOpacity")}
      />
      <SliderField
        label="Border thickness"
        value={layer.borderWidth}
        min={0}
        max={40}
        suffix="px"
        onChange={(borderWidth) => edit({ borderWidth }, "borderWidth")}
      />
      {layer.borderWidth > 0 && (
        <ColorField
          label="Border colour"
          value={layer.borderColor}
          onChange={(borderColor) => edit({ borderColor }, "borderColor")}
        />
      )}
    </PropertySection>
  );
};
