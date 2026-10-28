import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useStore } from "../../store/useStore";
import { buildNewManuscript } from "../../lib/manuscript/newManuscript";
import { MissingPage } from "../../components/ui/MissingPage";
import { ManuscriptWorkspace } from "./ManuscriptWorkspace";
import routes, { NEW_MANUSCRIPT_ID } from "../../routes";

export const ManuscriptEditor = () => {
  const { manuscriptId } = useParams();
  const navigate = useNavigate();
  const defaultThemeId = useStore(
    (s) => s.prefs.defaultManuscriptThemeId || "classic",
  );
  const stored = useStore((s) =>
    s.manuscripts.find((item) => item.id === manuscriptId),
  );

  const starting = manuscriptId === NEW_MANUSCRIPT_ID;
  /* A new manuscript stays here until it is saved, so an empty one leaves nothing behind. */
  const [draft] = useState(() =>
    starting ? buildNewManuscript(defaultThemeId) : null,
  );
  const saved = useStore((s) =>
    draft ? s.manuscripts.find((item) => item.id === draft.id) : undefined,
  );

  useEffect(() => {
    if (starting && saved)
      navigate(routes.manuscript(saved.id), { replace: true });
  }, [navigate, saved, starting]);

  const manuscript = stored ?? saved ?? draft;

  if (!manuscript)
    return (
      <MissingPage
        icon={FileText}
        title="Manuscript not found"
        message="It may have been deleted."
        actionLabel="Back to manuscripts"
        onAction={() => navigate(routes.manuscripts())}
      />
    );

  return (
    <ManuscriptWorkspace
      key={manuscript.id}
      manuscript={manuscript}
      unsaved={!stored && !saved}
    />
  );
};
