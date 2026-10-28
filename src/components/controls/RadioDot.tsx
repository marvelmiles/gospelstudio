import { cn } from "../../lib/cn";

export const RadioDot = ({ selected }: { selected: boolean }) => (
  <span
    aria-hidden
    className={cn(
      "grid size-3.5 shrink-0 place-items-center rounded-full border-[1.5px]",
      selected ? "border-accent" : "border-line-strong",
    )}
  >
    {selected && <span className="size-1.5 rounded-full bg-accent" />}
  </span>
);
