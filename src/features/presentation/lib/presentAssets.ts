import type { Background, MediaItem } from "../../../types";
import type { PresentAssets } from "../../../lib/presentChannel";
import { deepEqual } from "../../../lib/equality";
import { resolveBackgroundId } from "../../../lib/resolve";
import { mergeById } from "../../../store/helpers";
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
  media: MediaItem[],
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
    backgrounds: backgrounds.filter((background) => !background.builtIn),
    media: media.filter((item) => mediaIds.has(item.id)),
  };
};

/* Records arrive as fresh copies with every state, so only ones that differ
   from what this window holds are merged, which keeps the library stable. */
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

/** Folds the records a presented deck needs into this window's own library. */
export const applyPresentAssets = (assets: PresentAssets): void =>
  useStore.setState((state) => ({
    backgrounds: mergeChanged(state.backgrounds, assets.backgrounds),
    media: mergeChanged(state.media, assets.media),
    themes: assets.theme
      ? mergeChanged(state.themes, [assets.theme])
      : state.themes,
  }));
