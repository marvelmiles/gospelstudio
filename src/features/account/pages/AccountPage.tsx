import { Navigate } from "react-router-dom";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import routes from "../../../routes";
import { AccountSyncPanel } from "../components/AccountSyncPanel";
import { ChurchLogoSection } from "../components/ChurchLogoSection";
import { ChurchNameSection } from "../components/ChurchNameSection";
import { DeleteAccountSection } from "../components/DeleteAccountSection";
import { DevicesSection } from "../components/DevicesSection";
import { EmailSection } from "../components/EmailSection";
import { OfflineNotice } from "../components/OfflineNotice";
import { PasswordSection } from "../components/PasswordSection";
import { SignOutButton } from "../components/SignOutButton";
import { useAccountDetails } from "../hooks/useAccountDetails";
import { useAuthStore } from "../session/authStore";

export const AccountPage = () => {
  useDocumentTitle("Account");
  const status = useAuthStore((state) => state.status);
  const account = useAuthStore((state) => state.account);
  const { details } = useAccountDetails(status === "signedIn");

  if (status === "restoring") return <LoadingArea />;
  if (status === "unavailable")
    return <Navigate to={routes.dashboard()} replace />;
  if (status !== "signedIn" || !account)
    return <Navigate to={routes.signIn(routes.account())} replace />;

  return (
    <div className={pageClassName}>
      <div className="mx-auto max-w-180">
        <PageHeader
          title={account.churchName}
          subtitle={`Signed in as ${account.email}`}
          actions={<SignOutButton />}
        />
        <OfflineNotice message="You're offline. Your library keeps working here, and account settings come back when you're online." />
        <div className="grid gap-3.5">
          <AccountSyncPanel
            accountId={account.id}
            storage={details?.storage ?? null}
          />
          <ChurchLogoSection account={account} />
          <ChurchNameSection account={account} />
          <EmailSection account={account} />
          <PasswordSection />
          <DevicesSection />
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
};
