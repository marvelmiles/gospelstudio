import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { ScriptureSelection } from "../../store/useStore";
import { useStore } from "../../store/useStore";
import routes from "../../routes";

export const usePresentScripture = () => {
  const navigate = useNavigate();
  const presentScriptureSelection = useStore(
    (s) => s.presentScriptureSelection,
  );
  const stageScriptureSelection = useStore((s) => s.stageScriptureSelection);

  const present = useCallback(
    (selection: ScriptureSelection | null, live = false) => {
      if (!selection?.verses.length) return;
      presentScriptureSelection(selection, { live });
    },
    [presentScriptureSelection],
  );

  const edit = useCallback(
    (selection: ScriptureSelection | null) => {
      if (!selection?.verses.length) return;
      const passage = stageScriptureSelection(selection);
      if (passage) navigate(routes.passage(passage.id));
    },
    [stageScriptureSelection, navigate],
  );

  return { present, edit };
};
