import { useState } from "react";
import { Wallpaper } from "lucide-react";
import { useStore } from "../../../store/useStore";
import type { BackgroundLayer } from "../types/layer";
import { LibraryPicker } from "../library/LibraryPicker";
import { ContentPickerRow } from "./ContentPickerRow";
import { PropertySection } from "./fields";
import { useLayerEditor } from "./useLayerEditor";

export const BackgroundProperties = ({ layer }: { layer: BackgroundLayer }) => {
  const edit = useLayerEditor(layer);
  const background = useStore((state) =>
    state.backgrounds.find((entry) => entry.id === layer.backgroundId),
  );
  const [isPicking, setIsPicking] = useState(false);

  return (
    <PropertySection
      title="Background"
      info="Backgrounds start locked so they are not moved by accident. Unlock one from its menu in the list called In this scene."
    >
      <ContentPickerRow
        icon={Wallpaper}
        name={background?.name ?? null}
        emptyLabel="No background chosen"
        actionLabel={background ? "Change" : "Choose background"}
        onPick={() => setIsPicking(true)}
      />
      <LibraryPicker
        kind={isPicking ? "background" : null}
        onPick={(choice) => {
          edit({ backgroundId: choice.id, name: choice.name });
          setIsPicking(false);
        }}
        onClose={() => setIsPicking(false)}
      />
    </PropertySection>
  );
};
