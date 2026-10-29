import { useCallback, useEffect, useState } from "react";
import type { BibleVerse, BibleVersionId } from "../../types";
import { getChapterVerses } from "./lib/offlineBible";

interface ChapterResult {
  key: string;
  verses: BibleVerse[];
  error: string | null;
}

export const useBibleChapter = (
  version: BibleVersionId,
  bookId: number,
  chapter: number,
) => {
  const [result, setResult] = useState<ChapterResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${version}:${bookId}:${chapter}:${attempt}`;

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    getChapterVerses(version, bookId, chapter, controller.signal)
      .then((verses) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, verses, error: null });
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, verses: [], error: err.message });
      });
    return () => controller.abort();
  }, [version, bookId, chapter, requestKey]);

  const settled = result?.key === requestKey;
  return {
    verses: result?.verses ?? [],
    loading: !settled,
    error: settled ? result.error : null,
    retry,
  };
};
