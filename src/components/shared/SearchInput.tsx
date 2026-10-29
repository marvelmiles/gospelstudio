import { useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "@/components/ui/input";
import { ClearInputButton } from "./ClearInputButton";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: SearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const filled = value.length > 0;

  const clear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative min-w-50 flex-1", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-subtle-foreground"
      />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && filled) {
            event.preventDefault();
            clear();
          }
        }}
        className={cn("pl-9", filled && "pr-9")}
      />
      <ClearInputButton value={value} onClear={clear} />
    </div>
  );
};
