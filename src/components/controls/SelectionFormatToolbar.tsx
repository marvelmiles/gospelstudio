import { useLayoutEffect } from "react";
import type { MouseEvent } from "react";
import { FloatingPortal, useFloating } from "@floating-ui/react";
import { FormatToolbar } from "./FormatToolbar";
import { floatingMiddleware } from "../ui/Popover";
import type { TextFormattingController } from "../../hooks/useTextFormatting";

interface SelectionFormatToolbarProps {
  controller: TextFormattingController;
  rect: DOMRect | null;
}

export const SelectionFormatToolbar = ({
  controller,
  rect,
}: SelectionFormatToolbarProps) => {
  const { refs, floatingStyles, update } = useFloating({
    placement: "top",
    strategy: "fixed",
    middleware: floatingMiddleware,
  });

  useLayoutEffect(() => {
    if (!rect) return;
    refs.setPositionReference({ getBoundingClientRect: () => rect });
    update();
  }, [rect, refs, update]);

  if (!rect) return null;

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        onMouseDown={(event: MouseEvent) => event.preventDefault()}
        className="z-400 rounded-xl border border-line bg-panel-solid p-1.5 shadow-[0_18px_44px_rgb(0_0_0/0.45)]"
      >
        <FormatToolbar controller={controller} />
      </div>
    </FloatingPortal>
  );
};
