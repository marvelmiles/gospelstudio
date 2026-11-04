import { CircleCheck, MonitorOff, Radio, Scissors } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { SCENE_TRANSITION_OPTIONS } from "../lib/sceneTransitions";
import { isSceneLive } from "../lib/productionFactory";
import { usePreviewScene, useProgram } from "../store/productionStore";
import {
  BLACK_SCREEN_SCENE_ID,
  goLive,
  showBlackScreen,
} from "../store/programActions";

const transitionLabel = (kind: string, durationMs: number): string => {
  const option = SCENE_TRANSITION_OPTIONS.find((entry) => entry.value === kind);
  if (kind === "cut") return option?.label ?? "Cut";
  return `${option?.label ?? "Crossfade"}, ${(durationMs / 1000).toFixed(1)}s`;
};

export const GoLiveControls = ({ className }: { className?: string }) => {
  const scene = usePreviewScene();
  const program = useProgram();
  if (!scene) return null;

  const isUpToDate = isSceneLive(scene, program);
  const isSameScene = program?.sceneId === scene.id;
  const isBlack = program?.sceneId === BLACK_SCREEN_SCENE_ID;
  const transition = transitionLabel(
    scene.transition.kind,
    scene.transition.durationMs,
  ).toLowerCase();

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Button
        size="lg"
        onClick={() => goLive("transition")}
        disabled={isUpToDate}
        title={`Show ${scene.name} on the live screen with a ${transition}`}
        className={cn(
          "h-14 w-full flex-col gap-0 rounded-xl text-base font-extrabold tracking-[0.06em]",
          !isUpToDate &&
            "border-destructive/50 bg-destructive shadow-[0_6px_20px_rgb(220_38_38/0.35)] enabled:hover:bg-destructive/90",
        )}
      >
        <span className="inline-flex items-center gap-2">
          {isUpToDate ? <CircleCheck /> : <Radio />}
          {isUpToDate ? "ON THE LIVE SCREEN" : "GO LIVE"}
        </span>
        {isSameScene && !isUpToDate && (
          <span className="text-[11px] font-semibold tracking-normal opacity-85">
            Send your changes
          </span>
        )}
      </Button>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(7.5rem,100%),1fr))] gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => goLive("cut")}
          disabled={isUpToDate}
          title={`Switch the live screen to ${scene.name} straight away, with no fade`}
        >
          <Scissors />
          Cut
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={showBlackScreen}
          disabled={isBlack || !program}
          title="Fade the live screen to black"
        >
          <MonitorOff />
          Black screen
        </Button>
      </div>
    </div>
  );
};
