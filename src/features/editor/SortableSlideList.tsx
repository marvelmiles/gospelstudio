import { useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Background, Slide, SlideDeckDoc, Theme } from "../../types";
import { cn } from "../../lib/cn";
import { resolveLineStyle, resolveStyle } from "../../lib/resolve";
import { useBackgroundView } from "../../hooks/useBackgroundView";
import { SlideCanvas } from "../../components/SlideCanvas";
import { FIXED_SHORTCUT_BY_TYPE, type TagGroup } from "../../lib/tagGroups";
import { revealInScrollParent } from "../../lib/scrollReveal";

interface SortableSlideListProps {
  slides: Slide[];
  selId: string | null;
  setSelId: (id: string) => void;
  doc: SlideDeckDoc;
  theme: Theme;
  bgMap: Record<string, Background>;
  onReorder: (next: Slide[]) => void;
  onContextMenu: (slideIndex: number, x: number, y: number) => void;
  tagGroups?: TagGroup[];
}

interface RowProps {
  slide: Slide;
  index: number;
  selId: string | null;
  setSelId: (id: string) => void;
  doc: SlideDeckDoc;
  theme: Theme;
  bgMap: Record<string, Background>;
  onContextMenu: (slideIndex: number, x: number, y: number) => void;
  shortcutNum?: number;
  fixedShortcut?: { letter: string; label: string };
}

const ShortcutBadge = ({
  label,
  title,
  highlight,
}: {
  label: string;
  title: string;
  highlight?: boolean;
}) => (
  <span
    title={title}
    className="inline-flex items-center gap-0.5 whitespace-nowrap"
  >
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] border border-b-2 px-1 py-px font-mono text-[8px] leading-[1.4] font-extrabold tracking-[0.2px]",
        highlight
          ? "border-accent/50 bg-accent/20 text-accent"
          : "border-white/30 bg-white/15 text-white",
      )}
    >
      Ctrl
    </span>
    <span
      className={cn(
        "font-mono text-[9px] font-extrabold",
        highlight ? "text-accent" : "text-white/70",
      )}
    >
      +{label}
    </span>
  </span>
);

const SortableRow = ({
  slide,
  index,
  selId,
  setSelId,
  doc,
  theme,
  bgMap,
  onContextMenu,
  shortcutNum,
  fixedShortcut,
}: RowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const selected = slide.id === selId;
  const allSlidesMode = doc.shortcutMode === "all-slides";

  const rowRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      rowRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );

  useEffect(() => {
    if (!selected) return;
    const frame = requestAnimationFrame(() => {
      if (rowRef.current) revealInScrollParent(rowRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  const background = useBackgroundView(slide, doc, theme, bgMap);

  return (
    <div
      ref={setRefs}
      onClick={() => setSelId(slide.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelId(slide.id);
        onContextMenu(index, e.clientX, e.clientY);
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "mb-2 flex cursor-pointer scroll-mt-16 items-stretch gap-2.25 rounded-[11px] border p-1.75",
        selected
          ? "border-accent/35 bg-accent/12"
          : "border-transparent bg-transparent",
        isDragging && "opacity-40",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        className="flex cursor-grab touch-none flex-col justify-center text-dim"
      >
        <GripVertical size={15} />
      </div>
      <div className="flex w-8 items-center text-xs text-dim tabular-nums">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <SlideCanvas
          slide={slide}
          bg={background.background}
          bgImage={background.image}
          bgVideo={background.video}
          style={resolveStyle(slide, doc, theme)}
          lineStyles={slide.lines.map((_, i) =>
            resolveLineStyle(slide, i, doc, theme),
          )}
          showLabel={false}
          radius={7}
        />
        <div className="mt-1.25 flex items-center justify-between gap-1">
          <div
            className={cn(
              "min-w-0 truncate text-[11px]",
              selected ? "text-accent-soft" : "text-sub",
            )}
          >
            {slide.label}
          </div>
          {(shortcutNum !== undefined || fixedShortcut) && (
            <div className="flex shrink-0 gap-1.25">
              {shortcutNum !== undefined && (
                <ShortcutBadge
                  label={String(shortcutNum)}
                  title={
                    allSlidesMode
                      ? `Press Ctrl then type ${shortcutNum}, release Ctrl to jump here`
                      : `Press Ctrl then hold and type ${shortcutNum}, release Ctrl to jump here`
                  }
                />
              )}
              {fixedShortcut && (
                <ShortcutBadge
                  label={fixedShortcut.letter.toUpperCase()}
                  title={`Press Ctrl+${fixedShortcut.letter.toUpperCase()} to jump to first ${fixedShortcut.label} slide`}
                  highlight
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SortableSlideList = ({
  slides,
  selId,
  setSelId,
  doc,
  theme,
  bgMap,
  onReorder,
  onContextMenu,
  tagGroups,
}: SortableSlideListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = slides.findIndex((s) => s.id === active.id);
    const to = slides.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(slides, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={slides.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {slides.map((s, i) => {
          const allSlidesMode = doc.shortcutMode === "all-slides";
          const group = tagGroups?.find((g) => g.firstIndex === i);
          const shortcutNum = allSlidesMode ? i + 1 : group?.shortcutNum;
          const fixedShortcut = group
            ? FIXED_SHORTCUT_BY_TYPE[group.type]
            : undefined;
          return (
            <SortableRow
              key={s.id}
              slide={s}
              index={i}
              selId={selId}
              setSelId={setSelId}
              doc={doc}
              theme={theme}
              bgMap={bgMap}
              onContextMenu={onContextMenu}
              shortcutNum={shortcutNum}
              fixedShortcut={fixedShortcut}
            />
          );
        })}
      </SortableContext>
    </DndContext>
  );
};
