import { useEffect, useEffectEvent, useState } from "react";
import {
  formatTimecode,
  isPartialTimecode,
  parseTimecode,
  timecodeShape,
} from "../../lib/media";
import { Input } from "@/components/ui/input";

interface TimecodeInputProps {
  seconds: number | null;
  onChange: (seconds: number | null) => void;
  withHours: boolean;
  placeholder?: string;
  clearable?: boolean;
  validate?: (seconds: number | null) => string | null;
  onErrorChange?: (message: string | null) => void;
  "aria-label"?: string;
}

interface TypingState {
  text: string;
  seconds: number | null;
  error: string | null;
}

export const TimecodeInput = ({
  seconds,
  onChange,
  withHours,
  placeholder,
  clearable,
  validate,
  onErrorChange,
  "aria-label": ariaLabel,
}: TimecodeInputProps) => {
  const [typing, setTyping] = useState<TypingState | null>(null);
  const settled = seconds === null ? "" : formatTimecode(seconds, withHours);
  const live = typing?.seconds === seconds ? typing : null;
  const value = live ? live.text : settled;
  const error = live?.error ?? null;

  const reportError = useEffectEvent((message: string | null) =>
    onErrorChange?.(message),
  );
  useEffect(() => {
    reportError(error);
    return () => reportError(null);
  }, [error]);

  const reject = (text: string, message: string) =>
    setTyping({ text, seconds, error: message });

  const handleChange = (text: string) => {
    if (!text.trim()) {
      if (!clearable) {
        reject(text, `Enter a time as ${timecodeShape(withHours)}.`);
        return;
      }
      const message = validate?.(null) ?? null;
      setTyping({ text, seconds: message ? seconds : null, error: message });
      if (!message) onChange(null);
      return;
    }

    const parsed = parseTimecode(text, withHours);
    if (parsed === null) {
      if (isPartialTimecode(text, withHours)) {
        setTyping({ text, seconds, error: null });
        return;
      }
      reject(
        text,
        `Write this as ${timecodeShape(withHours)}, with minutes and seconds from 00 to 59.`,
      );
      return;
    }

    const message = validate?.(parsed) ?? null;
    if (message) {
      reject(text, message);
      return;
    }
    setTyping({ text, seconds: parsed, error: null });
    onChange(parsed);
  };

  return (
    <>
      <Input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        placeholder={placeholder ?? timecodeShape(withHours)}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="tabular-nums"
      />
      {error && (
        <span
          role="alert"
          className="mt-1.5 block text-[11.5px] leading-[1.45] tracking-normal text-destructive normal-case"
        >
          {error}
        </span>
      )}
    </>
  );
};
