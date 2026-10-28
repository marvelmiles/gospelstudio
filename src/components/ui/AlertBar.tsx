import { AlertTriangle, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppAlert } from "../../types";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/cn";

const ICONS: Record<AppAlert["kind"], LucideIcon> = {
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const TONES: Record<AppAlert["kind"], string> = {
  error: "bg-danger/15 border-danger/42 text-danger-fg",
  warning: "bg-warning/15 border-warning/42 text-warning-fg",
  info: "bg-info/15 border-info/42 text-info-fg",
};

export const AlertBar = () => {
  const alerts = useStore((s) => s.alerts);
  const dismissAlert = useStore((s) => s.dismissAlert);
  if (alerts.length === 0) return null;

  return (
    <div className="sticky top-0 z-360 flex flex-col">
      {alerts.map((alert) => {
        const Icon = ICONS[alert.kind];
        return (
          <div
            key={alert.id}
            role="alert"
            className={cn(
              "flex items-start gap-2.75 border-b px-[clamp(14px,4vw,24px)] py-2.75 backdrop-blur-[10px]",
              TONES[alert.kind],
            )}
          >
            <Icon size={17} className="mt-px shrink-0" />
            <span className="flex-1 text-[13.5px] leading-normal">
              {alert.message}
            </span>
            <button
              onClick={() => dismissAlert(alert.id)}
              aria-label="Dismiss"
              className="grid size-6.5 shrink-0 place-items-center rounded-[7px] border-none bg-transparent text-current opacity-80"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
