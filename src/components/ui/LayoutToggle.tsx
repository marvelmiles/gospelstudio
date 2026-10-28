import { LayoutGrid, List } from "lucide-react";
import type { LibraryLayout } from "../../hooks/useLibraryLayout";
import { IconButton } from "./Button";

interface LayoutToggleProps {
  value: LibraryLayout;
  onChange: (layout: LibraryLayout) => void;
  noun: string;
}

export const LayoutToggle = ({ value, onChange, noun }: LayoutToggleProps) => (
  <div
    role="group"
    aria-label="Layout"
    className="flex gap-1 rounded-[13px] border border-line bg-raise p-1"
  >
    <IconButton
      icon={LayoutGrid}
      size="sm"
      title={`Show ${noun} as cards`}
      active={value === "grid"}
      onClick={() => onChange("grid")}
    />
    <IconButton
      icon={List}
      size="sm"
      title={`Show ${noun} as a detailed list`}
      active={value === "list"}
      onClick={() => onChange("list")}
    />
  </div>
);
