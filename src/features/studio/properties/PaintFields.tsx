import { SwitchField } from "@/components/shared/SwitchField";
import { isGradientValue } from "../../../lib/cssColors";
import type { Gradient } from "../types/layer";
import { DEFAULT_GRADIENT } from "../lib/paint";
import { ColorField, SliderField } from "./fields";

interface PaintFieldsProps {
  label: string;
  color: string;
  gradient: Gradient | null;
  onChange: (color: string, gradient: Gradient | null, field: string) => void;
}

export const PaintFields = ({
  label,
  color,
  gradient,
  onChange,
}: PaintFieldsProps) => {
  const blend = isGradientValue(color) ? null : gradient;

  return (
    <>
      <ColorField
        label={blend ? `${label} (start)` : label}
        value={color}
        allowGradient
        onChange={(next) => onChange(next, gradient, "color")}
      />
      {!isGradientValue(color) && (
        <SwitchField
          label="Blend into a second colour"
          checked={blend !== null}
          onChange={(isBlended) =>
            onChange(
              color,
              isBlended ? { ...DEFAULT_GRADIENT } : null,
              "gradient",
            )
          }
        />
      )}
      {blend && (
        <>
          <ColorField
            label={`${label} (end)`}
            value={blend.to}
            onChange={(to) => onChange(color, { ...blend, to }, "gradient.to")}
          />
          <SliderField
            label="Blend direction"
            value={blend.angle}
            min={0}
            max={360}
            step={5}
            suffix="°"
            onChange={(angle) =>
              onChange(color, { ...blend, angle }, "gradient.angle")
            }
          />
        </>
      )}
    </>
  );
};
