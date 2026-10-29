import { useCallback, useMemo, useRef, useState } from "react";
import type { Slide, SlideDeckDoc } from "../../../types";
import { now } from "../../../lib/id";
import type { EditHistory } from "../../../hooks/useTextFormatting";
import type { TextRange } from "../../../lib/textRange";
import {
  COALESCE_MS,
  HISTORY_LIMIT,
  type EditOptions,
  type PlacedElement,
  type SlideListKey,
} from "./slideEditHelpers";

interface HistoryEntry<T> {
  doc: T;
  selectedId: string | null;
  caret: TextRange | null;
}

interface DeckState<T> {
  doc: T;
  savedDoc: T;
  selectedId: string | null;
  past: HistoryEntry<T>[];
  future: HistoryEntry<T>[];
}

export const useDeckDocument = <T extends SlideDeckDoc>(
  source: T,
  commit: (doc: T) => boolean,
) => {
  const [state, setState] = useState<DeckState<T>>(() => ({
    doc: source,
    savedDoc: source,
    selectedId: source.slides?.[0]?.id ?? null,
    past: [],
    future: [],
  }));
  const latest = useRef(state);
  const coalesceRef = useRef<{ key: string; at: number } | null>(null);

  const update = useCallback((changes: Partial<DeckState<T>>) => {
    latest.current = { ...latest.current, ...changes };
    setState(latest.current);
  }, []);

  const { doc, savedDoc, selectedId, past, future } = state;

  const setSelectedId = useCallback(
    (id: string | null) => update({ selectedId: id }),
    [update],
  );

  const slides = doc.slides ?? [];
  const selectedIndex = slides.findIndex((slide) => slide.id === selectedId);
  const selectedSlide = slides[selectedIndex] ?? slides[0];

  const apply = useCallback(
    (next: T, options?: EditOptions) => {
      const { doc: current, selectedId: currentId } = latest.current;
      const at = Date.now();
      const key = options?.coalesceKey;
      const mergesWithPrevious = Boolean(
        key &&
        coalesceRef.current?.key === key &&
        at - coalesceRef.current.at < COALESCE_MS,
      );
      coalesceRef.current = key ? { key, at } : null;

      if (mergesWithPrevious) {
        update({ doc: next });
        return;
      }
      update({
        doc: next,
        past: [
          ...latest.current.past,
          {
            doc: current,
            selectedId: currentId,
            caret: options?.caret ?? null,
          },
        ].slice(-HISTORY_LIMIT),
        future: [],
      });
    },
    [update],
  );

  const patchDoc = useCallback(
    (changes: Partial<T>, options?: EditOptions) =>
      apply({ ...latest.current.doc, ...changes, updatedAt: now() }, options),
    [apply],
  );

  const setSlides = useCallback(
    (next: Slide[], options?: EditOptions) =>
      patchDoc({ slides: next } as Partial<T>, options),
    [patchDoc],
  );

  const slideOf = useCallback(
    (id: string): Slide | undefined =>
      (latest.current.doc.slides ?? []).find((slide) => slide.id === id),
    [],
  );

  const currentDoc = useCallback((): T => latest.current.doc, []);
  const currentSelectedId = useCallback(
    (): string | null => latest.current.selectedId,
    [],
  );
  const currentSlides = useCallback(
    (): Slide[] => latest.current.doc.slides ?? [],
    [],
  );

  const updateSlide = useCallback(
    (id: string, changes: Partial<Slide>, options?: EditOptions) =>
      setSlides(
        currentSlides().map((slide) =>
          slide.id === id ? { ...slide, ...changes } : slide,
        ),
        options,
      ),
    [currentSlides, setSlides],
  );

  const patchSlideList = useCallback(
    <TElement extends PlacedElement>(
      id: string,
      key: SlideListKey,
      transform: (list: TElement[]) => TElement[] | null,
      options?: EditOptions,
    ): boolean => {
      const slide = slideOf(id);
      if (!slide) return false;
      const next = transform(
        (slide[key] as unknown as TElement[] | undefined) ?? [],
      );
      if (!next) return false;
      updateSlide(id, { [key]: next } as Partial<Slide>, options);
      return true;
    },
    [slideOf, updateSlide],
  );

  const stepHistory = useCallback(
    (goBack: boolean, caret: TextRange | null): TextRange | null => {
      const { doc: current, selectedId: currentId } = latest.current;
      const source = goBack ? latest.current.past : latest.current.future;
      const entry = source[source.length - 1];
      if (!entry) return null;

      const remaining = source.slice(0, -1);
      const pushed = [
        ...(goBack ? latest.current.future : latest.current.past),
        { doc: current, selectedId: currentId, caret },
      ].slice(-HISTORY_LIMIT);

      coalesceRef.current = null;
      update({
        doc: entry.doc,
        selectedId: entry.selectedId,
        past: goBack ? remaining : pushed,
        future: goBack ? pushed : remaining,
      });
      return entry.caret;
    },
    [update],
  );

  const undo = useCallback(
    (caret: TextRange | null = null) => stepHistory(true, caret),
    [stepHistory],
  );

  const redo = useCallback(
    (caret: TextRange | null = null) => stepHistory(false, caret),
    [stepHistory],
  );

  const save = useCallback((): boolean => {
    const current = latest.current.doc;
    if (!commit(current)) return false;
    update({ savedDoc: current });
    return true;
  }, [commit, update]);

  const history = useMemo<EditHistory>(
    () => ({
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      undo,
      redo,
    }),
    [past.length, future.length, undo, redo],
  );

  return {
    doc,
    slides,
    selectedId,
    setSelectedId,
    selectedIndex,
    selectedSlide,
    dirty: doc !== savedDoc,
    save,
    history,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    patchDoc,
    setSlides,
    currentDoc,
    currentSelectedId,
    currentSlides,
    slideOf,
    updateSlide,
    patchSlideList,
  };
};

export type DeckDocument<T extends SlideDeckDoc = SlideDeckDoc> = ReturnType<
  typeof useDeckDocument<T>
>;
