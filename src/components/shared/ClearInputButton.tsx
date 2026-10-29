import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClearInputButtonProps {
  value: string;
  onClear: () => void;
  label?: string;
}

export const ClearInputButton = ({
  value,
  onClear,
  label = "Clear search",
}: ClearInputButtonProps) => {
  if (!value) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClear}
      title={label}
      aria-label={label}
      className="absolute top-1/2 right-1.5 size-6 -translate-y-1/2 rounded-md bg-foreground/8 [&_svg:not([class*='size-'])]:size-3.25"
    >
      <X />
    </Button>
  );
};
