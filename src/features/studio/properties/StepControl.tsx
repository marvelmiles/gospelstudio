import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/shared/IconButton";

interface StepControlProps {
  label: string;
  index: number;
  count: number;
  describe: (index: number) => string;
  onChange: (index: number) => void;
}

export const StepControl = ({
  label,
  index,
  count,
  describe,
  onChange,
}: StepControlProps) => (
  <div>
    <div className="mb-1.25 text-[11.5px] font-semibold text-muted-foreground">
      {label}
    </div>
    <div className="flex items-center gap-1.5 rounded-[10px] border border-border bg-background p-1">
      <IconButton
        icon={ChevronLeft}
        title="Previous"
        size="sm"
        disabled={index <= 0}
        onClick={() => onChange(index - 1)}
      />
      <div className="min-w-0 flex-1 text-center">
        <div className="truncate text-[12.5px] font-semibold text-foreground">
          {describe(index)}
        </div>
        <div className="text-[10.5px] text-subtle-foreground tabular-nums">
          {index + 1} of {count}
        </div>
      </div>
      <IconButton
        icon={ChevronRight}
        title="Next"
        size="sm"
        disabled={index >= count - 1}
        onClick={() => onChange(index + 1)}
      />
    </div>
  </div>
);
