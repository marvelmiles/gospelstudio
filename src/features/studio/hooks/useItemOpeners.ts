import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import routes from "../../../routes";
import { openItemPip } from "../pip/pipStore";

export const useItemOpeners = () => {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      openEditor: (layerId: string) => navigate(routes.studioItem(layerId)),
      openPip: openItemPip,
    }),
    [navigate],
  );
};
