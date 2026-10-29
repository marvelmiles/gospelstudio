import type { ReactNode } from "react";
import { Music } from "lucide-react";
import { mediaSurfaceProps } from "../../lib/mediaKeys";
import { cn } from "../../lib/utils";

interface AudioPreviewCardProps {
  caption?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}

export const AudioPreviewCard = ({
  caption,
  compact,
  children,
}: AudioPreviewCardProps) => (
  <div
    {...mediaSurfaceProps}
    className={cn(
      "mx-auto flex w-full max-w-160 flex-col items-center gap-4.5 rounded-[18px] border border-border bg-sidebar",
      compact ? "p-4.5" : "p-7",
    )}
  >
    <div
      aria-hidden
      className={cn(
        "grid place-items-center rounded-3xl bg-primary/14 text-primary-soft",
        compact ? "size-18" : "size-24",
      )}
    >
      <Music size={compact ? 30 : 40} />
    </div>
    {caption && (
      <div className="text-[13px] text-muted-foreground tabular-nums">
        {caption}
      </div>
    )}
    {children}
  </div>
);
