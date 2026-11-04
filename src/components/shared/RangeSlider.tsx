import { useRef, useState, type KeyboardEvent } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  readTypedNumber,
  roundForStep,
  steppedNumber,
} from "../../lib/typedNumber";

const SHIFT_STEP_MULTIPLIER = 10;

interface RangeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  inputMin?: number;
  inputMax?: number;
  "aria-label"?: string;
}

export const RangeSlider = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  suffix = "",
  inputMin = min,
  inputMax = max,
  "aria-label": ariaLabel,
}: RangeSliderProps) => (
  <div className="flex items-center gap-2.5">
    <Slider
      className="flex-1"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={[Math.min(max, Math.max(min, value))]}
      onValueChange={([next]) => onValueChange(next)}
    />
    <div className="flex shrink-0 items-center gap-1">
      <TypedValue
        value={value}
        step={step}
        min={inputMin}
        max={inputMax}
        label={ariaLabel ? `${ariaLabel} value` : "Value"}
        onCommit={onValueChange}
      />
      {suffix && (
        <span className="min-w-3.5 text-[12px] text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

interface TypedValueProps {
  value: number;
  step: number;
  min: number;
  max: number;
  label: string;
  onCommit: (value: number) => void;
}

const TypedValue = ({
  value,
  step,
  min,
  max,
  label,
  onCommit,
}: TypedValueProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const isCancelling = useRef(false);

  const commit = () => {
    const typed = isCancelling.current ? null : draft;
    isCancelling.current = false;
    setDraft(null);
    if (typed === null) return;
    const next = readTypedNumber(typed, min, max);
    if (next !== null && next !== value) onCommit(next);
  };

  const nudge = (direction: 1 | -1, large: boolean) => {
    const delta = direction * step * (large ? SHIFT_STEP_MULTIPLIER : 1);
    setDraft(null);
    onCommit(roundForStep(steppedNumber(value, delta, min, max), step));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      isCancelling.current = true;
      event.currentTarget.blur();
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      nudge(event.key === "ArrowUp" ? 1 : -1, event.shiftKey);
    }
  };

  return (
    <Input
      value={draft ?? String(roundForStep(value, step))}
      inputMode="decimal"
      aria-label={label}
      title={`Type a value from ${min} to ${max}`}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className="h-7 w-14 px-1.5 text-right text-[12.5px] tabular-nums"
    />
  );
};
