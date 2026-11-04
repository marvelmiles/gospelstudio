import { useState } from "react";
import { Film, Image as ImageIcon } from "lucide-react";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { findMediaItem } from "../../../lib/media";
import type { FillKind, LayerFill } from "../types/layer";
import { LibraryPicker, type LibraryKind } from "../library/LibraryPicker";
import { ContentPickerRow } from "./ContentPickerRow";
import { PropertySection, SelectField, SliderField } from "./fields";
import { PaintFields } from "./PaintFields";

type MediaFillKind = Extract<FillKind, "image" | "video">;

interface BackgroundFieldsProps {
  fill: LayerFill;
  onChange: (fill: LayerFill, field?: string) => void;
  sourceLabel?: string;
}

const BASE_OPTIONS: { value: FillKind; label: string }[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Colour" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

const MEDIA_ID_KEY: Record<MediaFillKind, "imageId" | "videoId"> = {
  image: "imageId",
  video: "videoId",
};

export const BackgroundFields = ({
  fill,
  onChange,
  sourceLabel,
}: BackgroundFieldsProps) => {
  const library = useMediaLibrary();
  const [picking, setPicking] = useState<MediaFillKind | null>(null);
  const options = sourceLabel
    ? [{ value: "source" as const, label: sourceLabel }, ...BASE_OPTIONS]
    : BASE_OPTIONS;

  const chooseKind = (kind: FillKind) => {
    onChange({ ...fill, kind });
    if (
      (kind === "image" && !fill.imageId) ||
      (kind === "video" && !fill.videoId)
    )
      setPicking(kind);
  };

  const mediaKind: MediaFillKind | null =
    fill.kind === "image" || fill.kind === "video" ? fill.kind : null;
  const chosenItem = mediaKind
    ? findMediaItem(
        library,
        fill[MEDIA_ID_KEY[mediaKind]] ?? undefined,
        mediaKind,
      )
    : undefined;

  return (
    <PropertySection title="Background">
      <SelectField
        label="Behind the words"
        value={fill.kind}
        options={options}
        onChange={(kind) => chooseKind(kind as FillKind)}
      />
      {fill.kind === "color" && (
        <PaintFields
          label="Colour"
          color={fill.color}
          gradient={fill.gradient}
          onChange={(color, gradient, field) =>
            onChange({ ...fill, color, gradient }, `fill.${field}`)
          }
        />
      )}
      {mediaKind && (
        <ContentPickerRow
          icon={mediaKind === "image" ? ImageIcon : Film}
          name={chosenItem?.name ?? null}
          emptyLabel={
            mediaKind === "image" ? "No image chosen" : "No video chosen"
          }
          actionLabel={chosenItem ? "Change" : "Choose"}
          onPick={() => setPicking(mediaKind)}
        />
      )}
      {fill.kind !== "none" && fill.kind !== "source" && (
        <SliderField
          label="Strength"
          value={fill.opacity}
          min={0}
          max={100}
          suffix="%"
          onChange={(opacity) => onChange({ ...fill, opacity }, "fill.opacity")}
        />
      )}
      <LibraryPicker
        kind={picking satisfies LibraryKind | null}
        onPick={(choice) => {
          if (picking)
            onChange({
              ...fill,
              kind: picking,
              [MEDIA_ID_KEY[picking]]: choice.id,
            });
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    </PropertySection>
  );
};
