import type { MediaAdjustments } from "../../types";
import { cn } from "../../lib/utils";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { settingsColumns } from "./settingsColumns";

interface AdjustmentControlsProps {
  value: MediaAdjustments;
  onChange: (changes: Partial<MediaAdjustments>) => void;
}

const SLIDERS: {
  key: keyof MediaAdjustments;
  label: string;
  min: number;
  max: number;
  suffix: string;
}[] = [
  { key: "brightness", label: "Brightness", min: 20, max: 200, suffix: "%" },
  { key: "contrast", label: "Contrast", min: 20, max: 200, suffix: "%" },
  { key: "saturation", label: "Saturation", min: 0, max: 200, suffix: "%" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, suffix: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, suffix: "%" },
  { key: "blur", label: "Blur", min: 0, max: 20, suffix: "px" },
];

export const AdjustmentControls = ({
  value,
  onChange,
}: AdjustmentControlsProps) => (
  <div className={cn("grid gap-x-4", settingsColumns())}>
    {SLIDERS.map(({ key, label, min, max, suffix }) => (
      <Field key={key} label={label}>
        <RangeSlider
          value={value[key]}
          min={min}
          max={max}
          suffix={suffix}
          onValueChange={(next) => onChange({ [key]: next })}
        />
      </Field>
    ))}
  </div>
);
