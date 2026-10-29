import { Field } from "@/components/shared/Field";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { ANIMATION_OPTIONS } from "../../lib/animation";

interface AnimationPickerProps {
  label?: string;
  value: string;
  onSelect: (value: string) => void;
  inheritLabel?: string;
}

export const AnimationPicker = ({
  label = "Animation",
  value,
  onSelect,
  inheritLabel,
}: AnimationPickerProps) => {
  const options = [
    ...(inheritLabel ? [{ value: "", label: inheritLabel }] : []),
    ...ANIMATION_OPTIONS,
  ];
  return (
    <Field label={label}>
      <OptionSelect
        value={value}
        options={options}
        onValueChange={(next) => onSelect(next)}
      />
    </Field>
  );
};
