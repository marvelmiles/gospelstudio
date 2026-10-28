import { useCallback, useState } from "react";
import type { BackupRecordRef } from "../../../lib/shareSelection";

interface QuickShareTarget {
  records: BackupRecordRef[];
  title: string;
}

export interface QuickShareTargetControls {
  target: QuickShareTarget | null;
  open: (records: BackupRecordRef[], title: string) => void;
  close: () => void;
}

export const useQuickShareTarget = (): QuickShareTargetControls => {
  const [target, setTarget] = useState<QuickShareTarget | null>(null);

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
