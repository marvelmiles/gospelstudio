import { create } from "zustand";
import type { Account } from "@/contracts/accountContract";
import { isAccountsAvailable } from "../../../lib/apiServer";

type AuthStatus = "unavailable" | "restoring" | "signedOut" | "signedIn";

interface AuthState {
  status: AuthStatus;
  account: Account | null;
}

export const useAuthStore = create<AuthState>()(() => ({
  status: isAccountsAvailable() ? "restoring" : "unavailable",
  account: null,
}));

export const signedInAccount = (): Account | null => {
  const { status, account } = useAuthStore.getState();
  return status === "signedIn" ? account : null;
};
