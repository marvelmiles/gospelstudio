import { useMemo } from "react";
import type { MediaItem } from "../../../types";
import type { BgMap } from "../../../hooks/useBgMap";
import { useWarmFiles, type WarmFile } from "../../../lib/blobUrls";
import { findBackgroundClip, type MediaLibrary } from "../../../lib/media";
import {
  resolveAutoPlay,
  resolveBackgroundId,
  resolveLoopSlides,
} from "../../../lib/resolve";
import { placedMediaSource } from "../../../lib/slideMedia";
import type { Deck, DeckSlide } from "../useDeck";
import { neighborSlideIndex } from "./slideOrder";

const NEIGHBOR_OFFSETS = [1, -1, 2];

const mediaFile = (item: MediaItem): WarmFile => ({
  id: item.src ? undefined : item.id,
  src: item.src,
  decode: item.kind === "image",
});

const filesOfSlide = (
  deck: Deck,
  deckSlide: DeckSlide,
  bgMap: BgMap,
  library: MediaLibrary,
): WarmFile[] => {
  if (deckSlide.kind !== "text") return [mediaFile(deckSlide.item)];
  const { doc, theme } = deck;
  if (!theme) return [];

  const files: WarmFile[] = [];
  const background = bgMap[resolveBackgroundId(deckSlide.slide, doc, theme)];
  if (background?.type === "image")
    files.push({
      id: background.blobId,
      src: background.blobId ? undefined : background.src,
      decode: true,
    });
  if (background?.type === "video") {
    const clip = findBackgroundClip(library, background.mediaId);
    if (clip) files.push(mediaFile(clip));
  }

  for (const placed of deckSlide.slide.media ?? []) {
    const decode = placed.kind === "image";
    if (placedMediaSource(placed) === "media") {
      files.push({ id: placed.mediaId, decode });
      continue;
    }
    const placedBackground = bgMap[placed.mediaId];
    if (placedBackground)
      files.push({
        id: placedBackground.blobId,
        src: placedBackground.blobId ? undefined : placedBackground.src,
        decode,
      });
  }
  return files;
};

export const usePreloadNeighborSlides = (
  deck: Deck | null,
  slideIndex: number,
  bgMap: BgMap,
  library: MediaLibrary,
): void => {
  const files = useMemo(() => {
    if (!deck) return [];
    const loop =
      resolveAutoPlay(deck.doc, deck.theme) &&
      resolveLoopSlides(deck.doc, deck.theme);
    return NEIGHBOR_OFFSETS.flatMap((offset) => {
      const index = neighborSlideIndex(
        slideIndex,
        offset,
        deck.slides.length,
        loop,
      );
      const deckSlide = index === null ? undefined : deck.slides[index];
      return deckSlide ? filesOfSlide(deck, deckSlide, bgMap, library) : [];
    });
  }, [bgMap, deck, library, slideIndex]);
  useWarmFiles(files);
};
