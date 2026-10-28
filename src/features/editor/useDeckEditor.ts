import type { SlideDeckDoc } from "../../types";
import { useDeckDocument } from "./deckEditor/useDeckDocument";
import { useSlideArrangement } from "./deckEditor/useSlideArrangement";
import { useSlideElementEdits } from "./deckEditor/useSlideElementEdits";
import { useSlideTextEdits } from "./deckEditor/useSlideTextEdits";

export const useDeckEditor = <T extends SlideDeckDoc>(
  source: T,
  commit: (doc: T) => boolean,
) => {
  const deck = useDeckDocument(source, commit);
  const textEdits = useSlideTextEdits(deck);
  const elementEdits = useSlideElementEdits(deck);
  const arrangement = useSlideArrangement(deck);

  const {
    currentDoc: _currentDoc,
    currentSelectedId: _currentSelectedId,
    currentSlides: _currentSlides,
    slideOf: _slideOf,
    patchSlideList: _patchSlideList,
    ...editor
  } = deck;

  return { ...editor, ...textEdits, ...elementEdits, ...arrangement };
};

export type DeckEditor = ReturnType<typeof useDeckEditor>;
