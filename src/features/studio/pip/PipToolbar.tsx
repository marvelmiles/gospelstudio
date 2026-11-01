import type { ReactNode } from "react";
import { SquarePen, X } from "lucide-react";
import { MiniButton } from "@/components/shared/MiniButton";
import { useItemOpeners } from "../hooks/useItemOpeners";
import { closeItemPip } from "./pipStore";

interface PipToolbarProps {
  layerId: string;
  children: ReactNode;
}

export const PipToolbar = ({ layerId, children }: PipToolbarProps) => {
  const { openEditor } = useItemOpeners();

  return (
    <div className="flex flex-wrap items-center gap-1.25 border-t border-border px-2.25 py-2">
      {children}
      <MiniButton
        icon={SquarePen}
        title="Open its editor"
        onClick={() => openEditor(layerId)}
      />
      <MiniButton
        icon={X}
        title="Close this window (Esc)"
        onClick={() => closeItemPip(layerId)}
      />
    </div>
  );
};
