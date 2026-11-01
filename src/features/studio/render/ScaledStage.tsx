import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type StageFit,
} from "../lib/canvasCoordinates";
import { useCanvasFit } from "../hooks/useCanvasFit";
import { StageScaleContext } from "./renderSurface";

interface ScaledStageProps {
  background: string;
  fit?: StageFit;
  className?: string;
  stageClassName?: string;
  children: ReactNode;
  overlay?: ReactNode;
}

export const ScaledStage = ({
  background,
  fit = "contain",
  className,
  stageClassName,
  children,
  overlay,
}: ScaledStageProps) => {
  const { ref, transform } = useCanvasFit<HTMLDivElement>(fit);
  const { scaleX, scaleY, offsetX, offsetY } = transform;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {scaleX > 0 && (
        <StageScaleContext.Provider value={scaleX}>
          <div
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              background,
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${scaleX}, ${scaleY})`,
            }}
            className={cn(
              "absolute top-0 left-0 origin-top-left overflow-hidden",
              stageClassName,
            )}
          >
            {children}
          </div>
          {overlay}
        </StageScaleContext.Provider>
      )}
    </div>
  );
};
