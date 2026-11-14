import { useCallback } from "react";
import { useStore } from "../../store/useStore";
import {
  DocumentReadError,
  documentReadFailureOf,
} from "../../lib/documents/documentReadError";
import { readDocumentText } from "../../lib/documents/readDocumentText";
import {
  draftsFromText,
  type ManuscriptDraft,
} from "../../lib/manuscript/importDrafts";
import type { SlideTextStyle } from "../../lib/slideLayout";
import { SKIP_REASON_LABELS } from "./import/importLabels";

export interface OpenedManuscriptFile {
  file: File;
  first: ManuscriptDraft;
  pieceCount: number;
}

export const useManuscriptFileReader = (
  style: SlideTextStyle | null,
): ((file: File) => Promise<OpenedManuscriptFile | null>) => {
  const pushToast = useStore((s) => s.pushToast);

  return useCallback(
    async (file) => {
      try {
        const drafts = draftsFromText(await readDocumentText(file), file.name, {
          style,
        });
        if (!drafts.length) throw new DocumentReadError("empty");
        return { file, first: drafts[0], pieceCount: drafts.length };
      } catch (error) {
        const reason = SKIP_REASON_LABELS[documentReadFailureOf(error)];
        pushToast(`Could not open "${file.name}". ${reason}.`, "error");
        return null;
      }
    },
    [pushToast, style],
  );
};
