import { useId, useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  OptionSelect,
  type SelectOption,
} from "@/components/shared/OptionSelect";
import { InfoTip } from "@/components/shared/InfoTip";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { ColorInput } from "@/components/shared/ColorInput";

export const PropertySection = ({
  title,
  info,
  defaultOpen = true,
  children,
}: {
  title: string;
  info?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-t border-border py-3 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center gap-1">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span className="section-label">{title}</span>
          <ChevronDown
            size={15}
            className={cn(
              "text-subtle-foreground transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        {info && (
          <InfoTip title={title} align="end" size={13}>
            {info}
          </InfoTip>
        )}
      </div>
      <CollapsibleContent className="flex flex-col gap-3 pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const FieldLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.25 block text-[11.5px] font-semibold text-muted-foreground"
  >
    {children}
  </label>
);

export const FieldRow = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-2 gap-2">{children}</div>
);

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: NumberFieldProps) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (raw: string) => {
    setDraft(raw);
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    const bounded = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
    onChange(bounded);
  };
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={draft ?? String(Math.round(value * 100) / 100)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setDraft(null)}
        className="h-8 px-2 tabular-nums"
      />
    </div>
  );
};

interface SliderFieldProps extends NumberFieldProps {
  min: number;
  max: number;
  suffix?: string;
  typedMax?: number;
}

export const SliderField = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  typedMax,
}: SliderFieldProps) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <RangeSlider
      aria-label={label}
      value={value}
      onValueChange={onChange}
      min={min}
      max={max}
      step={step}
      suffix={suffix}
      inputMax={typedMax}
    />
  </div>
);

export const ColorField = ({
  label,
  value,
  onChange,
  allowGradient = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowGradient?: boolean;
}) => {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <ColorInput
        id={id}
        aria-label={label}
        value={value}
        onChange={onChange}
        allowGradient={allowGradient}
        compact
      />
    </div>
  );
};

export const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <OptionSelect
      aria-label={label}
      value={value}
      options={options}
      onValueChange={onChange}
      className="h-8"
    />
  </div>
);

export interface Choice<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  hint?: string;
}

export const ChoiceField = <T extends string>({
  label,
  value,
  choices,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  choices: Choice<T>[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <ToggleGroup
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      disabled={disabled}
      spacing={1}
      className="flex w-full rounded-[10px] border bg-background p-0.75"
    >
      {choices.map((choice) => (
        <ToggleGroupItem
          key={choice.value}
          value={choice.value}
          title={choice.hint ?? choice.label}
          aria-label={choice.label}
          size="sm"
          className="h-7 flex-1 text-[12px]"
        >
          {choice.icon ? <choice.icon /> : choice.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={draft ?? value}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (!required || next.trim()) onChange(next);
        }}
        onBlur={() => setDraft(null)}
        className="h-8 px-2"
      />
    </div>
  );
};

export const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) => {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="max-h-60 min-h-20 text-[13px]"
      />
      {hint && (
        <p className="mt-1.25 mb-0 text-[11.5px] leading-snug text-subtle-foreground">
          {hint}
        </p>
      )}
    </div>
  );
};
