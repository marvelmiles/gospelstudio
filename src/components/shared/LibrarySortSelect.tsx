import { ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import {
  librarySortChoices,
  type LibrarySortOption,
} from "../../lib/librarySort";
import { cn } from "../../lib/utils";
import { OptionSelect } from "./OptionSelect";

interface LibrarySortSelectProps {
  value: LibrarySortOption;
  onChange: (value: LibrarySortOption) => void;
  nameLabel: string;
  className?: string;
}

export const LibrarySortSelect = ({
  value,
  onChange,
  nameLabel,
  className,
}: LibrarySortSelectProps) => {
  const options = useMemo(() => librarySortChoices(nameLabel), [nameLabel]);
  return (
    <div className={cn("relative min-w-47.5", className)}>
      <ArrowUpDown
        size={15}
        className="pointer-events-none absolute top-1/2 left-3 z-1 -translate-y-1/2 text-subtle-foreground"
      />
      <OptionSelect
        value={value}
        aria-label="Sort by"
        options={options}
        onValueChange={(next) => onChange(next as LibrarySortOption)}
        className="pl-9"
      />
    </div>
  );
};
