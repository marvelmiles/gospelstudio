import { useEffect, useMemo, useRef } from "react";
import type {
  AnimationKind,
  Background,
  ImageSettings,
  VideoSettings,
  ResolvedStyle,
  Slide,
} from "../../types";
import { SlideCanvas } from "../../components/SlideCanvas";
import type { ClickPoint } from "../../components/SlideCanvas";
import {
  previewFrameClassName,
  previewStageClassName,
} from "../../components/layout/EditorColumns";
import { InfoTip } from "@/components/shared/InfoTip";
import { SelectionFormatToolbar } from "../../components/controls/SelectionFormatToolbar";
import { useSlideTextEditor } from "../../hooks/useSlideTextEditor";
import type { TextFormattingController } from "../../hooks/useTextFormatting";
import { SlideElementOverlay } from "./SlideElementOverlay";
import type { SlideElement, SlideElementEditing } from "./SlideElementOverlay";
import { Input } from "@/components/ui/input";
import { useAnimationPreview } from "./useAnimationPreview";

interface PreviewPanelProps {
  slide: Slide;
  animation: AnimationKind;
  animationReplay: number;
  style: ResolvedStyle;
  lineStyles?: ResolvedStyle[];
  background: Background;
  backgroundImage: ImageSettings | null;
  backgroundVideo?: VideoSettings | null;
  text: string;
  formatting: TextFormattingController;
  onChangeLabel: (label: string) => void;
  selectedLine: number | null;
  activeTextBoxId: string | null;
  onActivateTextBox: (boxId: string | null) => void;
  elementEditing: SlideElementEditing;
}

export const PreviewPanel = ({
  slide,
  animation,
  animationReplay,
  style,
  lineStyles,
  background,
  backgroundImage,
  backgroundVideo,
  text,
  formatting,
  onChangeLabel,
  selectedLine,
  activeTextBoxId,
  onActivateTextBox,
  elementEditing,
}: PreviewPanelProps) => {
  const editing = useSlideTextEditor({ text, formatting });
  const { focusAt } = editing;
  const pendingPoint = useRef<ClickPoint | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useAnimationPreview(contentRef, {
    slideId: slide.id,
    animation,
    replay: animationReplay,
  });

  const elements = useMemo<SlideElement[]>(
    () => [
      ...(slide.media ?? []).map((placed) => ({
        id: placed.id,
        kind: placed.kind,
        frame: placed.frame,
      })),
      ...(slide.textBoxes ?? []).map((box) => ({
        id: box.id,
        kind: "text" as const,
        frame: box.frame,
      })),
    ],
    [slide.media, slide.textBoxes],
  );

  useEffect(() => {
    const point = pendingPoint.current;
    pendingPoint.current = null;
    if (point) focusAt(point);
  }, [activeTextBoxId, slide.id, focusAt]);

  const activateText = (boxId: string | null, point: ClickPoint) => {
    if (boxId !== activeTextBoxId) pendingPoint.current = point;
    onActivateTextBox(boxId);
  };

  return (
    <div className={previewStageClassName}>
      <div
        onPointerDown={() => elementEditing.onSelect(null)}
        className={previewFrameClassName}
      >
        <SlideCanvas
          slide={slide}
          bg={background}
          bgImage={backgroundImage}
          bgVideo={backgroundVideo}
          style={style}
          lineStyles={lineStyles}
          showLabel
          playBackground
          selectedLine={selectedLine}
          editing={editing}
          editingTextBoxId={activeTextBoxId}
          onActivateText={activateText}
          mediaControlsFor={elementEditing.selectedId}
          contentRef={contentRef}
          overlay={
            elements.length ? (
              <SlideElementOverlay elements={elements} {...elementEditing} />
            ) : null
          }
        />
      </div>

      <SelectionFormatToolbar
        controller={formatting}
        rect={editing.selectionRect}
      />

      <div className="mx-auto mt-4.5 flex w-full max-w-205 items-center gap-2">
        <Input
          value={slide.label}
          onChange={(e) => onChangeLabel(e.target.value)}
          placeholder="Slide label"
          aria-label="Slide label"
          className="text-[13px]"
        />
        <InfoTip title="Editing on the slide" variant="modal" size={16}>
          <p className="mt-0">
            Type straight onto the slide. Highlight a word or phrase for the
            formatting toolbar, or restyle it from the inspector. Tab and
            Shift+Tab move a point in and out, and Enter carries the list on.
          </p>
          <p className="mb-0">
            Pictures, clips and text boxes added from the inspector drag
            anywhere on the slide, resize from their corners and nudge with the
            arrow keys. A text box and a selected clip are moved by their edges,
            so their middle stays free to write in and to play from.
          </p>
        </InfoTip>
      </div>
    </div>
  );
};
