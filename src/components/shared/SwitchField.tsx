import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const SwitchField = ({
  checked,
  onChange,
  label,
  disabled,
}: SwitchFieldProps) => {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label
        htmlFor={id}
        className="cursor-pointer text-[13.5px] leading-normal font-normal text-foreground"
      >
        {label}
      </Label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};
