import { useId } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FormatToolbar } from "@/components/controls/FormatToolbar";
import { useTextFormatting } from "@/hooks/useTextFormatting";
import { FieldLabel } from "./fields";

interface FormattedTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const FormattedTextField = ({
  label,
  value,
  onChange,
}: FormattedTextFieldProps) => {
  const id = useId();
  const { bind, ...formatting } = useTextFormatting({
    value,
    onChange: (next) => onChange(next),
    syntax: "plain",
  });

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FormatToolbar
        controller={{ ...formatting, bind }}
        block
        className="mb-1.5"
      />
      <Textarea
        id={id}
        ref={bind}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={formatting.syncSelection}
        onKeyUp={formatting.syncSelection}
        onClick={formatting.syncSelection}
        onKeyDown={formatting.handleKeyDown}
        className="max-h-60 min-h-20 text-[13px]"
      />
    </div>
  );
};
