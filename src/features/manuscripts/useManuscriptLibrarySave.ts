import { useCallback } from "react";
import type { Manuscript } from "../../types";
import { useStore } from "../../store/useStore";
import { analyticsKey, trackEvent } from "../../lib/analytics/trackEvent";

const isInLibrary = (id: string): boolean =>
  useStore.getState().manuscripts.some((manuscript) => manuscript.id === id);

export const useManuscriptLibrarySave = (): ((
  manuscript: Manuscript,
) => boolean) => {
  const upsertManuscript = useStore((s) => s.upsertManuscript);

  return useCallback(
    (manuscript) => {
      const isNew = !isInLibrary(manuscript.id);
      if (!upsertManuscript(manuscript)) return false;
      trackEvent(isNew ? "Manuscript Created" : "Manuscript Edited", {
        dedupeKey: analyticsKey("manuscript", manuscript.id),
      });
      return true;
    },
    [upsertManuscript],
  );
};
