import { useEffect, useMemo } from "react";
import type { Production } from "../types/production";
import { useProductionStore } from "../store/productionStore";
import { loadProductions, productionsFrom } from "../store/productionActions";

export const useProductionLibrary = (): Production[] => {
  const entries = useProductionStore((state) => state.productions);
  const active = useProductionStore((state) => state.production);

  useEffect(() => {
    void loadProductions();
  }, []);

  return useMemo(() => productionsFrom(entries, active), [entries, active]);
};
