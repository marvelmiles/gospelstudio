import type { Ref } from "react";
import { Plus } from "lucide-react";
import type { Background, Theme } from "../../types";
import { IconButton } from "@/components/shared/IconButton";
import { PanelHeader } from "../../components/layout/EditorColumns";
import { ThemeCard } from "./ThemeCard";

interface ThemeListPanelProps {
  themes: Theme[];
  backgroundById: Record<string, Background>;
  selectedId: string | null;
  attentionId: string | null;
  onSelect: (themeId: string) => void;
  onAdd: () => void;
}

export const ThemeListPanel = ({
  themes,
  backgroundById,
  selectedId,
  attentionId,
  onSelect,
  onAdd,
  ref,
}: ThemeListPanelProps & { ref?: Ref<HTMLDivElement> }) => (
  <div ref={ref} className="pb-3.5">
    <PanelHeader
      title="Themes"
      action={<IconButton icon={Plus} title="New theme" onClick={onAdd} />}
    />
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 px-3.5 pt-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          background={backgroundById[theme.backgroundId]}
          active={theme.id === selectedId}
          attention={theme.id === attentionId}
          onSelect={() => onSelect(theme.id)}
        />
      ))}
    </div>
  </div>
);
