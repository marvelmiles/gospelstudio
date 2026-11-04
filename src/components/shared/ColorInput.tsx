import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "../../lib/utils";
import { isCssPaint, pickerHex } from "../../lib/cssColors";

const CHECKERBOARD =
  "repeating-conic-gradient(#9ca3af 0% 25%, #f3f4f6 0% 50%) 50% / 8px 8px";

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  allowGradient?: boolean;
  compact?: boolean;
  id?: string;
  "aria-label"?: string;
}

export const ColorInput = ({
  value,
  onChange,
  allowGradient = false,
  compact = false,
  id,
  "aria-label": ariaLabel = "Colour",
}: ColorInputProps) => {
  const [draft, setDraft] = useState<string | null>(null);
  const isInvalid = draft !== null && !isCssPaint(draft, allowGradient);

  const type = (next: string) => {
    setDraft(next);
    if (isCssPaint(next, allowGradient)) onChange(next.trim());
  };

  return (
    <div className="flex items-center gap-1.5">
      <label
        title="Pick a colour"
        style={{ background: CHECKERBOARD }}
        className={cn(
          "relative shrink-0 cursor-pointer overflow-hidden rounded-md border border-input",
          compact ? "h-8 w-9" : "h-9 w-10.5",
        )}
      >
        <span
          aria-hidden
          style={{ background: value }}
          className="absolute inset-0"
        />
        <input
          type="color"
          aria-label={`${ariaLabel} picker`}
          value={pickerHex(value)}
          onChange={(event) => {
            setDraft(null);
            onChange(event.target.value);
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={id}
        value={draft ?? value}
        spellCheck={false}
        aria-label={id ? undefined : ariaLabel}
        aria-invalid={isInvalid || undefined}
        title={
          allowGradient
            ? "Any CSS colour, such as #f5c518, rgb(0 0 0 / 50%) or gold, or a CSS gradient"
            : "Any CSS colour, such as #f5c518, rgb(0 0 0 / 50%) or gold"
        }
        placeholder={allowGradient ? "Colour or gradient" : "Colour"}
        onChange={(event) => type(event.target.value)}
        onBlur={() => setDraft(null)}
        className={cn("font-mono text-[12.5px]", compact && "h-8 px-2")}
      />
    </div>
  );
};
