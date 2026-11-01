import { useCallback, useState } from "react";
import type { BackupRecordRef } from "../../../lib/shareSelection";

interface ShareTarget {
  records: BackupRecordRef[];
  title: string;
}

export interface ShareTargetControls {
  target: ShareTarget | null;
  open: (records: BackupRecordRef[], title: string) => void;
  close: () => void;
}

export const useShareTarget = (): ShareTargetControls => {
  const [target, setTarget] = useState<ShareTarget | null>(null);

  return {
    target,
    open: useCallback(
      (records: BackupRecordRef[], title: string) =>
        setTarget({ records, title }),
      [],
    ),
    close: useCallback(() => setTarget(null), []),
  };
};
