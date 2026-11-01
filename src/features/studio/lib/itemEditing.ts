import { PictureInPicture2, SquarePen } from "lucide-react";
import type { MenuItem } from "@/components/shared/menuItem";
import type { Layer } from "../types/layer";
import { isDeckLayer } from "./deckContent";

export const hasItemEditor = (layer: Layer): boolean => {
  switch (layer.type) {
    case "manuscript":
      return Boolean(layer.manuscript || layer.manuscriptId);
    case "bible":
      return Boolean(layer.passage || layer.passageId);
    case "image":
    case "video":
      return Boolean(layer.mediaId);
    default:
      return false;
  }
};

export const hasItemPip = (layer: Layer): boolean =>
  (isDeckLayer(layer) || layer.type === "video") && hasItemEditor(layer);

interface ItemOpeners {
  openEditor: (layerId: string) => void;
  openPip: (layerId: string) => void;
}

export const itemMenuItems = (
  layer: Layer,
  { openEditor, openPip }: ItemOpeners,
): MenuItem[] => [
  ...(hasItemEditor(layer)
    ? [
        {
          label: "Open editor",
          icon: SquarePen,
          title: "Changes made there only apply to this production",
          onClick: () => openEditor(layer.id),
        },
      ]
    : []),
  ...(hasItemPip(layer)
    ? [
        {
          label: "Open PiP",
          icon: PictureInPicture2,
          title: "A small floating window to step through it from anywhere",
          onClick: () => openPip(layer.id),
        },
      ]
    : []),
];
