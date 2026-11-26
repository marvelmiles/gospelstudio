import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "@/components/ui/input";
import { IconButton } from "./IconButton";

interface PasswordInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type" | "aria-label"
> {
  label: string;
}

export const PasswordInput = ({
  label,
  className,
  ...props
}: PasswordInputProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const subject = label.toLowerCase();

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        aria-label={label}
        spellCheck={false}
        autoCapitalize="none"
        className={cn("pr-10 [&::-ms-reveal]:hidden", className)}
        {...props}
      />
      <IconButton
        icon={isVisible ? EyeOff : Eye}
        size="sm"
        title={isVisible ? `Hide the ${subject}` : `Show the ${subject}`}
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute top-1/2 right-1 -translate-y-1/2"
      />
    </div>
  );
};
