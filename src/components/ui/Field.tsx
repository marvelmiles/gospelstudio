import { forwardRef } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";

export const inputClassName =
  "w-full rounded-[10px] border border-line bg-black/28 px-3.25 py-2.5 text-sm text-fg outline-none focus:border-line-strong";

interface FieldProps {
  label: string;
  info?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export const Field = ({ label, info, error, children }: FieldProps) => (
  <label className="mb-3.25 block">
    <span
      className={cn(
        "mb-1.5 block text-[11.5px] font-semibold tracking-[0.4px] uppercase",
        error ? "text-danger" : "text-dim",
        info && "flex items-center gap-1",
      )}
    >
      {label}
      {info}
    </span>
    {children}
    {error && (
      <span
        role="alert"
        className="mt-1.5 block text-[11.5px] leading-[1.45] text-danger"
      >
        {error}
      </span>
    )}
  </label>
);

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, invalid, ...rest }, ref) => (
    <input
      {...rest}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputClassName,
        invalid && "border-danger focus:border-danger",
        className,
      )}
    />
  ),
);

TextInput.displayName = "TextInput";

type Option = string | { value: string; label: string };

interface SelectProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  className?: string;
  "aria-label"?: string;
}

export const Select = ({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: SelectProps) => (
  <select
    value={value}
    onChange={onChange}
    aria-label={ariaLabel}
    className={cn(inputClassName, "cursor-pointer appearance-none", className)}
  >
    {options.map((option) => {
      const optionValue = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;
      return (
        <option
          key={optionValue}
          value={optionValue}
          className="bg-panel-solid"
        >
          {label}
        </option>
      );
    })}
  </select>
);

export const sliderFill = (percent: number): string =>
  `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-soft) ${percent}%, var(--color-track) ${percent}%)`;

interface RangeProps {
  value: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

export const Range = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = "",
}: RangeProps) => {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range"
        className="slider flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        style={{ background: sliderFill(percent) }}
      />
      <span className="w-13 text-right text-[12.5px] text-sub tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
  );
};

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export const Toggle = ({ checked, onChange, label }: ToggleProps) => (
  <div
    onClick={() => onChange(!checked)}
    className="flex cursor-pointer items-center justify-between py-1"
  >
    <span className="text-[13.5px] text-fg">{label}</span>
    <div
      className={cn(
        "h-5.75 w-10 rounded-full p-0.5 transition-all duration-200",
        checked
          ? "bg-accent shadow-[0_2px_12px_rgb(37_99_235/0.45)]"
          : "bg-toggle-off",
      )}
    >
      <div
        className={cn(
          "size-4.75 rounded-full bg-thumb transition-all duration-200",
          checked && "translate-x-4.25",
        )}
      />
    </div>
  </div>
);

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const Checkbox = ({ checked, onChange, label }: CheckboxProps) => (
  <label className="inline-flex cursor-pointer items-center gap-2.25 text-[13px] text-sub">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="sr-only"
    />
    <span
      aria-hidden
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-[5px] border text-on-accent transition-all duration-150",
        checked
          ? "border-accent bg-accent"
          : "border-line-strong bg-transparent",
      )}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
    {label}
  </label>
);

interface SectionTitleProps {
  children: ReactNode;
  info?: ReactNode;
}

export const SectionTitle = ({ children, info }: SectionTitleProps) => (
  <div className="mt-6.5 mb-3.5 flex items-center gap-1.5 border-b border-line pb-2.25 text-xs font-bold tracking-[0.6px] text-accent uppercase">
    {children}
    {info}
  </div>
);
