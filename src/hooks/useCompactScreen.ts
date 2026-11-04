import { useMediaQuery } from "usehooks-ts";

const COMPACT_SCREEN_QUERY = "(max-width: 39.98rem)";

export const useCompactScreen = (): boolean =>
  useMediaQuery(COMPACT_SCREEN_QUERY);
