import { useSearchParams } from "react-router-dom";
import routes, { NEXT_PAGE_PARAM, isSafeNextPath } from "../../../routes";

export const useNextPage = (): string => {
  const [searchParams] = useSearchParams();
  const next = searchParams.get(NEXT_PAGE_PARAM);
  return isSafeNextPath(next) ? next : routes.dashboard();
};
