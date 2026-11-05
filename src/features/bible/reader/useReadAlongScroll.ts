import { useEffect, useRef, type RefObject } from "react";
import { isTextEntryTarget } from "../../../lib/textEntry";

const RESUME_FOLLOW_MS = 30_000;

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

interface ReadAlongScrollOptions {
  verse: number | null;
  listRef: RefObject<HTMLElement | null>;
  scrollToVerse: (verse: number) => void;
}

export const useReadAlongScroll = ({
  verse,
  listRef,
  scrollToVerse,
}: ReadAlongScrollOptions): void => {
  const isFollowing = useRef(true);
  const currentVerse = useRef(verse);
  const isReading = verse !== null;

  useEffect(() => {
    currentVerse.current = verse;
    if (verse !== null && isFollowing.current) scrollToVerse(verse);
  }, [verse, scrollToVerse]);

  useEffect(() => {
    const list = listRef.current;
    if (!isReading || !list) return;
    let resumeTimer: number | undefined;

    const pauseFollowing = () => {
      isFollowing.current = false;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        isFollowing.current = true;
        if (currentVerse.current !== null) scrollToVerse(currentVerse.current);
      }, RESUME_FOLLOW_MS);
    };

    const onScrollbarPress = (event: PointerEvent) => {
      if (event.target === list && event.offsetX >= list.clientWidth)
        pauseFollowing();
    };

    const onScrollKey = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key) && !isTextEntryTarget(event.target))
        pauseFollowing();
    };

    list.addEventListener("wheel", pauseFollowing, { passive: true });
    list.addEventListener("touchmove", pauseFollowing, { passive: true });
    list.addEventListener("pointerdown", onScrollbarPress);
    window.addEventListener("keydown", onScrollKey);
    return () => {
      window.clearTimeout(resumeTimer);
      isFollowing.current = true;
      list.removeEventListener("wheel", pauseFollowing);
      list.removeEventListener("touchmove", pauseFollowing);
      list.removeEventListener("pointerdown", onScrollbarPress);
      window.removeEventListener("keydown", onScrollKey);
    };
  }, [isReading, listRef, scrollToVerse]);
};
