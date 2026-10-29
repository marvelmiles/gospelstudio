import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, Image as ImageIcon, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTip } from "@/components/shared/InfoTip";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { cn } from "../../lib/utils";

export const OverlaySectionLabel = ({ children }: { children: string }) => (
  <div className="mb-1.75 text-[11.5px] font-bold tracking-[0.4px] text-subtle-foreground uppercase">
    {children}
  </div>
);

const ControlLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-xs font-semibold text-muted-foreground">
    {children}
  </span>
);

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <span className="mb-1 block">
    <ControlLabel>{children}</ControlLabel>
  </span>
);

const ClearButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <Button
    variant="ghost"
    size="icon-sm"
    title={label}
    aria-label={label}
    onClick={onClick}
    className="text-subtle-foreground"
  >
    <X />
  </Button>
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
  <div>
    <span className="mb-2 flex justify-between">
      <ControlLabel>{label}</ControlLabel>
      {suffix !== undefined && (
        <ControlLabel>
          <span className="text-subtle-foreground">{`${value}${suffix}`}</span>
        </ControlLabel>
      )}
    </span>
    <Slider
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={([next]) => onChange(next)}
    />
  </div>
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
  <div>
    <FieldLabel>{label}</FieldLabel>
    <OptionSelect
      aria-label={label}
      value={value}
      options={options}
      onValueChange={onChange}
      className="h-8 text-[12.5px]"
    />
  </div>
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
}) => {
  const id = useId();
  return (
    <div className="flex items-start gap-2.25">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className="mt-px"
      />
      <span className="flex min-w-0 items-center gap-1">
        <Label
          htmlFor={id}
          className="cursor-pointer text-[12.5px] font-semibold text-foreground"
        >
          {label}
        </Label>
        {hint && <InfoTip title={label}>{hint}</InfoTip>}
      </span>
    </div>
  );
};

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
          className="size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-transparent p-0"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={clearLabel}
          aria-label={`${label} value`}
          className="h-8 text-xs"
        />
        {value !== "" && (
          <ClearButton label={clearLabel} onClick={() => onChange("")} />
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
      <Button
        variant="secondary"
        size="sm"
        onClick={onChoose}
        className={cn(
          "min-w-0 flex-1 justify-start text-xs",
          pictureName ? "text-foreground" : "text-subtle-foreground",
        )}
      >
        <ImageIcon />
        <span className="min-w-0 truncate">
          {pictureName ?? "Choose a picture"}
        </span>
      </Button>
      {pictureName && (
        <ClearButton label="Remove the picture" onClick={onClear} />
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
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-[10px] border data-[state=open]:bg-secondary/50"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-2.5 py-2 text-[12.5px] font-semibold text-foreground">
        <Icon size={14} className="shrink-0 text-primary-soft" />
        <span className="flex-1 text-left">{title}</span>
        <ChevronRight
          size={14}
          className="text-subtle-foreground transition-transform group-data-[state=open]:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2.75 px-2.5 pt-0.5 pb-2.75">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
