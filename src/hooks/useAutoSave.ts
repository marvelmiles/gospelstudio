import { useEffect, useEffectEvent } from "react";

const AUTO_SAVE_DELAY_MS = 450;

interface AutoSaveOptions {
  enabled: boolean;
  dirty: boolean;
  blocked: boolean;
  version: unknown;
  save: () => void;
}

export const useAutoSave = ({
  enabled,
  dirty,
  blocked,
  version,
  save,
}: AutoSaveOptions): void => {
  const saveIfPending = useEffectEvent(() => {
    if (enabled && dirty && !blocked) save();
  });

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(saveIfPending, AUTO_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, version]);

  useEffect(() => () => saveIfPending(), []);
};
