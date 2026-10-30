import type { Slide, SlideDeckDoc, Theme } from "../types";
import { useStore } from "../store/useStore";
import { resolveBackgroundView } from "../lib/resolve";
import { findBackgroundClip } from "../lib/media";
import type { ResolvedBackground } from "../lib/resolve";
import type { BgMap } from "./useBgMap";

export const useBackgroundView = (
  slide: Slide | undefined,
  doc: SlideDeckDoc | undefined,
  theme: Theme,
  bgMap: BgMap,
): ResolvedBackground => {
  const media = useStore((s) => s.media);
  const background = resolveBackgroundView(slide, doc, theme, bgMap);
  const item = findBackgroundClip(media, background.background.mediaId);
  return item
    ? resolveBackgroundView(slide, doc, theme, bgMap, item)
    : background;
};
