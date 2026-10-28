import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import type { ContentKind, SlideDeckDoc } from "../../types";
import type {
  AssetUsageEdit,
  AssetUsagePlace,
  AssetUsageRequest,
} from "../../lib/assetUsage";
import {
  applyAssetUsage,
  assetUsageEditSchema,
  assetUsagePath,
  assetUsageReturnPath,
  isAssetUsageDocKind,
} from "../../lib/assetUsage";
import { now } from "../../lib/id";
import { useStore } from "../../store/useStore";
import type { DeckEditor } from "../editor/useDeckEditor";

const editStateSchema = z.object({ assetUsageEdit: assetUsageEditSchema });

export type AssetUsagePlaceRequest = Pick<AssetUsagePlace, "label" | "slideId">;

interface AssetUsageEditorOptions {
  kind: ContentKind;
  doc: SlideDeckDoc;
  editor: DeckEditor;
}

export const useOpenAssetUsageEditor = ({
  kind,
  doc,
  editor,
}: AssetUsageEditorOptions) => {
  const navigate = useNavigate();
  const pushToast = useStore((s) => s.pushToast);
  const { dirty, save } = editor;

  return useCallback(
    (request: AssetUsageRequest, place: AssetUsagePlaceRequest) => {
      if (!isAssetUsageDocKind(kind)) return;
      if (!save()) {
        pushToast(
          "This document could not be saved, so its asset editor stayed closed.",
          "error",
        );
        return;
      }
      if (dirty) pushToast("Changes saved.");
      const edit: AssetUsageEdit = {
        ...request,
        ...place,
        docKind: kind,
        docId: doc.id,
      };
      navigate(assetUsagePath(edit), { state: { assetUsageEdit: edit } });
    },
    [dirty, doc.id, kind, navigate, pushToast, save],
  );
};

export interface AssetUsageEditorSession {
  edit: AssetUsageEdit;
  returnTo: string;
  back: () => void;
  save: (settings: AssetUsageEdit["settings"]) => boolean;
}

const saveAssetUsage = (edit: AssetUsageEdit): boolean => {
  const state = useStore.getState();
  if (edit.docKind === "manuscript") {
    const manuscript = state.manuscripts.find((item) => item.id === edit.docId);
    if (!manuscript) return false;
    return state.upsertManuscript({
      ...applyAssetUsage(manuscript, edit),
      updatedAt: now(),
    });
  }
  const passage = state.scriptures.find((item) => item.id === edit.docId);
  if (!passage) return false;
  return state.upsertScripture({
    ...applyAssetUsage(passage, edit),
    updatedAt: now(),
  });
};

export const useAssetUsageEditor = (): AssetUsageEditorSession | null => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const edit = useMemo(() => {
    const parsed = editStateSchema.safeParse(state);
    return parsed.success ? parsed.data.assetUsageEdit : null;
  }, [state]);

  const returnTo = edit ? assetUsageReturnPath(edit) : "";

  const back = useCallback(() => {
    if (returnTo) navigate(returnTo);
  }, [navigate, returnTo]);

  const save = useCallback(
    (settings: AssetUsageEdit["settings"]): boolean => {
      if (!edit) return false;
      const parsed = assetUsageEditSchema.safeParse({ ...edit, settings });
      return parsed.success ? saveAssetUsage(parsed.data) : false;
    },
    [edit],
  );

  return useMemo(
    () => (edit ? { edit, returnTo, back, save } : null),
    [back, edit, returnTo, save],
  );
};
