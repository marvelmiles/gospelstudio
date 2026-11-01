import { Modal } from "@/components/shared/Modal";
import { SwitchField } from "@/components/shared/SwitchField";
import type { SceneTransitionKind } from "../types/scene";
import {
  SCENE_TRANSITION_OPTIONS,
  TRANSITION_DURATION_MAX_MS,
  TRANSITION_DURATION_MIN_MS,
} from "../lib/sceneTransitions";
import {
  STUDIO_PIP_SHORTCUT_GROUP,
  STUDIO_SHORTCUT_GROUP,
} from "../../../lib/shortcuts";
import { ShortcutKeys } from "../../shortcuts/ShortcutKeys";
import { useProductionStore } from "../store/productionStore";
import { updateSettings } from "../store/productionActions";
import {
  PropertySection,
  SelectField,
  SliderField,
} from "../properties/fields";

const SHORTCUT_GROUPS = [STUDIO_SHORTCUT_GROUP, STUDIO_PIP_SHORTCUT_GROUP];

export const StudioSettingsDialog = ({ onClose }: { onClose: () => void }) => {
  const settings = useProductionStore((state) => state.production?.settings);
  if (!settings) return null;
  const transition = settings.defaultTransition;

  return (
    <Modal open onClose={onClose} title="Studio settings" width={560}>
      <PropertySection
        title="Editing"
        info="With the second switch off, changes made in Open editor wait until you press Update scene. The editors have the same switch, called Auto update."
      >
        <SwitchField
          label="Snap to edges, centres and other items while dragging"
          checked={settings.snapToGuides}
          onChange={(snapToGuides) => updateSettings({ snapToGuides })}
        />
        <SwitchField
          label="Send changes from Open editor to the scene as you make them"
          checked={settings.autoUpdateScene}
          onChange={(autoUpdateScene) => updateSettings({ autoUpdateScene })}
        />
      </PropertySection>

      <PropertySection
        title="Transition for new scenes"
        info="Each scene can still have its own. Click an empty part of the preview to change it for that scene."
      >
        <SelectField
          label="Transition"
          value={transition.kind}
          options={SCENE_TRANSITION_OPTIONS}
          onChange={(kind) =>
            updateSettings({
              defaultTransition: {
                ...transition,
                kind: kind as SceneTransitionKind,
              },
            })
          }
        />
        {transition.kind !== "cut" && (
          <SliderField
            label="Length"
            value={transition.durationMs}
            min={TRANSITION_DURATION_MIN_MS}
            max={TRANSITION_DURATION_MAX_MS}
            step={50}
            suffix="ms"
            onChange={(durationMs) =>
              updateSettings({
                defaultTransition: { ...transition, durationMs },
              })
            }
          />
        )}
      </PropertySection>

      {SHORTCUT_GROUPS.map((group) => (
        <PropertySection
          key={group.title}
          title={`${group.title} keyboard shortcuts`}
          defaultOpen={false}
        >
          <dl className="m-0 flex flex-col gap-2">
            {group.shortcuts.map((shortcut) => (
              <div
                key={shortcut.description}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-[13px] text-muted-foreground">
                  {shortcut.description}
                </dt>
                <dd className="m-0">
                  <ShortcutKeys keys={shortcut.keys} />
                </dd>
              </div>
            ))}
          </dl>
        </PropertySection>
      ))}
    </Modal>
  );
};
