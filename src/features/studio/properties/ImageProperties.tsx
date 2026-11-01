import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import type { ImageLayer } from "../types/layer";
import { frameOf } from "../lib/canvasCoordinates";
import {
  IMAGE_SIZE_ORDER,
  IMAGE_SIZE_PRESETS,
  matchingSizePreset,
  type ImageSizePreset,
} from "../lib/imagePresets";
import { placement } from "../lib/layerDefaults";
import { imageLookOf } from "../lib/mediaLooks";
import { LibraryPicker } from "../library/LibraryPicker";
import { ContentPickerRow } from "./ContentPickerRow";
import { ItemEditorActions } from "./ItemEditorActions";
import {
  ChoiceField,
  PropertySection,
  SliderField,
  type Choice,
} from "./fields";
import { useLayerEditor } from "./useLayerEditor";

const SIZE_CHOICES: Choice<ImageSizePreset>[] = IMAGE_SIZE_ORDER.map(
  (preset) => ({
    value: preset,
    label: IMAGE_SIZE_PRESETS[preset].label,
    hint: IMAGE_SIZE_PRESETS[preset].hint,
  }),
);

export const ImageProperties = ({ layer }: { layer: ImageLayer }) => {
  const edit = useLayerEditor(layer);
  const library = useMediaLibrary();
  const item = findMediaItem(library, layer.mediaId ?? undefined, "image");
  const look = item ? imageLookOf(item, layer.overrides) : null;
  const sizePreset = matchingSizePreset(frameOf(layer));
  const [isPicking, setIsPicking] = useState(false);

  const applySize = (preset: ImageSizePreset) => {
    const { frame, fit } = IMAGE_SIZE_PRESETS[preset];
    edit({
      ...placement(frame),
      overrides:
        look?.fit === fit ? layer.overrides : { ...layer.overrides, fit },
    });
  };

  return (
    <>
      <PropertySection title="Image">
        <ContentPickerRow
          icon={ImageIcon}
          name={item?.name ?? null}
          emptyLabel="No image chosen"
          actionLabel={item ? "Change" : "Choose image"}
          onPick={() => setIsPicking(true)}
        />
        <ItemEditorActions layer={layer} />
        <ChoiceField<ImageSizePreset | "">
          label="Size"
          value={sizePreset}
          choices={SIZE_CHOICES}
          disabled={layer.locked}
          onChange={(preset) => preset && applySize(preset)}
        />
      </PropertySection>

      <PropertySection title="Crop and position" defaultOpen={false}>
        <SliderField
          label="Zoom"
          value={layer.zoom}
          min={100}
          max={300}
          suffix="%"
          onChange={(zoom) => edit({ zoom }, "zoom")}
        />
        <SliderField
          label="Left and right"
          value={layer.focusX}
          min={0}
          max={100}
          suffix="%"
          onChange={(focusX) => edit({ focusX }, "focusX")}
        />
        <SliderField
          label="Up and down"
          value={layer.focusY}
          min={0}
          max={100}
          suffix="%"
          onChange={(focusY) => edit({ focusY }, "focusY")}
        />
      </PropertySection>

      <LibraryPicker
        kind={isPicking ? "image" : null}
        onPick={(choice) => {
          edit({ mediaId: choice.id, name: choice.name, overrides: {} });
          setIsPicking(false);
        }}
        onClose={() => setIsPicking(false)}
      />
    </>
  );
};
