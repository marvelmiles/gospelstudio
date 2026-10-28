import type { ReactNode } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useHover,
  useInteractions,
  type Placement,
} from "@floating-ui/react";
import { cn } from "../../lib/cn";

export type PopoverSide = "bottom" | "top" | "left" | "right";
export type PopoverAlign = "start" | "center" | "end";

const PANEL_ATTRIBUTE = "data-popover-panel";
const EDGE_PADDING = 8;

const toPlacement = (side: PopoverSide, align: PopoverAlign): Placement =>
  align === "center" ? side : `${side}-${align}`;

export const floatingMiddleware = [
  offset(6),
  flip({ padding: EDGE_PADDING }),
  shift({ padding: EDGE_PADDING }),
];

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  openOnHover?: boolean;
  disabled?: boolean;
  triggerClassName?: string;
}

export const Popover = ({
  open,
  onOpenChange,
  trigger,
  children,
  side = "bottom",
  align = "start",
  openOnHover = false,
  disabled = false,
  triggerClassName,
}: PopoverProps) => {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement: toPlacement(side, align),
    middleware: floatingMiddleware,
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      enabled: openOnHover && !disabled,
      mouseOnly: true,
      delay: { close: 180 },
      handleClose: safePolygon(),
    }),
    useClick(context, { enabled: !disabled }),
    useDismiss(context, {
      outsidePress: (event) =>
        !(
          event.target instanceof Element &&
          event.target.closest(`[${PANEL_ATTRIBUTE}]`)
        ),
    }),
  ]);

  return (
    <>
      <span
        ref={refs.setReference}
        className={cn("inline-flex", triggerClassName)}
        {...getReferenceProps()}
      >
        {trigger}
      </span>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...{ [PANEL_ATTRIBUTE]: "" }}
            style={floatingStyles}
            className="z-400 max-h-[calc(100vh-16px)] overflow-y-auto"
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
