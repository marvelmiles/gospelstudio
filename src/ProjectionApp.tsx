import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "./store/useStore";
import { PresentWindow } from "./features/presentation/PresentWindow";
import { StudioOutputWindow } from "./features/studio/output/StudioOutputWindow";
import { StudioPreviewWindow } from "./features/studio/output/StudioPreviewWindow";
import routes from "./routes";

const ProjectionApp = () => {
  const load = useStore((s) => s.load);
  const { pathname } = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  if (pathname === routes.studioWindow()) return <StudioOutputWindow />;
  if (pathname === routes.studioPreview()) return <StudioPreviewWindow />;
  return <PresentWindow />;
};

export default ProjectionApp;
