import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignOut } from "../hooks/useSignOut";
import { SignOutDialog } from "./SignOutDialog";

export const SignOutButton = () => {
  const signOut = useSignOut();

  return (
    <>
      <Button variant="secondary" busy={signOut.busy} onClick={signOut.request}>
        <LogOut size={15} />
        Sign out
      </Button>
      <SignOutDialog flow={signOut} />
    </>
  );
};
