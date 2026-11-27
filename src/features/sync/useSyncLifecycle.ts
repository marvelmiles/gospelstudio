import { useEffect } from "react";
import { isAccountsAvailable } from "../../lib/apiServer";
import { listenToOtherTabs } from "../account/session/accountChannel";
import { signedInAccount, useAuthStore } from "../account/session/authStore";
import {
  forgetAccessToken,
  restoreSession,
} from "../account/session/sessionManager";
import { refreshAppAfterSync } from "./applyRemoteChanges";
import { prepareSyncForAccount } from "./syncControls";
import { startSyncEngine, stopSyncEngine } from "./syncEngine";
import { receiveSyncQueueFromOtherTab } from "./syncQueueEvents";
import { readSyncSettings } from "./syncSettings";

export const useSyncLifecycle = (): void => {
  const status = useAuthStore((state) => state.status);
  const accountId = useAuthStore((state) => state.account?.id ?? null);

  useEffect(() => {
    if (!isAccountsAvailable()) return;
    void restoreSession();
    return listenToOtherTabs((message) => {
      if (message.type === "session-changed") {
        forgetAccessToken();
        void restoreSession();
        return;
      }
      if (message.type === "library-changed") void refreshAppAfterSync(message);
      if (message.type === "sync-queue-changed")
        receiveSyncQueueFromOtherTab({ needsSync: message.needsSync });
    });
  }, []);

  useEffect(() => {
    const account = signedInAccount();
    if (!account || account.id !== accountId) return;
    if (readSyncSettings().awaitingDecision)
      void prepareSyncForAccount(account);
    startSyncEngine();
    return stopSyncEngine;
  }, [status, accountId]);
};
