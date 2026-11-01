import { useMemo } from "react";
import { useStore } from "../../../store/useStore";
import type { BackupSource } from "../../../lib/backupPayload";
import { useProductionLibrary } from "../../studio/hooks/useProductionLibrary";

export const useBackupSource = (): BackupSource => {
  const manuscripts = useStore((state) => state.manuscripts);
  const scriptures = useStore((state) => state.scriptures);
  const media = useStore((state) => state.media);
  const themes = useStore((state) => state.themes);
  const backgrounds = useStore((state) => state.backgrounds);
  const audio = useStore((state) => state.audio);
  const productions = useProductionLibrary();
  const prefs = useStore((state) => state.prefs);

  return useMemo(
    () => ({
      manuscripts,
      scriptures,
      media,
      themes,
      backgrounds,
      audio,
      productions,
      prefs,
    }),
    [
      audio,
      backgrounds,
      manuscripts,
      media,
      productions,
      prefs,
      scriptures,
      themes,
    ],
  );
};
