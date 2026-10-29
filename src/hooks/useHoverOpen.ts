import { useEffect, useRef, useState, type PointerEvent } from "react";

const CLOSE_DELAY_MS = 180;

interface HoverHandlers {
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: (event: PointerEvent) => void;
}

interface HoverOpen {
  open: boolean;
  setOpen: (open: boolean) => void;
  hoverHandlers: HoverHandlers;
}

export const useHoverOpen = (enabled = true): HoverOpen => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => window.clearTimeout(closeTimer.current);

  useEffect(() => cancelClose, []);

  const hoverHandlers: HoverHandlers = {
    onPointerEnter: (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      cancelClose();
      setOpen(true);
    },
    onPointerLeave: (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      cancelClose();
      closeTimer.current = window.setTimeout(
        () => setOpen(false),
        CLOSE_DELAY_MS,
      );
    },
  };

  return {
    open,
    setOpen: (next) => {
      cancelClose();
      setOpen(next);
    },
    hoverHandlers,
  };
};
