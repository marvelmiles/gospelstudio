import { cn } from "../../lib/cn";

export const tileClassName = (isActive = false): string =>
  cn(
    "cursor-pointer rounded-[10px] border py-2.5 text-center text-[13.5px] font-semibold tabular-nums",
    isActive
      ? "border-accent/40 bg-accent/16 text-accent-soft"
      : "border-line bg-raise text-fg",
  );
