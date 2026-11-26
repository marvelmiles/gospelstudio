import { useEffect, useState } from "react";
import type { AccountDetails } from "@/contracts/accountContract";
import { useSyncStore } from "../../sync/syncStore";
import { fetchAccountDetails } from "../api/accountApi";
import { rememberAccount } from "../session/sessionManager";

export const useAccountDetails = (
  enabled: boolean,
): { details: AccountDetails | null } => {
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const [details, setDetails] = useState<AccountDetails | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let isCurrent = true;
    fetchAccountDetails().then(
      (next) => {
        if (!isCurrent) return;
        setDetails(next);
        void rememberAccount(next.account);
      },
      () => {},
    );
    return () => {
      isCurrent = false;
    };
  }, [enabled, lastSyncedAt]);

  return { details };
};
