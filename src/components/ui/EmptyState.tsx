import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
  bare?: boolean;
}

interface MissingArtifactProps {
  icon: LucideIcon;
  compact?: boolean;
}

const MissingArtifact = ({ icon: Icon, compact }: MissingArtifactProps) => {
  const frame = cn(
    "absolute top-0 left-1/2 rounded-[14px] border border-line bg-panel shadow-[0_8px_20px_rgb(0_0_0/0.28)]",
    compact ? "-ml-13 h-16.5 w-26" : "-ml-16 h-20 w-32",
  );
  const bar = "h-1.5 rounded-full bg-sub/28";

  return (
    <div
      className={cn(
        "relative mx-auto mb-5.5",
        compact ? "h-24 w-36" : "h-27.5 w-42",
      )}
    >
      <div
        className={cn(
          frame,
          "translate-x-[-16px] translate-y-4 -rotate-8 opacity-55",
        )}
      />
      <div
        className={cn(
          frame,
          "translate-x-4.5 translate-y-2.75 rotate-7 opacity-70",
        )}
      />
      <div
        className={cn(
          frame,
          "flex flex-col items-center justify-center gap-2.25 bg-panel-solid shadow-overlay",
        )}
      >
        <div className="grid text-accent">
          <Icon size={compact ? 22 : 26} />
        </div>
        <div className="flex flex-col items-center gap-1.25">
          <div className={cn(bar, compact ? "w-11" : "w-13.5")} />
          <div className={cn(bar, compact ? "w-7" : "w-8.5")} />
        </div>
      </div>
    </div>
  );
};

export const EmptyState = ({
  icon,
  title,
  message,
  action,
  compact,
  bare,
}: EmptyStateProps) => (
  <div
    className={cn(
      "text-center",
      !bare && "glass",
      compact ? "px-6 py-8.5" : "px-7 py-14",
    )}
  >
    <MissingArtifact icon={icon} compact={compact} />
    <h3 className="mt-0 mb-1.5 text-[19px] font-semibold text-fg">{title}</h3>
    <p className="mx-auto my-0 max-w-95 text-[13.5px] leading-[1.6] text-sub">
      {message}
    </p>
    {action && <div className="mt-4.5 flex justify-center">{action}</div>}
  </div>
);
