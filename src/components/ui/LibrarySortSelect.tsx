import { ArrowUpDown } from "lucide-react";
import { useMemo } from "react";
import {
  librarySortChoices,
  type LibrarySortOption,
} from "../../lib/librarySort";
import { cn } from "../../lib/cn";
import { Select } from "./Field";

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
        className="pointer-events-none absolute top-3.25 left-3.25 text-dim"
      />
      <Select
        value={value}
        aria-label="Sort by"
        options={options}
        onChange={(event) => onChange(event.target.value as LibrarySortOption)}
        className="pl-9.5"
      />
    </div>
  );
};
