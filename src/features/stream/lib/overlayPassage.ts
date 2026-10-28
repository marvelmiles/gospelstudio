import type { ScripturePassage } from "../../../types";
import { uid } from "../../../lib/id";
import { useStore, type ScriptureSelection } from "../../../store/useStore";
import { contentIdsOf, type OverlayContentRef } from "./overlayPresets";

const OVERLAY_PASSAGE_PREFIX = "overlay-passage-";

const isOverlayPassageId = (id: string): boolean =>
  id.startsWith(OVERLAY_PASSAGE_PREFIX);

export const createOverlayPassage = (
  selection: ScriptureSelection,
): ScripturePassage | null => {
  return useStore.getState().stageScriptureSelection(selection, {
    id: `${OVERLAY_PASSAGE_PREFIX}${uid()}`,
    splitLongVerses: false,
  });
};

export const releaseOverlayPassages = (
  removed: readonly OverlayContentRef[],
  remaining: readonly OverlayContentRef[],
): void => {
  const { deleteScripture, overlayPresets } = useStore.getState();
  const stillUsed = new Set([
    ...contentIdsOf(remaining),
    ...contentIdsOf(overlayPresets.map((preset) => preset.overlay)),
  ]);
  for (const contentId of contentIdsOf(removed)) {
    if (!isOverlayPassageId(contentId) || stillUsed.has(contentId)) continue;
    deleteScripture(contentId);
  }
};
