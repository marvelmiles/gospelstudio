import {
  ArrowDown,
  ArrowUp,
  Copy,
  CornerDownRight,
  Scissors,
  Trash2,
} from "lucide-react";
import type { MenuItem } from "@/components/shared/menuItem";
import type { DeckEditor } from "../useDeckEditor";

export const slideMenuItems = (
  editor: DeckEditor,
  index: number,
): MenuItem[] => [
  {
    label: "Move up",
    icon: ArrowUp,
    onClick: () => editor.moveSlide(index, -1),
  },
  {
    label: "Move down",
    icon: ArrowDown,
    onClick: () => editor.moveSlide(index, 1),
  },
  { divider: true },
  {
    label: "Duplicate",
    icon: Copy,
    onClick: () => editor.duplicateSlide(index),
  },
  {
    label: "Insert after",
    icon: CornerDownRight,
    onClick: () => editor.insertSlideAt(index + 1),
  },
  { label: "Split", icon: Scissors, onClick: () => editor.splitSlide(index) },
  { divider: true },
  {
    label: "Delete",
    icon: Trash2,
    danger: true,
    onClick: () => editor.removeSlide(index),
  },
];
