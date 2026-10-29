import { AlertTriangle, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppAlert } from "../../types";
import { useStore } from "../../store/useStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ICONS: Record<AppAlert["kind"], LucideIcon> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const VARIANTS = {
  error: "destructive",
  warning: "warning",
  info: "info",
} as const satisfies Record<AppAlert["kind"], string>;

export const AlertBar = () => {
  const alerts = useStore((s) => s.alerts);
  const dismissAlert = useStore((s) => s.dismissAlert);
  if (alerts.length === 0) return null;

  return (
    <div className="sticky top-0 z-360 flex flex-col">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.kind];
        return (
          <Alert
            key={alert.id}
            variant={VARIANTS[alert.kind]}
            className="rounded-none border-x-0 border-t-0 px-[clamp(14px,4vw,24px)] py-2.75 backdrop-blur-[10px] has-[>svg]:grid-cols-[--spacing(4.25)_1fr_auto]"
          >
            <Icon />
            <AlertDescription className="text-[13.5px] leading-normal text-current">
              {alert.message}
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => dismissAlert(alert.id)}
              aria-label="Dismiss"
              className="col-start-3 row-start-1 -my-1 size-6.5 text-current opacity-80 enabled:hover:bg-white/10 enabled:hover:text-current"
            >
              <X />
            </Button>
          </Alert>
        );
      })}
    </div>
  );
};
