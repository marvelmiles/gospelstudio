import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 24;
const LOAD_AHEAD_MARGIN = "800px";

export interface IncrementalList<T> {
  visibleItems: T[];
  total: number;
  hasMore: boolean;
  showMore: () => void;
  attachSentinel: (node: HTMLElement | null) => void;
}

export const useIncrementalList = <T>(
  items: T[],
  resetKey: string,
  pageSize = DEFAULT_PAGE_SIZE,
): IncrementalList<T> => {
  const [limit, setLimit] = useState(pageSize);
  const [limitKey, setLimitKey] = useState(resetKey);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);

  if (limitKey !== resetKey) {
    setLimitKey(resetKey);
    setLimit(pageSize);
  }

  const hasMore = items.length > limit;
  const showMore = useCallback(
    () => setLimit((current) => current + pageSize),
    [pageSize],
  );

  /* Observing afresh after every page makes the observer report where the sentinel is now, so pages keep loading while it is still within reach. */
  useEffect(() => {
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) showMore();
      },
      { rootMargin: LOAD_AHEAD_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, limit, showMore]);

  const visibleItems = useMemo(() => items.slice(0, limit), [items, limit]);

  return {
    visibleItems,
    total: items.length,
    hasMore,
    showMore,
    attachSentinel: setSentinel,
  };
};
