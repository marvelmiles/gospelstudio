import { cn } from "../../lib/utils";

export const floatingPanelClassName = (focused: boolean): string =>
  cn(
    "fixed overflow-hidden rounded-[14px] border bg-card/96 backdrop-blur-[18px] backdrop-saturate-150 transition-[border-color,box-shadow] duration-150 outline-none",
    focused
      ? "border-primary/55 shadow-[0_20px_55px_rgb(0_0_0/0.6),0_0_0_3px_rgb(37_99_235/0.18)]"
      : "border-border shadow-[0_18px_45px_rgb(0_0_0/0.5)]",
  );
