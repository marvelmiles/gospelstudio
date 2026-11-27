import { useEffect } from "react";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import {
  LOADING_LOGO,
  UNAVAILABLE_LOGO,
  ensureChurchLogo,
  useChurchLogoStore,
  type ChurchLogoView,
} from "../session/churchLogoStore";

export const useChurchLogo = (accountId: string): ChurchLogoView => {
  const isOnline = useOnlineStatus();
  const logo = useChurchLogoStore((state) =>
    state.accountId === accountId ? state.logo : LOADING_LOGO,
  );

  useEffect(() => {
    if (isOnline) ensureChurchLogo(accountId);
  }, [accountId, isOnline]);

  return !isOnline && logo.status === "loading" ? UNAVAILABLE_LOGO : logo;
};
