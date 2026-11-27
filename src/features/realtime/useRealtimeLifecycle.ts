import { useEffect } from "react";
import { isAccountsAvailable } from "../../lib/apiServer";
import { useAuthStore } from "../account/session/authStore";
import { startRealtime, stopRealtime } from "./realtimeConnection";

/* Stays connected while signed in, even with sync paused, so renames, sign-outs and other devices' live streams still arrive. */
export const useRealtimeLifecycle = (): void => {
  const status = useAuthStore((state) => state.status);
  const accountId = useAuthStore((state) => state.account?.id ?? null);

  useEffect(() => {
    if (!isAccountsAvailable() || status !== "signedIn" || !accountId) return;
    startRealtime();
    return stopRealtime;
  }, [status, accountId]);
};
