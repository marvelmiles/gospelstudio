import { useState } from "react";
import { Film } from "lucide-react";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import { SwitchField } from "@/components/shared/SwitchField";
import type { VideoLayer } from "../types/layer";
import { useProgram } from "../store/productionStore";
import { LibraryPicker } from "../library/LibraryPicker";
import { VideoTransport } from "../program/VideoTransport";
import { ContentPickerRow } from "./ContentPickerRow";
import { ItemEditorActions } from "./ItemEditorActions";
import { PropertySection } from "./fields";
import { useLayerEditor } from "./useLayerEditor";

export const VideoProperties = ({ layer }: { layer: VideoLayer }) => {
  const edit = useLayerEditor(layer);
  const library = useMediaLibrary();
  const item = findMediaItem(library, layer.mediaId ?? undefined, "video");
  const program = useProgram();
  const liveLayer = program?.layers.find(
    (entry): entry is VideoLayer =>
      entry.id === layer.id && entry.type === "video",
  );
  const [isPicking, setIsPicking] = useState(false);

  return (
    <>
      <PropertySection
        title="Video"
        info="Trim, loop, volume and colour are in its editor. Changes there only apply to this production."
      >
        <ContentPickerRow
          icon={Film}
          name={item?.name ?? null}
          emptyLabel="No video chosen"
          actionLabel={item ? "Change" : "Choose video"}
          onPick={() => setIsPicking(true)}
        />
        <ItemEditorActions layer={layer} />
        <SwitchField
          label="Start playing when it goes live"
          checked={layer.autoplay}
          onChange={(autoplay) => edit({ autoplay })}
        />
      </PropertySection>

      {liveLayer && (
        <PropertySection title="Playback">
          <VideoTransport layer={liveLayer} />
        </PropertySection>
      )}

      <LibraryPicker
        kind={isPicking ? "video" : null}
        onPick={(choice) => {
          edit({ mediaId: choice.id, name: choice.name, overrides: {} });
          setIsPicking(false);
        }}
        onClose={() => setIsPicking(false)}
      />
    </>
  );
};
