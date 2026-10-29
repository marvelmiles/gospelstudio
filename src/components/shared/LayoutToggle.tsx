import { LayoutGrid, List } from "lucide-react";
import type { LibraryLayout } from "../../hooks/useLibraryLayout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface LayoutToggleProps {
  value: LibraryLayout;
  onChange: (layout: LibraryLayout) => void;
  noun: string;
}

export const LayoutToggle = ({ value, onChange, noun }: LayoutToggleProps) => (
  <ToggleGroup
    type="single"
    aria-label="Layout"
    value={value}
    onValueChange={(next) => next && onChange(next as LibraryLayout)}
    spacing={1}
    className="rounded-[13px] border bg-secondary p-1"
  >
    <ToggleGroupItem
      value="grid"
      title={`Show ${noun} as cards`}
      aria-label={`Show ${noun} as cards`}
      className="size-7.5 px-0"
    >
      <LayoutGrid />
    </ToggleGroupItem>
    <ToggleGroupItem
      value="list"
      title={`Show ${noun} as a detailed list`}
      aria-label={`Show ${noun} as a detailed list`}
      className="size-7.5 px-0"
    >
      <List />
    </ToggleGroupItem>
  </ToggleGroup>
);
