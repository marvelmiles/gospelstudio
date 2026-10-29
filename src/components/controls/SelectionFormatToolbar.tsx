import { useMemo } from "react";
import type { MouseEvent } from "react";
import { FormatToolbar } from "./FormatToolbar";
import type { TextFormattingController } from "../../hooks/useTextFormatting";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";

interface SelectionFormatToolbarProps {
  controller: TextFormattingController;
  rect: DOMRect | null;
}

const keepFocus = (event: Event | MouseEvent) => event.preventDefault();

export const SelectionFormatToolbar = ({
  controller,
  rect,
}: SelectionFormatToolbarProps) => {
  const selectionAnchor = useMemo(
    () => ({ current: { getBoundingClientRect: () => rect ?? new DOMRect() } }),
    [rect],
  );

  if (!rect) return null;

  return (
    <Popover open modal={false}>
      <PopoverAnchor virtualRef={selectionAnchor} />
      <PopoverContent
        side="top"
        role="toolbar"
        onOpenAutoFocus={keepFocus}
        onCloseAutoFocus={keepFocus}
        onMouseDown={keepFocus}
        className="w-auto p-1.5"
      >
        <FormatToolbar controller={controller} />
      </PopoverContent>
    </Popover>
  );
};
