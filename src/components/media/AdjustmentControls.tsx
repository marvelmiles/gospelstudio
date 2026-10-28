import type { MediaAdjustments } from "../../types";
import { cn } from "../../lib/cn";
import { Field, Range } from "../../components/ui/Field";

interface AdjustmentControlsProps {
  value: MediaAdjustments;
  onChange: (changes: Partial<MediaAdjustments>) => void;
}

export const settingsColumns = (narrow?: boolean): string =>
  narrow ? "grid-cols-1" : "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]";

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
        <Range
          value={value[key]}
          min={min}
          max={max}
          suffix={suffix}
          onChange={(event) => onChange({ [key]: Number(event.target.value) })}
        />
      </Field>
    ))}
  </div>
);
