import { cn } from "../../lib/utils";

export const tileClassName = (isActive = false): string =>
  cn(
    "cursor-pointer rounded-[10px] border py-2.5 text-center text-[13.5px] font-semibold tabular-nums",
    isActive
      ? "border-primary/40 bg-primary/16 text-primary-soft"
      : "border-border bg-secondary text-foreground",
  );
