import { useNavigate } from "react-router-dom";
import { CircleUserRound, LogIn, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/shared/InfoTip";
import { SectionTitle } from "@/components/shared/Field";
import { useStore } from "../../store/useStore";
import routes from "../../routes";
import { useAuthStore } from "../account/session/authStore";
import { useSyncStatus } from "../sync/useSyncStatus";

export const AccountSection = () => {
  const navigate = useNavigate();
  const closeOverlay = useStore((state) => state.closeOverlay);
  const status = useAuthStore((state) => state.status);
  const account = useAuthStore((state) => state.account);
  const syncStatus = useSyncStatus();

  if (status === "unavailable" || status === "restoring") return null;

  const goTo = (path: string) => {
    closeOverlay();
    navigate(path);
  };

  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Account">
            An account keeps your library safe and lets you use it on every
            device. GospelStudio still saves everything on this device first, so
            it keeps working offline whether you are signed in or not.
          </InfoTip>
        }
      >
        Account
      </SectionTitle>
      {account ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-foreground">
              {account.churchName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {account.email}. {syncStatus.title}.
            </div>
          </div>
          <Button variant="secondary" onClick={() => goTo(routes.account())}>
            <CircleUserRound size={15} />
            Manage account
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-0 mb-3 text-[13px] leading-relaxed text-muted-foreground">
            Sign in to keep your library in your church&apos;s account and sync
            it between devices.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => goTo(routes.signIn())}>
              <LogIn size={15} />
              Sign in
            </Button>
            <Button variant="secondary" onClick={() => goTo(routes.signUp())}>
              <UserRoundPlus size={15} />
              Create account
            </Button>
          </div>
        </>
      )}
    </>
  );
};
