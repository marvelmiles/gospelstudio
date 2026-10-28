import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Popover } from "./Popover";
import type { PopoverAlign, PopoverSide } from "./Popover";

type InfoTipVariant = "popover" | "modal";

interface InfoTipProps {
  title: string;
  children: ReactNode;
  variant?: InfoTipVariant;
  side?: PopoverSide;
  align?: PopoverAlign;
  size?: number;
}

export const InfoTip = ({
  title,
  children,
  variant = "popover",
  side = "bottom",
  align = "start",
  size = 14,
}: InfoTipProps) => {
  const [open, setOpen] = useState(false);

  const trigger = (
    <span
      role="button"
      tabIndex={0}
      aria-label={`About ${title.toLowerCase()}`}
      aria-expanded={open}
      aria-haspopup={variant === "modal" ? "dialog" : "true"}
      title={variant === "modal" ? `About ${title.toLowerCase()}` : undefined}
      onClick={(event) => {
        event.preventDefault();
        if (variant !== "modal") return;
        event.stopPropagation();
        setOpen(true);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setOpen((current) => (variant === "modal" ? true : !current));
      }}
      style={{ width: size + 8, height: size + 8 }}
      className={cn(
        "inline-grid shrink-0 cursor-pointer place-items-center rounded-full align-middle tracking-normal normal-case transition-colors duration-150",
        open ? "bg-accent/16 text-accent-soft" : "bg-transparent text-dim",
      )}
    >
      <Info size={size} aria-hidden />
    </span>
  );

  if (variant === "modal") {
    return (
      <>
        {trigger}
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          width={560}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Got it
            </Button>
          }
        >
          <div className="text-[13.5px] leading-[1.7] font-normal tracking-normal text-sub normal-case">
            {children}
          </div>
        </Modal>
      </>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      openOnHover
      side={side}
      align={align}
      trigger={trigger}
    >
      <div
        role="tooltip"
        className="max-w-75 rounded-xl border border-line bg-panel-solid/98 px-3.25 py-2.75 tracking-normal normal-case shadow-overlay"
      >
        <div className="mb-1 text-[12.5px] font-semibold text-fg">{title}</div>
        <div className="text-[12.5px] leading-[1.55] font-normal text-sub">
          {children}
        </div>
      </div>
    </Popover>
  );
};
