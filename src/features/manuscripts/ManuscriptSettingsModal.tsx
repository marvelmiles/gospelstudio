import type {
  AudioItem,
  Background,
  HymnMusic,
  Manuscript,
  TextStyle,
  Theme,
} from "../../types";
import { COLLECTIONS, DEFAULT_COLLECTION } from "../../data/collections";
import {
  resolveAudioSettings,
  resolveAutoPlay,
  resolveBackgroundImage,
  resolveBackgroundVideo,
  resolveSlideDuration,
  resolveStyle,
} from "../../lib/resolve";
import { findBackgroundClip } from "../../lib/media";
import { validateName } from "../../lib/validation";
import { Modal } from "@/components/shared/Modal";
import { InfoTip } from "@/components/shared/InfoTip";
import { Field, SectionTitle } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Input } from "@/components/ui/input";
import { SwitchField } from "@/components/shared/SwitchField";
import { StyleControls } from "../../components/controls/StyleControls";
import { BackgroundPicker } from "../../components/controls/BackgroundPicker";
import { AudioPicker } from "../../components/controls/AudioPicker";
import { AnimationPicker } from "../../components/controls/AnimationPicker";
import type { AssetUsageRequest } from "../../lib/assetUsage";
import { useOpenAssetLibrary } from "../assets/assetLibraryNavigation";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

interface ManuscriptSettingsModalProps {
  open: boolean;
  onClose: () => void;
  manuscript: Manuscript;
  theme: Theme;
  themes: Theme[];
  backgrounds: Background[];
  audio: AudioItem[];
  onPatchManuscript: (changes: Partial<Manuscript>) => void;
  onStyleChange: (key: keyof TextStyle, value: unknown) => void;
  onEditAsset: (request: AssetUsageRequest) => void;
}

const gridClassName =
  "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3";

const TuneDetails = ({ music }: { music: HymnMusic }) => {
  const rows: [string, string][] = [
    ["Tune", music.tune ?? ""],
    ["Composer", music.composer ?? ""],
    ["Meter", music.meter ?? ""],
    ["Key", music.key ?? ""],
    ["Tempo", music.tempo ? `${music.tempo} bpm` : ""],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  if (!rows.length && !music.source) return null;

  return (
    <>
      <SectionTitle>Tune</SectionTitle>
      <dl className={cn(gridClassName, "mt-0 mb-3.25")}>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="mb-1.5 text-[11.5px] font-semibold tracking-[0.4px] text-subtle-foreground uppercase">
              {label}
            </dt>
            <dd className="m-0 text-[13.5px] text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      {music.source && (
        <p className="mt-0 mb-3.25 text-[11.5px] leading-normal text-subtle-foreground">
          {music.source}
        </p>
      )}
    </>
  );
};

export const ManuscriptSettingsModal = ({
  open,
  onClose,
  manuscript,
  theme,
  themes,
  backgrounds,
  audio,
  onPatchManuscript,
  onStyleChange,
  onEditAsset,
}: ManuscriptSettingsModalProps) => {
  const openAssetLibrary = useOpenAssetLibrary();
  const media = useStore((s) => s.media);
  const titleError = validateName(manuscript.title, "manuscript title");
  const manuscriptStyle = resolveStyle(undefined, manuscript, theme);
  const duration = resolveSlideDuration(manuscript, theme);
  const autoPlay = resolveAutoPlay(manuscript, theme);
  const themeAudio = theme.defaultAudioId
    ? audio.find((a) => a.id === theme.defaultAudioId)
    : undefined;
  const effectiveBackground = backgrounds.find(
    (bg) => bg.id === (manuscript.defaultBackgroundId || theme.backgroundId),
  );
  const backgroundVideoItem = findBackgroundClip(
    media,
    effectiveBackground?.mediaId,
  );
  const backgroundImage = effectiveBackground
    ? resolveBackgroundImage(undefined, manuscript, effectiveBackground)
    : null;
  const backgroundVideo = effectiveBackground
    ? resolveBackgroundVideo(
        undefined,
        manuscript,
        effectiveBackground,
        backgroundVideoItem,
      )
    : null;
  const manuscriptAudio = audio.find(
    (item) => item.id === (manuscript.defaultAudioId || ""),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manuscript Settings"
      width={620}
      info={
        <InfoTip title="Manuscript settings">
          These settings apply to every slide in this manuscript. Individual
          slides can still override them in the inspector.
        </InfoTip>
      }
    >
      <SectionTitle>Details</SectionTitle>
      <div className={gridClassName}>
        <Field label="Title" error={titleError}>
          <Input
            value={manuscript.title}
            aria-invalid={Boolean(titleError)}
            onChange={(e) => onPatchManuscript({ title: e.target.value })}
          />
        </Field>
        <Field label="Author">
          <Input
            value={manuscript.author || ""}
            onChange={(e) => onPatchManuscript({ author: e.target.value })}
          />
        </Field>
        <Field label="Collection">
          <OptionSelect
            value={manuscript.collection || DEFAULT_COLLECTION}
            options={[...COLLECTIONS]}
            onValueChange={(next) => onPatchManuscript({ collection: next })}
          />
        </Field>
        <Field label="Theme">
          <OptionSelect
            value={manuscript.defaultThemeId}
            options={themes.map((t) => ({ value: t.id, label: t.name }))}
            onValueChange={(next) =>
              onPatchManuscript({ defaultThemeId: next })
            }
          />
        </Field>
      </div>

      {manuscript.music && <TuneDetails music={manuscript.music} />}

      <SectionTitle>Text</SectionTitle>
      <StyleControls style={manuscriptStyle} onChange={onStyleChange} />

      <SectionTitle>Background</SectionTitle>
      <BackgroundPicker
        backgrounds={backgrounds}
        value={manuscript.defaultBackgroundId || ""}
        highlightId={manuscript.defaultBackgroundId || theme.backgroundId}
        onSelect={(id, image) =>
          onPatchManuscript({
            defaultBackgroundId: id,
            defaultBackgroundImage: image,
          })
        }
        onManage={() => openAssetLibrary("backgrounds", { locked: true })}
        imageSettings={backgroundImage}
        videoSettings={backgroundVideo}
        onEditUsage={onEditAsset}
      />

      <SectionTitle>Audio</SectionTitle>
      <AudioPicker
        audio={audio}
        value={manuscript.defaultAudioId || ""}
        inheritLabel={
          themeAudio ? `Use theme audio (${themeAudio.name})` : undefined
        }
        onSelect={(id) => onPatchManuscript({ defaultAudioId: id || null })}
        onManage={() => openAssetLibrary("audio", { locked: true })}
        settings={
          manuscriptAudio
            ? resolveAudioSettings(undefined, manuscript, manuscriptAudio)
            : undefined
        }
        onEditUsage={onEditAsset}
      />

      <SectionTitle>Animation</SectionTitle>
      <AnimationPicker
        value={manuscript.animation || ""}
        inheritLabel="Use theme / app default"
        onSelect={(value) =>
          onPatchManuscript({
            animation: (value || undefined) as Manuscript["animation"],
          })
        }
      />

      <SectionTitle>Keyboard Shortcuts</SectionTitle>
      <Field
        label="Shortcut mode"
        info={
          <InfoTip title="Shortcut mode">
            {manuscript.shortcutMode === "all-slides"
              ? "Ctrl+number shortcuts are assigned to every slide in order: Ctrl+1 for slide 1, Ctrl+2 for slide 2, and so on."
              : "Ctrl+number shortcuts jump to verses only: Ctrl+1 for Verse 1, Ctrl+2 for Verse 2, and so on. Other sections use fixed shortcuts: Ctrl+C Chorus, Ctrl+B Bridge, Ctrl+I Intro, Ctrl+O Outro, Ctrl+P Pre-Chorus, Ctrl+R Refrain, Ctrl+T Tag."}
          </InfoTip>
        }
      >
        <OptionSelect
          value={manuscript.shortcutMode || "first-slide-per-tag"}
          options={[
            {
              value: "first-slide-per-tag",
              label: "Tag first slide only (default)",
            },
            { value: "all-slides", label: "Every slide" },
          ]}
          onValueChange={(next) =>
            onPatchManuscript({
              shortcutMode: next as Manuscript["shortcutMode"],
            })
          }
        />
      </Field>

      <SectionTitle
        info={
          <InfoTip title="Playback">
            With auto-play on, slides advance on their own after the seconds
            below. With it off, slides change only when you navigate, animating
            in with their chosen animation.
          </InfoTip>
        }
      >
        Playback
      </SectionTitle>
      <div className="mb-3">
        <SwitchField
          label="Auto-play slides while presenting"
          checked={autoPlay}
          onChange={(checked) => onPatchManuscript({ autoPlay: checked })}
        />
      </div>
      <Field label={`Seconds per slide (${duration}s)`}>
        <RangeSlider
          value={duration}
          min={3}
          max={60}
          suffix="s"
          onValueChange={(next) =>
            onPatchManuscript({ slideDurationSeconds: next })
          }
        />
      </Field>
    </Modal>
  );
};
