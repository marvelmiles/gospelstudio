import { useState } from "react";
import {
  FlipHorizontal,
  FlipVertical,
  Film,
  Image as ImageIcon,
  RotateCw,
  Type,
} from "lucide-react";
import type {
  ImageSettings,
  Slide,
  SlideMedia,
  SlideTextBox,
  VerticalAlign,
  VideoSettings,
} from "../../types";
import { cn } from "../../lib/utils";
import { PLAYBACK_RATE_OPTIONS } from "../../lib/mediaOptions";
import { useStore } from "../../store/useStore";
import { formatDuration, trimmedDuration } from "../../lib/media";
import {
  createSlideMedia,
  DEFAULT_SLIDE_MEDIA_OPACITY,
  DEFAULT_SLIDE_MEDIA_RADIUS,
  placedImageSettings,
  placedMediaSource,
  placedVideoSettings,
} from "../../lib/slideMedia";
import type { SlideMediaChoice } from "../../lib/slideMedia";
import type { SlideElementCapabilities } from "../../lib/slideElements";
import { allowsAnySlideElement } from "../../lib/slideElements";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { AdjustmentControls } from "../../components/media/AdjustmentControls";
import { InfoTip } from "@/components/shared/InfoTip";
import { SlideMediaPicker } from "./SlideMediaPicker";
import type { SlideElementRef } from "./SlideElementOverlay";
import type { DeckEditor } from "./useDeckEditor";

const FIT_OPTIONS = [
  { value: "cover", label: "Cover (fill the box, may crop)" },
  { value: "contain", label: "Contain (fit inside the box)" },
  { value: "fill", label: "Fill (stretch)" },
];

const VERTICAL_ALIGN_OPTIONS: { value: VerticalAlign; label: string }[] = [
  { value: "top", label: "Top of the box" },
  { value: "middle", label: "Middle of the box" },
  { value: "bottom", label: "Bottom of the box" },
];

const MAX_RADIUS = 12;

const ROTATIONS: ImageSettings["rotate"][] = [0, 90, 180, 270];

const nextRotation = (
  rotate: ImageSettings["rotate"],
): ImageSettings["rotate"] =>
  ROTATIONS[(ROTATIONS.indexOf(rotate) + 1) % ROTATIONS.length];

const HINTS = {
  media:
    "Drag the picture or clip on the slide to move it, its corners to resize it, and the arrow keys to nudge it.",
  text: "Write straight into the box on the slide. Drag its edge to move it, its corners to resize it, and style the words from the Text section above.",
  locked:
    "This document's layout places nothing new on a slide. Select what is already on this one to adjust or remove it.",
} as const;

const joinPhrases = (phrases: string[]): string => {
  if (phrases.length < 2) return phrases[0] ?? "";
  return `${phrases.slice(0, -1).join(", ")} or ${phrases[phrases.length - 1]}`;
};

const placementHint = (capabilities: SlideElementCapabilities): string => {
  const placeable = joinPhrases(
    [
      capabilities.images ? "a picture" : "",
      capabilities.videos ? "a clip" : "",
      capabilities.textBoxes ? "a text box" : "",
    ].filter(Boolean),
  );
  return `Place ${placeable} on the slide, then drag it where the layout needs it. Each one keeps its own size, position and settings, so a slide can be laid out however the message needs.`;
};

interface SlideElementsPanelProps {
  slide: Slide;
  editor: DeckEditor;
  selected: SlideElementRef | null;
  onSelect: (element: SlideElementRef | null) => void;
  capabilities: SlideElementCapabilities;
  onAddTextBox: () => void;
}

export const SlideElementsPanel = ({
  slide,
  editor,
  selected,
  onSelect,
  capabilities,
  onAddTextBox,
}: SlideElementsPanelProps) => {
  const library = useStore((s) => s.media);
  const [picking, setPicking] = useState<"image" | "video" | null>(null);

  const media =
    selected && selected.kind !== "text"
      ? ((slide.media ?? []).find((item) => item.id === selected.id) ?? null)
      : null;
  const textBox =
    selected?.kind === "text"
      ? ((slide.textBoxes ?? []).find((box) => box.id === selected.id) ?? null)
      : null;

  const add = (choice: SlideMediaChoice) => {
    const placed = createSlideMedia(choice);
    editor.addSlideMedia(slide.id, placed);
    onSelect({ id: placed.id, kind: placed.kind });
  };

  const patchMedia = (changes: Partial<SlideMedia>) => {
    if (!media) return;
    editor.updateSlideMedia(slide.id, media.id, changes, {
      coalesceKey: `media:${slide.id}:${media.id}:settings`,
    });
  };

  const patchImage = (changes: Partial<ImageSettings>) => {
    if (!media) return;
    patchMedia({ image: { ...placedImageSettings(media), ...changes } });
  };

  const patchVideo = (changes: Partial<VideoSettings>) => {
    if (!media) return;
    patchMedia({ video: { ...placedVideoSettings(media), ...changes } });
  };

  const patchTextBox = (changes: Partial<SlideTextBox>) => {
    if (!textBox) return;
    editor.updateSlideTextBox(slide.id, textBox.id, changes);
  };

  const duration =
    media && placedMediaSource(media) === "media"
      ? trimmedDuration(
          library.find((item) => item.id === media.mediaId)?.duration,
          media.kind === "video" ? placedVideoSettings(media) : undefined,
        )
      : undefined;

  const canPlace = allowsAnySlideElement(capabilities);
  const hint = media
    ? HINTS.media
    : textBox
      ? HINTS.text
      : canPlace
        ? placementHint(capabilities)
        : HINTS.locked;

  return (
    <>
      {canPlace && (
        <div className="flex flex-wrap gap-1.75">
          {capabilities.images && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPicking("image")}
            >
              <ImageIcon size={14} />
              Add image
            </Button>
          )}
          {capabilities.videos && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPicking("video")}
            >
              <Film size={14} />
              Add video
            </Button>
          )}
          {capabilities.textBoxes && (
            <Button variant="secondary" size="sm" onClick={onAddTextBox}>
              <Type size={14} />
              Add text box
            </Button>
          )}
        </div>
      )}

      <p
        className={cn(
          "m-0 text-[11.5px] leading-[1.55] text-subtle-foreground",
          canPlace && "mt-2.5",
        )}
      >
        {hint}
      </p>

      {media && (
        <div className="mt-4">
          <Field label="Fit inside its box">
            <OptionSelect
              value={
                media.kind === "image"
                  ? placedImageSettings(media).fit
                  : placedVideoSettings(media).fit
              }
              options={FIT_OPTIONS}
              onValueChange={(next) => {
                const fit = next as ImageSettings["fit"];
                if (media.kind === "image") patchImage({ fit });
                else patchVideo({ fit });
              }}
            />
          </Field>
          <Field
            label={`Opacity (${media.opacity ?? DEFAULT_SLIDE_MEDIA_OPACITY}%)`}
          >
            <RangeSlider
              value={media.opacity ?? DEFAULT_SLIDE_MEDIA_OPACITY}
              min={10}
              max={100}
              suffix="%"
              onValueChange={(next) => patchMedia({ opacity: next })}
            />
          </Field>
          <Field label="Corner rounding">
            <RangeSlider
              value={media.radius ?? DEFAULT_SLIDE_MEDIA_RADIUS}
              min={0}
              max={MAX_RADIUS}
              step={0.2}
              onValueChange={(next) => patchMedia({ radius: next })}
            />
          </Field>

          {media.kind === "image" ? (
            <div className="flex flex-wrap gap-1.75">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  patchImage({
                    rotate: nextRotation(placedImageSettings(media).rotate),
                  })
                }
              >
                <RotateCw size={14} />
                Rotate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  patchImage({ flipH: !placedImageSettings(media).flipH })
                }
              >
                <FlipHorizontal size={14} />
                Flip
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  patchImage({ flipV: !placedImageSettings(media).flipV })
                }
              >
                <FlipVertical size={14} />
                Flip
              </Button>
            </div>
          ) : (
            <VideoPlacementControls
              settings={placedVideoSettings(media)}
              duration={duration}
              onChange={patchVideo}
            />
          )}

          <div className="mt-3.5">
            <AdjustmentControls
              value={
                media.kind === "image"
                  ? placedImageSettings(media)
                  : placedVideoSettings(media)
              }
              onChange={(changes) =>
                media.kind === "image"
                  ? patchImage(changes)
                  : patchVideo(changes)
              }
            />
          </div>
        </div>
      )}

      {textBox && (
        <div className="mt-4">
          <Field label="Text sits at">
            <OptionSelect
              value={textBox.verticalAlign ?? "middle"}
              options={VERTICAL_ALIGN_OPTIONS}
              onValueChange={(next) =>
                patchTextBox({
                  verticalAlign: next as VerticalAlign,
                })
              }
            />
          </Field>
        </div>
      )}

      {picking && (
        <SlideMediaPicker
          kind={picking}
          onPick={add}
          onClose={() => setPicking(null)}
        />
      )}
    </>
  );
};

interface VideoPlacementControlsProps {
  settings: VideoSettings;
  duration?: number;
  onChange: (changes: Partial<VideoSettings>) => void;
}

const VideoPlacementControls = ({
  settings,
  duration,
  onChange,
}: VideoPlacementControlsProps) => {
  return (
    <>
      <Field
        label="Speed"
        info={
          <InfoTip title="Clip playback">
            While the clip is selected its own player is live on the slide, so
            it can be played, scrubbed, muted or thrown fullscreen from there.
            On the projector it starts itself as the slide comes up
            {duration === undefined
              ? ""
              : ` (${formatDuration(duration)} long)`}
            .
          </InfoTip>
        }
      >
        <OptionSelect
          value={String(settings.playbackRate)}
          options={PLAYBACK_RATE_OPTIONS}
          onValueChange={(next) => onChange({ playbackRate: Number(next) })}
        />
      </Field>
      <Field label={`Volume (${settings.volume}%)`}>
        <RangeSlider
          value={settings.volume}
          min={0}
          max={100}
          suffix="%"
          onValueChange={(next) => onChange({ volume: next })}
        />
      </Field>
      <SwitchField
        label="Muted"
        checked={settings.muted}
        onChange={(muted) => onChange({ muted })}
      />
      <SwitchField
        label="Loop"
        checked={settings.loop}
        onChange={(loop) => onChange({ loop })}
      />
    </>
  );
};
