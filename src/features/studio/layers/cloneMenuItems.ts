import { Link2, Unlink2 } from "lucide-react";
import type { MenuItem } from "@/components/shared/menuItem";
import type { Layer } from "../types/layer";
import { cloneLayer, unlinkLayer } from "../store/layerActions";

export const cloneMenuItems = (layer: Layer): MenuItem[] => [
  {
    label: "Clone",
    icon: Link2,
    title:
      "A linked copy. Change what one shows, step through it or delete it, and the other follows. Each keeps its own place on the screen.",
    onClick: () => cloneLayer(layer.id),
  },
  ...(layer.linkId
    ? [
        {
          label: "Unlink clone",
          icon: Unlink2,
          title: "Make this item stand on its own again",
          onClick: () => unlinkLayer(layer.id),
        },
      ]
    : []),
];

export const deleteItemLabel = (layer: Layer): string =>
  layer.linkId ? "Delete with its clones" : "Delete";
