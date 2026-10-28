import type { ReactNode } from "react";
import type { Background, ImageSettings, VideoSettings } from "../../types";
import { cn } from "../../lib/cn";
import { BackgroundSurface } from "../media/BackgroundSurface";

interface BgSwatchProps {
  bg?: Background;
  settings?: ImageSettings | null;
  videoSettings?: VideoSettings | null;
  className?: string;
  children?: ReactNode;
}

export const BgSwatch = ({
  bg,
  settings,
  videoSettings,
  className,
  children,
}: BgSwatchProps) => (
  <div className={cn("relative overflow-hidden", className)}>
    <BackgroundSurface
      background={bg}
      settings={settings}
      videoSettings={videoSettings}
      variant="thumb"
    />
    {children != null && <div className="relative size-full">{children}</div>}
  </div>
);
