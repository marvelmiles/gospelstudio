import type { Theme } from "../../types";
import { useStore } from "../../store/useStore";
import { DEFAULT_SLIDE_SECONDS, resolveStyle } from "../../lib/resolve";
import { SectionTitle } from "@/components/shared/Field";
import { InfoTip } from "@/components/shared/InfoTip";
import { KeepOnResetToggle } from "@/components/shared/KeepOnResetToggle";
import { AnimationPicker } from "../../components/controls/AnimationPicker";
import { AudioPicker } from "../../components/controls/AudioPicker";
import { BackgroundPicker } from "../../components/controls/BackgroundPicker";
import { PlaybackSettings } from "../../components/controls/PlaybackSettings";
import { StyleControls } from "../../components/controls/StyleControls";
import { useOpenAssetLibrary } from "../assets/assetLibraryNavigation";
import type { ThemeDraftController } from "./useThemeDraft";

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

      <PlaybackSettings
        autoPlay={Boolean(draft.autoPlay)}
        loopSlides={Boolean(draft.loopSlides)}
        seconds={draft.slideDurationSeconds ?? DEFAULT_SLIDE_SECONDS}
        info="Auto-play walks the slides on by itself at the pace set here, and looping starts again from the first slide. A manuscript or passage can set its own playback, and that wins over the theme."
        infoAlign="end"
        onChange={patch}
      />

      <SectionTitle>Audio</SectionTitle>
      <AudioPicker
        audio={audio}
        value={draft.defaultAudioId || ""}
        onSelect={(id) => patch({ defaultAudioId: id || null })}
        onManage={() => openAssetLibrary("audio", { locked: true })}
      />

      {draft.builtIn ? (
        <div className="mt-4.5 flex items-center gap-1 text-[12.5px] text-subtle-foreground">
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
