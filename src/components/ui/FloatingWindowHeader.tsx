import type { ReactNode } from "react";
import { GripHorizontal } from "lucide-react";
import type { FloatingWindowHandleProps } from "../../hooks/useFloatingWindow";

interface FloatingWindowHeaderProps {
  handleProps: FloatingWindowHandleProps;
  title: string;
  children?: ReactNode;
}

export const FloatingWindowHeader = ({
  handleProps,
  title,
  children,
}: FloatingWindowHeaderProps) => (
  <div
    {...handleProps}
    className="flex items-center gap-1.75 border-b border-line px-2.5 py-2"
  >
    <GripHorizontal size={14} className="shrink-0 text-dim" />
    <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-fg">
      {title}
    </span>
    {children}
  </div>
);

export const floatingWindowClassName =
  "fixed overflow-hidden rounded-[14px] border bg-panel-solid shadow-overlay outline-none";
