import { useEffect, useEffectEvent, useMemo } from "react";
import {
  resolveAutoPlay,
  resolveLoopSlides,
  resolveSlideDuration,
} from "../../../lib/resolve";
import { useStore } from "../../../store/useStore";
import { nextSlideIndex } from "../../presentation/lib/slideOrder";
import type { DeckLayer } from "../types/layer";
import type { ProgramSnapshot } from "../types/production";
import { deckDocOf, fallbackThemeIdOf, isDeckLayer } from "../lib/deckContent";
import { linkGroupOf } from "../lib/linkedItems";
import { clampIndex } from "../lib/slidePosition";
import { updateLiveLayer } from "../store/programActions";
import { usePipStore } from "../pip/pipStore";

interface AutoPlayStep {
  layerId: string;
  nextIndex: number;
  delayMs: number;
}

export const useDeckAutoPlay = (program: ProgramSnapshot | null): void => {
  const manuscripts = useStore((state) => state.manuscripts);
  const scriptures = useStore((state) => state.scriptures);
  const themes = useStore((state) => state.themes);
  const prefs = useStore((state) => state.prefs);
  const pausedLayerIds = usePipStore((state) => state.pausedLayerIds);

  const steps = useMemo<AutoPlayStep[]>(() => {
    const library = { manuscripts, scriptures };
    const layers = program?.layers ?? [];
    const pausedGroups = new Set(
      layers.filter((layer) => pausedLayerIds.has(layer.id)).map(linkGroupOf),
    );
    const steppedGroups = new Set<string>();
    return layers.flatMap((layer) => {
      if (!isDeckLayer(layer) || !layer.visible) return [];
      const group = linkGroupOf(layer);
      if (pausedGroups.has(group) || steppedGroups.has(group)) return [];
      const doc = deckDocOf(layer, library);
      const count = doc?.slides?.length ?? 0;
      if (!doc || count < 2) return [];
      const themeId = doc.defaultThemeId || fallbackThemeIdOf(layer, prefs);
      const theme = themes.find((entry) => entry.id === themeId) ?? themes[0];
      if (!resolveAutoPlay(doc, theme)) return [];
      const nextIndex = nextSlideIndex(
        clampIndex(layer.slideIndex, count),
        count,
        resolveLoopSlides(doc, theme),
      );
      if (nextIndex === null) return [];
      steppedGroups.add(group);
      return [
        {
          layerId: layer.id,
          nextIndex,
          delayMs: resolveSlideDuration(doc, theme) * 1000,
        },
      ];
    });
  }, [program, manuscripts, scriptures, themes, prefs, pausedLayerIds]);

  const plan = JSON.stringify(steps);
  const schedule = useEffectEvent(() =>
    steps.map((step) =>
      window.setTimeout(
        () =>
          updateLiveLayer<DeckLayer>(step.layerId, {
            slideIndex: step.nextIndex,
          }),
        step.delayMs,
      ),
    ),
  );

  useEffect(() => {
    const timers = schedule();
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [plan]);
};
