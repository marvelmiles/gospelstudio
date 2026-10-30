import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "./store/useStore";
import { PresentWindow } from "./features/presentation/PresentWindow";
import { StreamWindow } from "./features/stream/StreamWindow";
import routes from "./routes";

const ProjectionApp = () => {
  const load = useStore((s) => s.load);
  const { pathname } = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  return pathname === routes.streamWindow() ? (
    <StreamWindow />
  ) : (
    <PresentWindow />
  );
};

export default ProjectionApp;
