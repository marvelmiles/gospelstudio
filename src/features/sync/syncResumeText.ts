import { formatCountLabel } from "../../lib/formatNumber";
import type { SyncResumeReason } from "./syncSettings";

interface SyncResumeText {
  title: string;
  message: string;
}

export const syncResumeTextOf = (
  reason: SyncResumeReason,
  pendingCount: number,
): SyncResumeText => {
  const items = formatCountLabel(pendingCount, "item");
  switch (reason) {
    case "joining":
      return {
        title: "Sync this device?",
        message: `Add ${items} from this device to your account and bring your library here.`,
      };
    case "signed-out":
      return {
        title: "Continue syncing?",
        message: `You changed ${items} on this device while you were signed out. Sync them to your account and your other devices now?`,
      };
    case "offline":
      return {
        title: "Back online. Continue syncing?",
        message: `You changed ${items} while this device was offline. Sync them to your account and your other devices now?`,
      };
  }
};
