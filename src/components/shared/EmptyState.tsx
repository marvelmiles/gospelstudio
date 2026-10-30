import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
  compact?: boolean;
  bare?: boolean;
  className?: string;
}

interface MissingArtifactProps {
  icon: LucideIcon;
  compact?: boolean;
}

const MissingArtifact = ({ icon: Icon, compact }: MissingArtifactProps) => {
  const frame = cn(
    "absolute top-0 left-1/2 rounded-[14px] border bg-card/85 shadow-[0_8px_20px_rgb(0_0_0/0.28)]",
    compact ? "-ml-13 h-16.5 w-26" : "-ml-16 h-20 w-32",
  );
  const bar = "h-1.5 rounded-full bg-muted-foreground/28";

  return (
    <div
      aria-hidden
      className={cn("relative mx-auto", compact ? "h-24 w-36" : "h-27.5 w-42")}
    >
      <div
        className={cn(
          frame,
          "-translate-x-4 translate-y-4 -rotate-8 opacity-55",
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
          "flex flex-col items-center justify-center gap-2.25 bg-card shadow-overlay",
        )}
      >
        <Icon size={compact ? 22 : 26} className="text-primary" />
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
  className,
}: EmptyStateProps) => (
  <Empty
    className={cn(
      "gap-4.5 border-solid",
      bare ? "border-none" : "glass",
      compact ? "px-6 py-8.5 md:px-6 md:py-8.5" : "px-7 py-14 md:px-7 md:py-14",
      className,
    )}
  >
    <EmptyHeader className="max-w-95 gap-1.5">
      <EmptyMedia className="mb-1">
        <MissingArtifact icon={icon} compact={compact} />
      </EmptyMedia>
      <EmptyTitle className="text-[19px] font-semibold tracking-normal text-foreground">
        {title}
      </EmptyTitle>
      <EmptyDescription className="text-[13.5px] leading-[1.6]">
        {message}
      </EmptyDescription>
    </EmptyHeader>
    {action && <EmptyContent>{action}</EmptyContent>}
  </Empty>
);
