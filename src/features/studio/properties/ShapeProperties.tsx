import type { ShapeKind, ShapeLayer } from "../types/layer";
import { SHAPES } from "../lib/shapeCatalog";
import { ShapeGrid } from "../shapes/ShapeGrid";
import { PropertySection, SliderField } from "./fields";
import { PaintFields } from "./PaintFields";
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
      <PaintFields
        label="Fill colour"
        color={layer.fill}
        gradient={layer.gradient}
        onChange={(fill, gradient, field) =>
          edit({ fill, gradient }, `fill.${field}`)
        }
      />
      <SliderField
        label="Fill strength"
        value={layer.fillOpacity}
        min={0}
        max={100}
        suffix="%"
        onChange={(fillOpacity) => edit({ fillOpacity }, "fillOpacity")}
      />
    </PropertySection>
  );
};
