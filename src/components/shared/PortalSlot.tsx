import { useLayoutEffect, useRef } from "react";
import { cn } from "../../lib/utils";

interface PortalSlotProps {
  host: HTMLElement;
  className?: string;
}

export const PortalSlot = ({ host, className }: PortalSlotProps) => {
  const slotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    slotRef.current?.appendChild(host);
  }, [host]);

  return <div ref={slotRef} className={cn("absolute inset-0", className)} />;
};
