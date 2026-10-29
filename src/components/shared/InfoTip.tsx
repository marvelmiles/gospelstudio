import { useState } from "react";
import type {
  ComponentProps,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/utils";
import { useHoverOpen } from "../../hooks/useHoverOpen";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Modal } from "./Modal";

type InfoTipVariant = "popover" | "modal";

interface InfoTipProps {
  title: string;
  children: ReactNode;
  variant?: InfoTipVariant;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  size?: number;
}

interface InfoTriggerProps extends ComponentProps<"span"> {
  title: string;
  size: number;
  open: boolean;
  onActivate: (fromKeyboard: boolean) => void;
}

const InfoTrigger = ({
  title,
  size,
  open,
  onActivate,
  ...props
}: InfoTriggerProps) => (
  <span
    role="button"
    tabIndex={0}
    aria-label={`About ${title.toLowerCase()}`}
    style={{ width: size + 8, height: size + 8 }}
    className={cn(
      "inline-grid shrink-0 cursor-pointer place-items-center rounded-full align-middle tracking-normal normal-case transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      open
        ? "bg-primary/16 text-primary-soft"
        : "bg-transparent text-subtle-foreground",
    )}
    {...props}
    onClick={(event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      onActivate(false);
    }}
    onKeyDown={(event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      onActivate(true);
    }}
  >
    <Info size={size} aria-hidden />
  </span>
);

const InfoModal = ({
  title,
  size,
  children,
}: Pick<InfoTipProps, "title" | "children"> & { size: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <InfoTrigger
        title={title}
        size={size}
        open={open}
        aria-haspopup="dialog"
        onActivate={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        width={560}
        footer={<Button onClick={() => setOpen(false)}>Got it</Button>}
      >
        <div className="text-[13.5px] leading-[1.7] font-normal tracking-normal text-muted-foreground normal-case">
          {children}
        </div>
      </Modal>
    </>
  );
};

const InfoPopover = ({
  title,
  side = "bottom",
  align = "start",
  size,
  children,
}: Omit<InfoTipProps, "variant" | "size"> & { size: number }) => {
  const { open, setOpen, hoverHandlers } = useHoverOpen();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild {...hoverHandlers}>
        <InfoTrigger
          title={title}
          size={size}
          open={open}
          onActivate={(fromKeyboard) => setOpen(fromKeyboard ? !open : true)}
        />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        role="tooltip"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="w-auto max-w-75 px-3.25 py-2.75 tracking-normal normal-case"
        {...hoverHandlers}
      >
        <div className="mb-1 text-[12.5px] font-semibold text-foreground">
          {title}
        </div>
        <div className="text-[12.5px] leading-[1.55] font-normal text-muted-foreground">
          {children}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const InfoTip = ({
  variant = "popover",
  size = 14,
  ...props
}: InfoTipProps) =>
  variant === "modal" ? (
    <InfoModal size={size} {...props} />
  ) : (
    <InfoPopover size={size} {...props} />
  );
