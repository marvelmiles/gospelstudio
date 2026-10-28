import type { Theme } from "../../types";
import { useStore } from "../../store/useStore";
import { resolveStyle } from "../../lib/resolve";
import { Field, Range, SectionTitle, Toggle } from "../../components/ui/Field";
import { InfoTip } from "../../components/ui/InfoTip";
import { KeepOnResetToggle } from "../../components/ui/KeepOnResetToggle";
import { AnimationPicker } from "../../components/controls/AnimationPicker";
import { AudioPicker } from "../../components/controls/AudioPicker";
import { BackgroundPicker } from "../../components/controls/BackgroundPicker";
import { StyleControls } from "../../components/controls/StyleControls";
import { useOpenAssetLibrary } from "../assets/assetLibraryNavigation";
import type { ThemeDraftController } from "./useThemeDraft";

const DEFAULT_SLIDE_SECONDS = 15;

interface ThemeInspectorPanelProps {
  controller: ThemeDraftController;
}

export const ThemeInspectorPanel = ({
  controller,
}: ThemeInspectorPanelProps) => {
  const backgrounds = useStore((s) => s.backgrounds);
  const audio = useStore((s) => s.audio);
  const openAssetLibrary = useOpenAssetLibrary();

  const { draft, saved, patch } = controller;
  if (!draft) return null;

  return (
    <div className="p-4.5">
      <SectionTitle
        info={
          <InfoTip title="Text" align="end">
            The font, size, weight, alignment, colour and spacing every slide on
            this theme starts from. A single slide can still override any of it
            in its own editor.
          </InfoTip>
        }
      >
        Text
      </SectionTitle>
      <StyleControls
        style={resolveStyle(undefined, undefined, draft)}
        onChange={(key, value) =>
          patch({ [key]: value } as Partial<Theme>, {
            coalesceKey: `style:${key}`,
          })
        }
      />

      <SectionTitle>Background &amp; Animation</SectionTitle>
      <BackgroundPicker
        backgrounds={backgrounds}
        value={draft.backgroundId}
        onSelect={(id) => patch({ backgroundId: id })}
        onManage={() => openAssetLibrary("backgrounds", { locked: true })}
      />
      <div className="mt-4">
        <AnimationPicker
          value={draft.animation || ""}
          inheritLabel="App default"
          onSelect={(value) =>
            patch({ animation: (value || undefined) as Theme["animation"] })
          }
        />
      </div>

      <SectionTitle
        info={
          <InfoTip title="Playback" align="end">
            Auto-play walks the slides on by itself at the pace set here. A
            manuscript can set its own pace, and that wins over the theme.
          </InfoTip>
        }
      >
        Playback
      </SectionTitle>
      <div className="mb-3">
        <Toggle
          label="Auto-play slides"
          checked={Boolean(draft.autoPlay)}
          onChange={(checked) => patch({ autoPlay: checked })}
        />
      </div>
      <Field
        label={`Seconds per slide (${draft.slideDurationSeconds ?? DEFAULT_SLIDE_SECONDS}s)`}
      >
        <Range
          value={draft.slideDurationSeconds ?? DEFAULT_SLIDE_SECONDS}
          min={3}
          max={60}
          suffix="s"
          onChange={(event) =>
            patch(
              { slideDurationSeconds: Number(event.target.value) },
              { coalesceKey: "slideDurationSeconds" },
            )
          }
        />
      </Field>

      <SectionTitle>Audio</SectionTitle>
      <AudioPicker
        audio={audio}
        value={draft.defaultAudioId || ""}
        onSelect={(id) => patch({ defaultAudioId: id || null })}
        onManage={() => openAssetLibrary("audio", { locked: true })}
      />

      {draft.builtIn ? (
        <div className="mt-4.5 flex items-center gap-1 text-[12.5px] text-dim">
          Default theme
          <InfoTip title="Default theme" align="end">
            You can edit a default theme, but it can&apos;t be deleted.
          </InfoTip>
        </div>
      ) : (
        <div className="mt-4.5">
          <KeepOnResetToggle
            kind="theme"
            item={saved ?? draft}
            variant="button"
          />
        </div>
      )}
    </div>
  );
};
