import { useCallback, useState } from "react";
import type { ShareDevice } from "./shareSignaling";

interface StopPromptCopy {
  title: string;
  message: string;
  confirmLabel: string;
}

export interface StopSharePrompt {
  prompt: StopPromptCopy | null;
  askForDevice: (device: ShareDevice) => void;
  askForEverything: () => void;
  askForRefresh: () => void;
  confirm: () => void;
  cancel: () => void;
}

interface StopSharePromptActions {
  isBusy: boolean;
  stopDevice: (deviceId: string) => void;
  stopAll: () => void;
  refresh: () => void;
}

type PendingStop =
  | { kind: "device"; device: ShareDevice }
  | { kind: "all" }
  | { kind: "refresh" };

const promptCopy = (pending: PendingStop): StopPromptCopy => {
  if (pending.kind === "device")
    return {
      title: "Stop sending?",
      message: `${pending.device.name} will not get what you chose. Nothing already on it is changed.`,
      confirmLabel: "Stop",
    };
  if (pending.kind === "all")
    return {
      title: "Stop sending?",
      message:
        "This stops what is still going out. Nothing already on the other devices is changed.",
      confirmLabel: "Stop",
    };
  return {
    title: "Refresh and stop sending?",
    message:
      "Looking for devices again cancels the send that is still going. Nothing already on the other devices is changed.",
    confirmLabel: "Refresh",
  };
};

export const useStopSharePrompt = ({
  isBusy,
  stopDevice,
  stopAll,
  refresh,
}: StopSharePromptActions): StopSharePrompt => {
  const [pending, setPending] = useState<PendingStop | null>(null);

  const confirm = useCallback(() => {
    if (!pending) return;
    if (pending.kind === "device") stopDevice(pending.device.id);
    else if (pending.kind === "all") stopAll();
    else refresh();
    setPending(null);
  }, [pending, refresh, stopAll, stopDevice]);

  const askForRefresh = useCallback(() => {
    if (isBusy) setPending({ kind: "refresh" });
    else refresh();
  }, [isBusy, refresh]);

  return {
    prompt: pending === null ? null : promptCopy(pending),
    askForDevice: useCallback(
      (device: ShareDevice) => setPending({ kind: "device", device }),
      [],
    ),
    askForEverything: useCallback(() => setPending({ kind: "all" }), []),
    askForRefresh,
    confirm,
    cancel: useCallback(() => setPending(null), []),
  };
};
