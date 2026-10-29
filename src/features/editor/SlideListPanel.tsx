import { Plus } from "lucide-react";
import type { Background, Slide, SlideDeckDoc, Theme } from "../../types";
import { IconButton } from "@/components/shared/IconButton";
import { PanelHeader } from "../../components/layout/EditorColumns";
import type { MenuItem } from "@/components/shared/menuItem";
import { SortableSlideList } from "./SortableSlideList";
import type { TagGroup } from "../../lib/tagGroups";

interface SlideListPanelProps {
  slides: Slide[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  doc: SlideDeckDoc;
  theme: Theme;
  bgMap: Record<string, Background>;
  onReorder: (next: Slide[]) => void;
  slideMenuItems: (index: number) => MenuItem[];
  onAdd: () => void;
  tagGroups?: TagGroup[];
}

export const SlideListPanel = ({
  slides,
  selectedId,
  setSelectedId,
  doc,
  theme,
  bgMap,
  onReorder,
  slideMenuItems,
  onAdd,
  tagGroups,
}: SlideListPanelProps) => (
  <div className="pb-3.5">
    <PanelHeader
      title="Slides"
      action={<IconButton icon={Plus} title="Add slide" onClick={onAdd} />}
    />
    <div className="px-3.5 pt-3">
      <SortableSlideList
        slides={slides}
        selId={selectedId}
        setSelId={setSelectedId}
        doc={doc}
        theme={theme}
        bgMap={bgMap}
        onReorder={onReorder}
        slideMenuItems={slideMenuItems}
        tagGroups={tagGroups}
      />
    </div>
  </div>
);
