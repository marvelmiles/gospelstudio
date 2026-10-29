import { useMemo } from "react";
import { SlideElementOverlay } from "../editor/SlideElementOverlay";
import type { SlideElement } from "../editor/SlideElementOverlay";
import { editedOverlay, isOnAir, isVisible } from "./lib/streamOverlay";
import type { StreamOverlay, StreamOverlayKind } from "./lib/streamOverlay";
import {
  duplicateStreamOverlay,
  removeStreamOverlay,
  setStreamOverlayFrame,
} from "./lib/streamOverlayStore";

export const StreamOverlayEditor = ({
  overlays,
  selectedId,
  onSelect,
}: {
  overlays: StreamOverlay[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) => {
  const drawn = useMemo(
    () => overlays.filter(isVisible).map(editedOverlay),
    [overlays],
  );

  const elements = useMemo<SlideElement<StreamOverlayKind>[]>(
    () =>
      drawn.map((overlay) => ({
        id: overlay.id,
        kind: overlay.kind,
        frame: overlay.frame,
        label: `${overlay.label}${isOnAir(overlay) ? ", on air" : ", draft"}`,
        dragFromInterior: true,
      })),
    [drawn],
  );

  const drafts = drawn.filter((overlay) => !isOnAir(overlay));

  return (
    <>
      <SlideElementOverlay<StreamOverlayKind>
        elements={elements}
        frameOnFocus
        selectedId={selectedId}
        onSelect={(element) => onSelect(element?.id ?? null)}
        onFrameChange={(element, frame) =>
          setStreamOverlayFrame(element.id, frame)
        }
        onDuplicate={(element) => duplicateStreamOverlay(element.id)}
        onDelete={(element) => {
          removeStreamOverlay(element.id);
          onSelect(null);
        }}
      />
      <DraftMarkers overlays={drafts} />
    </>
  );
};

const DraftMarkers = ({ overlays }: { overlays: StreamOverlay[] }) => {
  if (overlays.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {overlays.map((overlay) => (
        <span
          key={overlay.id}
          style={{ left: `${overlay.frame.x}%`, top: `${overlay.frame.y}%` }}
          className="absolute -mt-1 -translate-y-full rounded-full border border-border bg-card px-1.75 py-0.5 text-[10.5px] font-bold tracking-[0.3px] whitespace-nowrap text-muted-foreground uppercase"
        >
          Not on air
        </span>
      ))}
    </div>
  );
};
