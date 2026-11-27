import { useLocation, useNavigate } from "react-router-dom";
import {
  ListChecks,
  LogIn,
  LogOut,
  Pause,
  Play,
  RefreshCw,
  UserRoundCog,
} from "lucide-react";
import { formatCount } from "../../../lib/formatNumber";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/shared/IconButton";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import routes, { isRouteActive } from "../../../routes";
import { OtherDevicesActivity } from "../../realtime/components/OtherDevicesActivity";
import { otherDevicesOf, useRealtimeStore } from "../../realtime/realtimeStore";
import { requestSync } from "../../sync/syncEngine";
import { pauseSync, turnOnSync } from "../../sync/syncControls";
import { queuedItemCount, useSyncStore } from "../../sync/syncStore";
import { useSyncStatus } from "../../sync/useSyncStatus";
import { useSignOut } from "../hooks/useSignOut";
import { useAuthStore } from "../session/authStore";
import { AccountAvatar } from "./AccountAvatar";
import { SignOutDialog } from "./SignOutDialog";

const AUTH_PAGES = [
  routes.signIn(),
  routes.signUp(),
  routes.forgotPassword(),
  routes.resetPassword(),
];

interface AccountMenuProps {
  showLabel: boolean;
}

const SignInButton = ({ showLabel }: AccountMenuProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isOnAuthPage = AUTH_PAGES.some((page) => isRouteActive(page, pathname));
  const goToSignIn = () =>
    navigate(isOnAuthPage ? routes.signIn() : routes.signIn(pathname));

  return showLabel ? (
    <Button
      variant="secondary"
      size="sm"
      className="h-8.5"
      aria-pressed={isOnAuthPage || undefined}
      onClick={goToSignIn}
    >
      <LogIn />
      Sign in
    </Button>
  ) : (
    <IconButton
      icon={LogIn}
      title="Sign in"
      active={isOnAuthPage || undefined}
      onClick={goToSignIn}
    />
  );
};

export const AccountMenu = ({ showLabel }: AccountMenuProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const status = useAuthStore((state) => state.status);
  const account = useAuthStore((state) => state.account);
  const phase = useSyncStore((state) => state.phase);
  const queuedCount = useSyncStore((state) => queuedItemCount(state.queue));
  const hasOtherDevices = useRealtimeStore(
    (state) => otherDevicesOf(state).length > 0,
  );
  const syncStatus = useSyncStatus();
  const isOnline = useOnlineStatus();
  const signOut = useSignOut();

  if (status === "unavailable") return null;
  if (status === "restoring") return <span className="size-8.5" aria-hidden />;
  if (status !== "signedIn" || !account)
    return <SignInButton showLabel={showLabel} />;

  const StatusIcon = syncStatus.icon;
  const isOnAccountPage = isRouteActive(routes.account(), pathname);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={`${account.churchName}. ${syncStatus.title}.`}
            aria-label={`Account menu for ${account.churchName}. ${syncStatus.title}.`}
            className={cn(
              "grid size-8.5 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:ring-2 data-[state=open]:ring-primary/45",
              isOnAccountPage && "ring-2 ring-primary/45",
            )}
          >
            <AccountAvatar account={account} phase={phase} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[min(18rem,calc(100vw-1.5rem))]"
        >
          <div className="flex items-center gap-3 px-2.5 pt-2 pb-2.5">
            <AccountAvatar account={account} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {account.churchName}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {account.email}
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <div role="status" className="flex items-start gap-2.5 px-2.5 py-2">
            <StatusIcon
              size={16}
              aria-hidden
              className={cn(
                "mt-0.5 shrink-0",
                phase === "error" ? "text-destructive" : "text-primary-soft",
                phase === "syncing" && "animate-spin",
              )}
            />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground">
                {syncStatus.title}
              </div>
              <div className="text-xs leading-snug text-muted-foreground">
                {syncStatus.detail}
              </div>
            </div>
          </div>
          {hasOtherDevices && (
            <>
              <DropdownMenuSeparator />
              <OtherDevicesActivity />
            </>
          )}
          <DropdownMenuSeparator />
          {phase === "paused" ? (
            <DropdownMenuItem onSelect={() => turnOnSync(account.id)}>
              <Play />
              Resume sync
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem disabled={!isOnline} onSelect={requestSync}>
                <RefreshCw />
                Sync now
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={pauseSync}>
                <Pause />
                Pause sync
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onSelect={() => navigate(routes.syncActivity())}>
            <ListChecks />
            Sync activity
            {queuedCount > 0 && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {formatCount(queuedCount)}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate(routes.account())}>
            <UserRoundCog />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={signOut.busy} onSelect={signOut.request}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutDialog flow={signOut} />
    </>
  );
};
