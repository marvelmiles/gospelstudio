import { useCallback, useState } from "react";
import { useStore } from "../../../store/useStore";
import { signOutOfAccount } from "../accountLifecycle";

export interface SignOutFlow {
  busy: boolean;
  confirming: boolean;
  request: () => void;
  cancel: () => void;
  confirm: () => void;
}

export const useSignOut = (): SignOutFlow => {
  const pushToast = useStore((state) => state.pushToast);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback(() => {
    setConfirming(false);
    setBusy(true);
    void signOutOfAccount()
      .then(() =>
        pushToast("Signed out. Your library is still on this device."),
      )
      .finally(() => setBusy(false));
  }, [pushToast]);

  return {
    busy,
    confirming,
    request: useCallback(() => setConfirming(true), []),
    cancel: useCallback(() => setConfirming(false), []),
    confirm,
  };
};
