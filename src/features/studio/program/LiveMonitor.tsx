import { cn } from "../../../lib/utils";
import { useProgram } from "../store/productionStore";
import { ProgramStage } from "../render/ProgramStage";
import { RenderSurfaceContext } from "../render/renderSurface";
import { ScaledStage } from "../render/ScaledStage";
import { MonitorFrame } from "./MonitorFrame";

export const LiveMonitor = ({ className }: { className?: string }) => {
  const program = useProgram();

  return (
    <MonitorFrame
      badge={{ tone: program ? "live" : "idle", label: "Live" }}
      label="Live"
      description="What everyone sees"
      sceneName={program?.sceneName}
      className={className}
    >
      <RenderSurfaceContext.Provider value="monitor">
        <ScaledStage
          background="#000000"
          className={cn(
            "aspect-video w-full rounded-xl bg-black ring-2",
            program ? "ring-destructive/70" : "ring-border",
          )}
          overlay={program ? undefined : <NothingLive />}
        >
          <ProgramStage program={program} />
        </ScaledStage>
      </RenderSurfaceContext.Provider>
    </MonitorFrame>
  );
};

const NothingLive = () => (
  <div className="absolute inset-0 grid place-items-center p-4 text-center">
    <p className="m-0 text-[12.5px] text-white/60">Nothing is live yet</p>
  </div>
);
