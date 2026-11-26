import { signedInAccount } from "../account/session/authStore";
import { countLibraryUpload, pendingJournal } from "./syncScope";
import { readSyncSettings } from "./syncSettings";
import { useSyncStore } from "./syncStore";

export const countUnsyncedChanges = async (
  accountId: string,
): Promise<number> => {
  const settings = readSyncSettings();
  const journal = await pendingJournal();
  const libraryAlreadyQueued =
    settings.accountId === accountId && settings.libraryQueued;
  return libraryAlreadyQueued ? journal.length : countLibraryUpload(journal);
};

export const refreshPendingCount = async (): Promise<void> => {
  const account = signedInAccount();
  useSyncStore.setState({
    pendingCount: account ? await countUnsyncedChanges(account.id) : 0,
  });
};
