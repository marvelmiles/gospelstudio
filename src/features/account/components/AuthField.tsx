import { useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Label } from "@/components/ui/label";

interface AuthFieldControlProps {
  id: string;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface AuthFieldProps {
  label: string;
  error?: string | null;
  hint?: string;
  action?: ReactNode;
  children: (control: AuthFieldControlProps) => ReactNode;
}

export const AuthField = ({
  label,
  error,
  hint,
  action,
  children,
}: AuthFieldProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <Label
          htmlFor={id}
          className={cn(
            "text-[13px]",
            error ? "text-destructive-soft" : "text-foreground",
          )}
        >
          {label}
        </Label>
        {hint && (
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        )}
        {action}
      </div>
      {children({
        id,
        className: "h-10",
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 mb-0 flex items-start gap-1.5 text-[13px] leading-snug font-medium text-destructive-soft"
        >
          <CircleAlert size={14} aria-hidden className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
