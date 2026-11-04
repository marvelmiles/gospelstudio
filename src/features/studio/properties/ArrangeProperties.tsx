import {
  Columns2,
  Maximize,
  PictureInPicture2,
  Scan,
  type LucideIcon,
} from "lucide-react";
import type { Layer, LayerEntrance, LayerFrame } from "../types/layer";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FULL_FRAME,
  centeredFrame,
  clampDimensions,
  clampPosition,
  percentFrame,
} from "../lib/canvasCoordinates";
import { LAYER_ENTRANCE_OPTIONS } from "../lib/sceneTransitions";
import { setLayerFrame } from "../store/layerActions";
import { BorderProperties } from "./BorderProperties";
import { CornerFields } from "./CornerFields";
import { ShadowProperties } from "./ShadowProperties";
import {
  FieldRow,
  NumberField,
  PropertySection,
  SelectField,
  SliderField,
} from "./fields";
import type { LayerEdit } from "./useLayerEditor";

interface QuickPlacement {
  label: string;
  icon: LucideIcon;
  frame: (layer: Layer) => LayerFrame;
}

const QUICK_PLACEMENTS: QuickPlacement[] = [
  { label: "Fill the screen", icon: Maximize, frame: () => FULL_FRAME },
  {
    label: "Centre it",
    icon: Scan,
    frame: (layer) => centeredFrame(layer.dimensions),
  },
  {
    label: "Left half",
    icon: Columns2,
    frame: () => percentFrame(0, 0, 50, 100),
  },
  {
    label: "Small corner window",
    icon: PictureInPicture2,
    frame: () => percentFrame(68, 63, 29, 31),
  },
];

export const ArrangeProperties = ({
  layer,
  edit,
}: {
  layer: Layer;
  edit: LayerEdit<Layer>;
}) => {
  const { position, dimensions } = layer;
  const isLocked = layer.locked;

  return (
    <>
      <PropertySection
        title="Position and size"
        defaultOpen={false}
        info={
          isLocked
            ? "This item is locked in place. Unlock it from its menu to move or resize it."
            : undefined
        }
      >
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_PLACEMENTS.map((quick) => (
            <button
              key={quick.label}
              type="button"
              title={quick.label}
              aria-label={quick.label}
              disabled={isLocked}
              onClick={() => setLayerFrame(layer.id, quick.frame(layer))}
              className="grid h-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary-soft disabled:pointer-events-none disabled:opacity-50"
            >
              <quick.icon size={16} />
            </button>
          ))}
        </div>
        <FieldRow>
          <NumberField
            label="Left (X)"
            value={position.x}
            min={-CANVAS_WIDTH}
            max={CANVAS_WIDTH}
            onChange={(x) =>
              edit(
                { position: clampPosition({ ...position, x }, dimensions) },
                "x",
              )
            }
          />
          <NumberField
            label="Top (Y)"
            value={position.y}
            min={-CANVAS_HEIGHT}
            max={CANVAS_HEIGHT}
            onChange={(y) =>
              edit(
                { position: clampPosition({ ...position, y }, dimensions) },
                "y",
              )
            }
          />
          <NumberField
            label="Width"
            value={dimensions.width}
            min={40}
            max={CANVAS_WIDTH * 2}
            onChange={(width) =>
              edit(
                { dimensions: clampDimensions({ ...dimensions, width }) },
                "width",
              )
            }
          />
          <NumberField
            label="Height"
            value={dimensions.height}
            min={40}
            max={CANVAS_HEIGHT * 2}
            onChange={(height) =>
              edit(
                { dimensions: clampDimensions({ ...dimensions, height }) },
                "height",
              )
            }
          />
        </FieldRow>
        <p className="m-0 text-[11.5px] text-subtle-foreground">
          The screen is {CANVAS_WIDTH} by {CANVAS_HEIGHT}. Arrow keys nudge the
          selected layer, and Shift moves it further.
        </p>
      </PropertySection>

      <PropertySection title="Look" defaultOpen={false}>
        <SliderField
          label="Opacity"
          value={layer.opacity}
          min={0}
          max={100}
          suffix="%"
          onChange={(opacity) => edit({ opacity }, "opacity")}
        />
        <CornerFields layer={layer} edit={edit} />
        <SliderField
          label="Rotation"
          value={layer.rotation}
          min={-180}
          max={180}
          suffix="°"
          onChange={(rotation) => edit({ rotation }, "rotation")}
        />
      </PropertySection>

      <BorderProperties layer={layer} edit={edit} />
      <ShadowProperties layer={layer} edit={edit} />

      <PropertySection title="Animation" defaultOpen={false}>
        <SelectField
          label="When it appears"
          value={layer.animation.entrance}
          options={LAYER_ENTRANCE_OPTIONS}
          onChange={(entrance) =>
            edit({
              animation: {
                ...layer.animation,
                entrance: entrance as LayerEntrance,
              },
            })
          }
        />
        {layer.animation.entrance !== "none" && (
          <SliderField
            label="Speed"
            value={layer.animation.durationMs}
            min={150}
            max={1500}
            step={50}
            suffix="ms"
            onChange={(durationMs) =>
              edit(
                { animation: { ...layer.animation, durationMs } },
                "animation",
              )
            }
          />
        )}
        <p className="m-0 text-[11.5px] leading-snug text-subtle-foreground">
          It plays on the live screen when this layer appears, and in reverse
          when it is hidden.
        </p>
      </PropertySection>
    </>
  );
};
