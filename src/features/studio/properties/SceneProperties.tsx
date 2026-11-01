import type { Scene, SceneTransitionKind } from "../types/scene";
import {
  SCENE_TRANSITION_OPTIONS,
  TRANSITION_DURATION_MAX_MS,
  TRANSITION_DURATION_MIN_MS,
} from "../lib/sceneTransitions";
import { showSidebarView } from "../store/editorStore";
import {
  renameScene,
  setSceneBackground,
  setSceneTransition,
} from "../store/sceneActions";
import { SidebarPane } from "../sidebar/SidebarPane";
import {
  ColorField,
  PropertySection,
  SelectField,
  SliderField,
  TextField,
} from "./fields";
import { LiveSceneNote } from "./LiveSceneNote";

export const SceneProperties = ({ scene }: { scene: Scene }) => (
  <SidebarPane title="Scene settings" onBack={() => showSidebarView("items")}>
    <LiveSceneNote />
    <PropertySection title="Scene">
      <TextField
        key={scene.id}
        label="Scene name"
        required
        value={scene.name}
        onChange={(name) => renameScene(scene.id, name)}
      />
      <ColorField
        label="Colour behind everything"
        value={scene.background}
        onChange={(background) => setSceneBackground(scene.id, background)}
      />
    </PropertySection>
    <PropertySection
      title="Change to this scene with"
      info="GO LIVE uses this. Cut always changes straight away."
    >
      <SelectField
        label="Transition"
        value={scene.transition.kind}
        options={SCENE_TRANSITION_OPTIONS}
        onChange={(kind) =>
          setSceneTransition(scene.id, {
            ...scene.transition,
            kind: kind as SceneTransitionKind,
          })
        }
      />
      {scene.transition.kind !== "cut" && (
        <SliderField
          label="Length"
          value={scene.transition.durationMs}
          min={TRANSITION_DURATION_MIN_MS}
          max={TRANSITION_DURATION_MAX_MS}
          step={50}
          suffix="ms"
          onChange={(durationMs) =>
            setSceneTransition(scene.id, { ...scene.transition, durationMs })
          }
        />
      )}
    </PropertySection>
  </SidebarPane>
);
