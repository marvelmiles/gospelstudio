import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "@/components/ui/card";
import { InfoTip } from "./InfoTip";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export const Panel = ({ children, className }: PanelProps) => (
  <Card
    className={cn(
      "block gap-0 rounded-2xl bg-secondary p-4.5 shadow-none",
      className,
    )}
  >
    {children}
  </Card>
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
    <span className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
      {Icon && <Icon size={17} className="text-primary-soft" />}
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
