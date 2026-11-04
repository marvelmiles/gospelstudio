import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClearInputButton } from "@/components/shared/ClearInputButton";

interface ReferenceFieldProps {
  value: string;
  onChange: (value: string) => void;
  onJump: () => void;
  onEscape?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export const ReferenceField = ({
  value,
  onChange,
  onJump,
  onEscape,
  autoFocus,
  className,
}: ReferenceFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={value}
          autoFocus={autoFocus}
          enterKeyHint="go"
          placeholder="Go to reference, like John 3:16-18"
          aria-label="Go to reference"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onJump();
            if (event.key !== "Escape") return;
            event.preventDefault();
            if (value) clear();
            else onEscape?.();
          }}
          className={cn(value && "pr-9.5")}
        />
        <ClearInputButton
          value={value}
          onClear={clear}
          label="Clear reference"
        />
      </div>
      <Button variant="secondary" onClick={onJump} title="Go to reference">
        <ArrowRight size={15} />
        Go
      </Button>
    </div>
  );
};
