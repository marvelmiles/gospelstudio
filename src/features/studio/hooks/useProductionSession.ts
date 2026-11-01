import { useEffect } from "react";
import { loadStudio } from "../store/productionActions";
import { flushSave } from "../store/productionStore";

export const useProductionSession = (): void => {
  useEffect(() => {
    void loadStudio();
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") void flushSave();
    };
    document.addEventListener("visibilitychange", saveWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", saveWhenHidden);
      void flushSave();
    };
  }, []);
};
