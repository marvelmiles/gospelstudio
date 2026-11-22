import type { ReactNode } from "react";
import { KeyRound, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickConnectFailureProps {
  onRetry: () => void;
  onUseCode: () => void;
  children?: ReactNode;
}

export const QuickConnectFailure = ({
  onRetry,
  onUseCode,
  children,
}: QuickConnectFailureProps) => (
  <div
    role="alert"
    className="mx-auto flex max-w-110 flex-col items-center gap-3 py-2 text-center"
  >
    <span className="grid size-12 place-items-center rounded-2xl bg-destructive/14 text-destructive">
      <WifiOff size={22} />
    </span>
    <div>
      <div className="mb-1 text-base font-semibold text-foreground">
        Quick connect couldn&apos;t find your network
      </div>
      <p className="m-0 text-[13px] leading-relaxed text-muted-foreground">
        Check that this device is online, then try again. You can also pair with
        a code instead: it works with no internet at all.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <Button size="sm" onClick={onRetry}>
        <RefreshCw size={14} />
        Try quick connect again
      </Button>
      <Button variant="secondary" size="sm" onClick={onUseCode}>
        <KeyRound size={14} />
        Pair with a code instead
      </Button>
      {children}
    </div>
  </div>
);
