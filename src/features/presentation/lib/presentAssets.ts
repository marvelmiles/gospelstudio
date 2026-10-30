import type { Background } from "../../../types";
import type { PresentAssets } from "../../../lib/presentChannel";
import { deepEqual } from "../../../lib/equality";
import { resolveBackgroundId } from "../../../lib/resolve";
import { customMedia, mergeById } from "../../../store/helpers";
import type { MediaLibrary } from "../../../lib/media";
import { useStore } from "../../../store/useStore";
import type { Deck } from "../useDeck";

const backgroundIdsOf = (deck: Deck): Set<string> => {
  const { doc, theme } = deck;
  if (!theme) return new Set();
  const ids = new Set([theme.backgroundId]);
  for (const deckSlide of deck.slides)
    if (deckSlide.kind === "text")
      ids.add(resolveBackgroundId(deckSlide.slide, doc, theme));
  return ids;
};

export const collectPresentAssets = (
  deck: Deck,
  bgMap: Record<string, Background>,
  { media, builtInMedia }: MediaLibrary,
): PresentAssets => {
  const backgrounds = [...backgroundIdsOf(deck)]
    .map((id) => bgMap[id])
    .filter((background): background is Background => Boolean(background));

  const mediaIds = new Set<string>();
  for (const background of backgrounds)
    if (background.mediaId) mediaIds.add(background.mediaId);
  for (const deckSlide of deck.slides)
    if (deckSlide.kind !== "text") mediaIds.add(deckSlide.item.id);

  return {
    theme: deck.theme,
    backgrounds,
    media: [...media, ...builtInMedia].filter((item) => mediaIds.has(item.id)),
  };
};

const mergeChanged = <T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] => {
  const changed = incoming.filter(
    (item) =>
      !deepEqual(
        existing.find((entry) => entry.id === item.id),
        item,
      ),
  );
  return changed.length ? mergeById(existing, changed, true) : existing;
};

export const applyPresentAssets = (assets: PresentAssets): void =>
  useStore.setState((state) => ({
    backgrounds: mergeChanged(state.backgrounds, assets.backgrounds),
    media: mergeChanged(state.media, customMedia(assets.media)),
    builtInMedia: mergeChanged(
      state.builtInMedia,
      assets.media.filter((item) => item.builtIn),
    ),
    themes: assets.theme
      ? mergeChanged(state.themes, [assets.theme])
      : state.themes,
  }));
