import { Slider } from "@/components/ui/slider";

interface RangeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  "aria-label"?: string;
}

export const RangeSlider = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  suffix = "",
  "aria-label": ariaLabel,
}: RangeSliderProps) => (
  <div className="flex items-center gap-2.5">
    <Slider
      className="flex-1"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => onValueChange(next)}
    />
    <span className="w-13 text-right text-[12.5px] text-muted-foreground tabular-nums">
      {value}
      {suffix}
    </span>
  </div>
);
