import { PictureInPicture2, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Layer } from "../types/layer";
import { hasItemEditor, hasItemPip } from "../lib/itemEditing";
import { useItemOpeners } from "../hooks/useItemOpeners";

export const ItemEditorActions = ({ layer }: { layer: Layer }) => {
  const { openEditor, openPip } = useItemOpeners();
  if (!hasItemEditor(layer)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => openEditor(layer.id)}
        title="Changes made in the editor only apply to this production"
      >
        <SquarePen />
        Open editor
      </Button>
      {hasItemPip(layer) && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => openPip(layer.id)}
          title="A small floating window to step through it from anywhere"
        >
          <PictureInPicture2 />
          Open PiP
        </Button>
      )}
    </div>
  );
};
