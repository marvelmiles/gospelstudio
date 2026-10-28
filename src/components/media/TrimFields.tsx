import type { ReactNode } from "react";
import { Crosshair } from "lucide-react";
import {
  needsHoursField,
  timecodeShape,
  validateTrimEnd,
  validateTrimStart,
  type TrimRange,
} from "../../lib/media";
import { cn } from "../../lib/cn";
import { IconButton } from "../ui/Button";
import { Field } from "../ui/Field";
import { TimecodeInput } from "../ui/TimecodeInput";

interface TrimFieldsProps {
  trim: TrimRange;
  onChange: (changes: Partial<TrimRange>) => void;
  duration?: number;
  playhead?: number;
  className?: string;
  onIssueChange?: (field: string, message: string | null) => void;
}

export const TrimFields = ({
  trim,
  onChange,
  duration,
  playhead,
  className,
  onIssueChange,
}: TrimFieldsProps) => {
  const withHours = needsHoursField(duration);
  const shape = timecodeShape(withHours);
  const bounds = { duration, withHours };
  const roundedPlayhead =
    playhead === undefined ? null : Math.round(Math.max(0, playhead));

  const trimField = (
    label: string,
    input: ReactNode,
    applyPlayhead: (seconds: number) => void,
  ) => (
    <Field label={label}>
      {roundedPlayhead === null ? (
        input
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">{input}</div>
          <IconButton
            icon={Crosshair}
            title="Set to the playhead"
            filled
            onClick={() => applyPlayhead(roundedPlayhead)}
          />
        </div>
      )}
    </Field>
  );

  return (
    <div className={cn("grid grid-cols-1 gap-3", className)}>
      {trimField(
        `Start (${shape})`,
        <TimecodeInput
          aria-label="Trim start"
          seconds={trim.trimStart}
          withHours={withHours}
          validate={(value) => validateTrimStart(value, trim.trimEnd, bounds)}
          onErrorChange={(message) => onIssueChange?.("trimStart", message)}
          onChange={(trimStart) => onChange({ trimStart: trimStart ?? 0 })}
        />,
        (seconds) => {
          if (!validateTrimStart(seconds, trim.trimEnd, bounds))
            onChange({ trimStart: seconds });
        },
      )}
      {trimField(
        `End (${shape})`,
        <TimecodeInput
          aria-label="Trim end"
          seconds={trim.trimEnd ?? (duration || null)}
          withHours={withHours}
          placeholder={shape}
          clearable
          validate={(value) => validateTrimEnd(value, trim.trimStart, bounds)}
          onErrorChange={(message) => onIssueChange?.("trimEnd", message)}
          onChange={(trimEnd) => onChange({ trimEnd })}
        />,
        (seconds) => {
          if (!validateTrimEnd(seconds, trim.trimStart, bounds))
            onChange({ trimEnd: seconds });
        },
      )}
    </div>
  );
};
