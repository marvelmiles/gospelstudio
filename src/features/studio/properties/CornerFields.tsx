import { SwitchField } from "@/components/shared/SwitchField";
import type { CornerRadii, Layer } from "../types/layer";
import { CORNER_ORDER, evenCorners } from "../lib/corners";
import { NumberField, SliderField } from "./fields";
import type { LayerEdit } from "./useLayerEditor";

const SLIDER_MAX_RADIUS = 200;
const MAX_RADIUS = 960;

const CORNER_LABELS: Record<keyof CornerRadii, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomLeft: "Bottom left",
  bottomRight: "Bottom right",
};

export const CornerFields = ({
  layer,
  edit,
}: {
  layer: Layer;
  edit: LayerEdit<Layer>;
}) => {
  const { corners } = layer;

  return (
    <div className="flex flex-col gap-2">
      {corners ? (
        <div className="grid grid-cols-2 gap-2">
          {CORNER_ORDER.map((corner) => (
            <NumberField
              key={corner}
              label={CORNER_LABELS[corner]}
              value={corners[corner]}
              min={0}
              max={MAX_RADIUS}
              onChange={(radius) =>
                edit(
                  { corners: { ...corners, [corner]: radius } },
                  `corners.${corner}`,
                )
              }
            />
          ))}
        </div>
      ) : (
        <SliderField
          label="Rounded corners"
          value={layer.radius}
          min={0}
          max={SLIDER_MAX_RADIUS}
          typedMax={MAX_RADIUS}
          suffix="px"
          onChange={(radius) => edit({ radius }, "radius")}
        />
      )}
      <SwitchField
        label="Round each corner separately"
        checked={corners !== null}
        onChange={(separate) =>
          edit({ corners: separate ? evenCorners(layer.radius) : null })
        }
      />
    </div>
  );
};
