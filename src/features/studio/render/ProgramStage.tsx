import { useMemo } from "react";
import { TransitionLayers } from "@/components/shared/TransitionLayers";
import type { ProgramSnapshot } from "../types/production";
import type { SceneTransition } from "../types/scene";
import { sceneTransitionMotion } from "../lib/sceneTransitions";
import { SceneLayers } from "./SceneLayers";

const NO_TRANSITION: SceneTransition = { kind: "cut", durationMs: 0 };
const EMPTY_SCENE_KEY = "nothing-live";
const BLACK = "#000000";

export const ProgramStage = ({
  program,
}: {
  program: ProgramSnapshot | null;
}) => {
  const transition = program?.transition ?? NO_TRANSITION;
  const motion = useMemo(() => sceneTransitionMotion(transition), [transition]);
  const geometryMs = transition.kind === "cut" ? 0 : transition.durationMs;

  return (
    <TransitionLayers
      transitionKey={program?.sceneId ?? EMPTY_SCENE_KEY}
      transition={motion}
      className="absolute inset-0"
    >
      {program ? (
        <SceneLayers
          layers={program.layers}
          background={program.background}
          geometryMs={geometryMs}
        />
      ) : (
        <div style={{ background: BLACK }} className="absolute inset-0" />
      )}
    </TransitionLayers>
  );
};
