import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "../../lib/utils";

export type SelectOption = string | { value: string; label: string };

interface OptionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

const EMPTY_VALUE = "__empty__";

const toItemValue = (value: string) => (value === "" ? EMPTY_VALUE : value);
const fromItemValue = (value: string) => (value === EMPTY_VALUE ? "" : value);

const optionValue = (option: SelectOption) =>
  typeof option === "string" ? option : option.value;

const optionLabel = (option: SelectOption) =>
  typeof option === "string" ? option : option.label;

export const OptionSelect = ({
  value,
  onValueChange,
  options,
  className,
  disabled,
  "aria-label": ariaLabel,
}: OptionSelectProps) => (
  <Select
    value={toItemValue(value)}
    onValueChange={(next) => onValueChange(fromItemValue(next))}
    disabled={disabled}
  >
    <SelectTrigger aria-label={ariaLabel} className={cn("w-full", className)}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent
      position="popper"
      className="max-h-[min(24rem,var(--radix-select-content-available-height))]"
    >
      {options.map((option) => (
        <SelectItem
          key={optionValue(option)}
          value={toItemValue(optionValue(option))}
        >
          {optionLabel(option)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
