import type { Slide, SlideDeckDoc, Theme } from "../types";
import { useMediaLibrary } from "./useMediaLibrary";
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
  const library = useMediaLibrary();
  const background = resolveBackgroundView(slide, doc, theme, bgMap);
  const item = findBackgroundClip(library, background.background.mediaId);
  return item
    ? resolveBackgroundView(slide, doc, theme, bgMap, item)
    : background;
};
