import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export const CheckboxField = ({
  checked,
  onChange,
  label,
}: CheckboxFieldProps) => {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2.25">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-[13px] font-normal text-muted-foreground"
      >
        {label}
      </Label>
    </div>
  );
};
