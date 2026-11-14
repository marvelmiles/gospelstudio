import { useCallback, useMemo, useRef, useState } from "react";
import type { Manuscript } from "../../../types";
import { useStore } from "../../../store/useStore";
import { uid } from "../../../lib/id";
import { resolveStyle } from "../../../lib/resolve";
import { formatCountLabel } from "../../../lib/formatNumber";
import { trackEvent } from "../../../lib/analytics/trackEvent";
import type { ManuscriptImportSource } from "../../../lib/analytics/analyticsEvents";
import { documentReadFailureOf } from "../../../lib/documents/documentReadError";
import {
  isSupportedDocument,
  readDocumentText,
} from "../../../lib/documents/readDocumentText";
import {
  draftsFromText,
  manuscriptTextKey,
  titleFromFileName,
  type ManuscriptDraft,
} from "../../../lib/manuscript/importDrafts";
import { buildManuscript } from "../../../lib/manuscript/newManuscript";
import { useDefaultManuscriptTheme } from "../useDefaultManuscriptTheme";
import { isSystemFile, sortImportFiles, type ImportFile } from "./importFiles";
import type { SkipReason } from "./importLabels";

export type ImportStep = "choose" | "reading" | "review";

export interface ImportProgress {
  done: number;
  total: number;
  current: string;
}

export interface SkippedImport {
  key: string;
  name: string;
  reason: SkipReason;
}

export type DraftChanges = Partial<
  Pick<ManuscriptDraft, "title" | "collection">
>;

const IDLE_PROGRESS: ImportProgress = { done: 0, total: 0, current: "" };

const libraryTextKeys = (): Set<string> =>
  new Set(
    useStore
      .getState()
      .manuscripts.filter((manuscript) => !manuscript.deleted)
      .map((manuscript) => manuscriptTextKey(manuscript.body)),
  );

const skippedFile = (path: string, reason: SkipReason): SkippedImport => ({
  key: uid(),
  name: path,
  reason,
});

export const useManuscriptImport = () => {
  const theme = useDefaultManuscriptTheme();
  const addManuscripts = useStore((s) => s.addManuscripts);
  const pushToast = useStore((s) => s.pushToast);

  const [step, setStep] = useState<ImportStep>("choose");
  const [progress, setProgress] = useState<ImportProgress>(IDLE_PROGRESS);
  const [drafts, setDrafts] = useState<ManuscriptDraft[]>([]);
  const [skipped, setSkipped] = useState<SkippedImport[]>([]);
  const [batchId, setBatchId] = useState("");
  const runRef = useRef(0);
  const sourceRef = useRef<ManuscriptImportSource>("files");

  const style = useMemo(
    () => (theme ? resolveStyle(undefined, undefined, theme) : null),
    [theme],
  );

  const cancel = useCallback(() => {
    runRef.current += 1;
  }, []);

  const read = useCallback(
    async (files: ImportFile[], source: ManuscriptImportSource) => {
      runRef.current += 1;
      const run = runRef.current;
      sourceRef.current = source;

      const candidates = sortImportFiles(
        files.filter((item) => !isSystemFile(item.path)),
      );
      const readable = candidates.filter((item) =>
        isSupportedDocument(item.path),
      );
      const leftOut = candidates
        .filter((item) => !isSupportedDocument(item.path))
        .map((item) => skippedFile(item.path, "unsupported"));
      const inLibrary = libraryTextKeys();
      const inThisImport = new Set<string>();
      const found: ManuscriptDraft[] = [];

      setStep("reading");
      for (const [index, item] of readable.entries()) {
        if (runRef.current !== run) return;
        setProgress({
          done: index,
          total: readable.length,
          current: item.path,
        });
        try {
          const pieces = draftsFromText(
            await readDocumentText(item.file),
            item.path,
            { style },
          );
          if (!pieces.length) leftOut.push(skippedFile(item.path, "empty"));
          for (const draft of pieces) {
            const key = manuscriptTextKey(draft.body);
            const duplicate = inLibrary.has(key)
              ? "in-library"
              : inThisImport.has(key)
                ? "repeated"
                : null;
            if (duplicate) {
              leftOut.push({
                key: draft.key,
                name: draft.title,
                reason: duplicate,
              });
              continue;
            }
            inThisImport.add(key);
            found.push(draft);
          }
        } catch (error) {
          leftOut.push(skippedFile(item.path, documentReadFailureOf(error)));
        }
      }

      if (runRef.current !== run) return;
      setDrafts(found);
      setSkipped(leftOut);
      setBatchId(uid());
      setProgress(IDLE_PROGRESS);
      setStep("review");
    },
    [style],
  );

  const updateDraft = useCallback((key: string, changes: DraftChanges) => {
    setDrafts((list) =>
      list.map((draft) =>
        draft.key === key ? { ...draft, ...changes } : draft,
      ),
    );
  }, []);

  const removeDraft = useCallback((key: string) => {
    setDrafts((list) => list.filter((draft) => draft.key !== key));
  }, []);

  const restart = useCallback(() => {
    runRef.current += 1;
    setDrafts([]);
    setSkipped([]);
    setProgress(IDLE_PROGRESS);
    setStep("choose");
  }, []);

  const commit = (): boolean => {
    if (!theme || !drafts.length) return false;
    const manuscripts: Manuscript[] = drafts.map((draft) =>
      buildManuscript(theme.id, {
        title: draft.title.trim() || titleFromFileName(draft.sourceName),
        author: draft.author,
        collection: draft.collection,
        body: draft.body,
        format: draft.format,
        maxLines: draft.maxLines,
        slides: draft.slides,
      }),
    );
    if (!addManuscripts(manuscripts)) return false;
    trackEvent("Manuscripts Imported", {
      props: { source: sourceRef.current },
    });
    pushToast(
      manuscripts.length === 1
        ? `Added "${manuscripts[0].title}".`
        : `${formatCountLabel(manuscripts.length, "manuscript")} added.`,
    );
    return true;
  };

  return {
    step,
    progress,
    drafts,
    skipped,
    batchId,
    read,
    cancel,
    restart,
    updateDraft,
    removeDraft,
    commit,
  };
};
