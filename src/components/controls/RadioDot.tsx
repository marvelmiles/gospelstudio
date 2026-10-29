import { cn } from "../../lib/utils";

export const RadioDot = ({ selected }: { selected: boolean }) => (
  <span
    aria-hidden
    className={cn(
      "grid size-3.5 shrink-0 place-items-center rounded-full border-[1.5px]",
      selected ? "border-primary" : "border-input",
    )}
  >
    {selected && <span className="size-1.5 rounded-full bg-primary" />}
  </span>
);
