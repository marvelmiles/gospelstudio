import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { InfoTip } from "./InfoTip";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export const Panel = ({ children, className }: PanelProps) => (
  <div
    className={cn("rounded-2xl border border-line bg-raise p-4.5", className)}
  >
    {children}
  </div>
);

interface PanelTitleProps {
  title: string;
  icon?: LucideIcon;
  info?: ReactNode;
  trailing?: ReactNode;
  centered?: boolean;
}

export const PanelTitle = ({
  title,
  icon: Icon,
  info,
  trailing,
  centered = false,
}: PanelTitleProps) => (
  <div
    className={cn(
      "mb-3.5 flex items-center gap-2",
      centered
        ? "justify-center"
        : trailing
          ? "justify-between"
          : "justify-start",
    )}
  >
    <span className="inline-flex items-center gap-2 text-base font-semibold text-fg">
      {Icon && <Icon size={17} className="text-accent-soft" />}
      {title}
      {info && (
        <InfoTip title={title} align={centered ? "center" : "start"}>
          {info}
        </InfoTip>
      )}
    </span>
    {trailing}
  </div>
);
