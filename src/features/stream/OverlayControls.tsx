import { useState } from "react";
import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { inputClassName } from "../../components/ui/Field";
import { InfoTip } from "../../components/ui/InfoTip";
import { cn } from "../../lib/cn";

const compactInputClassName = cn(inputClassName, "px-2.5 py-1.75");

const clearButtonClassName =
  "grid size-7.5 shrink-0 place-items-center overflow-hidden rounded-lg border border-transparent bg-transparent p-0 text-dim";

export const OverlaySectionLabel = ({ children }: { children: string }) => (
  <div className="mb-1.75 text-[11.5px] font-bold tracking-[0.4px] text-dim uppercase">
    {children}
  </div>
);

const ControlLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-semibold text-sub">{children}</span>
);

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <span className="mb-1 block">
    <ControlLabel>{children}</ControlLabel>
  </span>
);

export const OverlaySlider = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) => (
  <label className="block">
    <span className="mb-1 flex justify-between">
      <ControlLabel>{label}</ControlLabel>
      {suffix !== undefined && (
        <ControlLabel>
          <span className="text-dim">{`${value}${suffix}`}</span>
        </ControlLabel>
      )}
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full accent-accent"
    />
  </label>
);

export const OverlaySelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <FieldLabel>{label}</FieldLabel>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        compactInputClassName,
        "cursor-pointer appearance-none text-[12.5px]",
      )}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="bg-panel-solid"
        >
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const OverlayCheckbox = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-start gap-2.25">
    <span
      className={cn(
        "relative mt-px grid size-4.25 shrink-0 place-items-center rounded-[5px] border text-on-accent",
        checked
          ? "border-accent bg-accent"
          : "border-line-strong bg-transparent",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="absolute size-0 opacity-0"
      />
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
    <span className="min-w-0">
      <span className="flex items-center gap-1 text-[12.5px] font-semibold text-fg">
        {label}
        {hint && <InfoTip title={label}>{hint}</InfoTip>}
      </span>
    </span>
  </label>
);

export const OverlayColorField = ({
  label,
  value,
  onChange,
  clearLabel = "Transparent",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  clearLabel?: string;
}) => {
  const pickerValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-1.75">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} colour`}
          className="size-7.5 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line bg-transparent p-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={clearLabel}
          aria-label={`${label} value`}
          className={cn(compactInputClassName, "text-xs")}
        />
        {value !== "" && (
          <button
            type="button"
            title={clearLabel}
            aria-label={clearLabel}
            onClick={() => onChange("")}
            className={clearButtonClassName}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export const OverlayImageField = ({
  label,
  pictureName,
  onChoose,
  onClear,
}: {
  label: string;
  pictureName: string | null;
  onChoose: () => void;
  onClear: () => void;
}) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div className="flex items-center gap-1.75">
      <button
        type="button"
        onClick={onChoose}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-[9px] border border-line bg-raise px-2.5 py-1.75 text-left text-xs font-semibold",
          pictureName ? "text-fg" : "text-dim",
        )}
      >
        <ImageIcon size={13} className="shrink-0" />
        <span className="min-w-0 truncate">
          {pictureName ?? "Choose a picture"}
        </span>
      </button>
      {pictureName && (
        <button
          type="button"
          title="Remove the picture"
          aria-label="Remove the picture"
          onClick={onClear}
          className={clearButtonClassName}
        >
          <X size={14} />
        </button>
      )}
    </div>
  </div>
);

export const OverlaySettingsGroup = ({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={cn(
        "rounded-[10px] border border-line",
        open ? "bg-raise/50" : "bg-transparent",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-none bg-transparent px-2.5 py-2 text-[12.5px] font-semibold text-fg"
      >
        <Icon size={14} className="shrink-0 text-accent-soft" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown size={14} className="text-dim" />
        ) : (
          <ChevronRight size={14} className="text-dim" />
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2.75 px-2.5 pt-0.5 pb-2.75">
          {children}
        </div>
      )}
    </div>
  );
};
