import { useMemo } from "react";
import type { AnimationKind, Slide, SlideDeckDoc, Theme } from "../../../types";
import {
  resolveBackgroundId,
  resolveBackgroundView,
  type ResolvedBackground,
} from "../../../lib/resolve";
import { fadeOverTransition, slideTransition } from "../../../lib/animation";
import { findBackgroundClip } from "../../../lib/media";
import { useBgMap } from "../../../hooks/useBgMap";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { useStore } from "../../../store/useStore";
import type { DeckLayer } from "../types/layer";
import {
  fallbackThemeIdOf,
  libraryDeckDoc,
  ownDeckDoc,
} from "../lib/deckContent";

export interface DeckLook {
  doc: SlideDeckDoc | null;
  theme: Theme | null;
}

const useThemeById = (themeId: string): Theme | null =>
  useStore(
    (state) =>
      state.themes.find((theme) => theme.id === themeId) ??
      state.themes[0] ??
      null,
  );

export const useDeckLook = (layer: DeckLayer): DeckLook => {
  const ownDoc = ownDeckDoc(layer);
  const libraryDoc = useStore((state) =>
    ownDoc ? null : libraryDeckDoc(layer, state),
  );
  const doc = ownDoc ?? libraryDoc;
  const fallbackThemeId = useStore((state) =>
    fallbackThemeIdOf(layer, state.prefs),
  );
  const theme = useThemeById(doc?.defaultThemeId || fallbackThemeId);
  return { doc, theme };
};

export const useResolvedBackground = (
  slide: Slide | undefined,
  doc: SlideDeckDoc | null,
  theme: Theme | null,
): ResolvedBackground | null => {
  const bgMap = useBgMap();
  const library = useMediaLibrary();
  return useMemo(() => {
    if (!theme) return null;
    const backgroundId = resolveBackgroundId(slide, doc ?? undefined, theme);
    const clip = findBackgroundClip(library, bgMap[backgroundId]?.mediaId);
    return resolveBackgroundView(slide, doc ?? undefined, theme, bgMap, clip);
  }, [slide, doc, theme, bgMap, library]);
};

export const useFallbackAnimation = (): AnimationKind =>
  useStore((state) => state.prefs.transition);

export const useContentTransitions = (animation: AnimationKind) => {
  const durationMs = useStore((state) => state.prefs.transitionDuration);
  const easing = useStore((state) => state.prefs.easing);
  return useMemo(
    () => ({
      content: slideTransition(animation, durationMs, easing),
      backdrop: fadeOverTransition(durationMs, easing),
    }),
    [animation, durationMs, easing],
  );
};
