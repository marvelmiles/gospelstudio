import { startTransition, useEffect, useEffectEvent } from "react";
import type { ContentKind, Slide } from "../../types";
import { useStore } from "../../store/useStore";
import type { StoreState } from "../../store/storeTypes";

export const useFollowPresentation = (
  kind: ContentKind,
  docId: string,
  slides: Slide[],
  setSelectedId: (id: string) => void,
): void => {
  const followSlide = useEffectEvent((index: number) => {
    const slide = slides[index];
    if (slide) startTransition(() => setSelectedId(slide.id));
  });

  useEffect(() => {
    let followedIndex: number | null = null;
    const follow = ({ presentation, presentationIndex }: StoreState) => {
      if (presentation?.kind !== kind || presentation.id !== docId) {
        followedIndex = null;
        return;
      }
      if (followedIndex === presentationIndex) return;
      followedIndex = presentationIndex;
      followSlide(presentationIndex);
    };
    follow(useStore.getState());
    return useStore.subscribe(follow);
  }, [docId, kind]);
};
