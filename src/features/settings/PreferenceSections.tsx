import type { EasingKind, PresentationView, Prefs, Theme } from "../../types";
import { InfoTip } from "@/components/shared/InfoTip";
import { Field, SectionTitle } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { AnimationPicker } from "../../components/controls/AnimationPicker";

const VIEW_OPTIONS = [
  { value: "normal", label: "Normal (fit, letterboxed)" },
  { value: "cover", label: "Cover (fill, may crop)" },
  { value: "fill", label: "Fill (stretch to screen)" },
];

const EASING_OPTIONS = [
  { value: "ease", label: "Ease" },
  { value: "ease-in-out", label: "Ease in-out" },
  { value: "ease-out", label: "Ease out" },
  { value: "linear", label: "Linear" },
];

interface PreferenceSectionProps {
  prefs: Prefs;
  onChange: (changes: Partial<Prefs>) => void;
}

export const PresentationSection = ({
  prefs,
  onChange,
}: PreferenceSectionProps) => (
  <>
    <SectionTitle>Presentation</SectionTitle>
    <Field label="Default screen fit">
      <OptionSelect
        value={prefs.presentationView}
        options={VIEW_OPTIONS}
        onValueChange={(next) =>
          onChange({
            presentationView: next as PresentationView,
          })
        }
      />
    </Field>
    <div className="mb-3.5">
      <SwitchField
        label="Show presenter bar"
        checked={prefs.showPresenterBar}
        onChange={(checked) => onChange({ showPresenterBar: checked })}
      />
    </div>
    <div className="mb-2.5">
      <SwitchField
        label="Auto-hide controls on mouse leave"
        checked={prefs.autoHideControls}
        onChange={(checked) => onChange({ autoHideControls: checked })}
      />
    </div>
    <div className="mb-3.5">
      <SwitchField
        label="Auto-hide presenter bar on mouse leave"
        checked={prefs.autoHidePresenterBar}
        onChange={(checked) => onChange({ autoHidePresenterBar: checked })}
      />
    </div>
  </>
);

export const DefaultThemesSection = ({
  prefs,
  themes,
  onChange,
}: PreferenceSectionProps & { themes: Theme[] }) => {
  const themeOptions = themes.map((theme) => ({
    value: theme.id,
    label: theme.name,
  }));
  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Default themes">
            Applied to newly created manuscripts and to Bible passages presented
            or saved from the reader.
          </InfoTip>
        }
      >
        Default Themes
      </SectionTitle>
      <Field label="Manuscripts">
        <OptionSelect
          value={prefs.defaultManuscriptThemeId}
          options={themeOptions}
          onValueChange={(next) => onChange({ defaultManuscriptThemeId: next })}
        />
      </Field>
      <Field label="Bible">
        <OptionSelect
          value={prefs.defaultScriptureThemeId}
          options={themeOptions}
          onValueChange={(next) => onChange({ defaultScriptureThemeId: next })}
        />
      </Field>
    </>
  );
};

export const TransitionsSection = ({
  prefs,
  onChange,
}: PreferenceSectionProps) => (
  <>
    <SectionTitle>Transitions</SectionTitle>
    <AnimationPicker
      label="Default animation"
      value={prefs.transition}
      onSelect={(value) =>
        onChange({ transition: value as Prefs["transition"] })
      }
    />
    <Field label="Duration">
      <RangeSlider
        aria-label="Transition duration"
        value={prefs.transitionDuration}
        min={150}
        max={1500}
        step={50}
        suffix="ms"
        onValueChange={(next) => onChange({ transitionDuration: next })}
      />
    </Field>
    <Field label="Easing">
      <OptionSelect
        value={prefs.easing}
        options={EASING_OPTIONS}
        onValueChange={(next) => onChange({ easing: next as EasingKind })}
      />
    </Field>
  </>
);

export const BibleSection = ({ prefs, onChange }: PreferenceSectionProps) => (
  <>
    <SectionTitle
      info={
        <InfoTip title="Reading aloud">
          Applies everywhere the Bible is read aloud, in the Bible reader and
          while presenting a passage. Each verse starts with its number, for
          example "Verse 2", before its words are read.
        </InfoTip>
      }
    >
      Bible
    </SectionTitle>
    <div className="mb-1.5">
      <SwitchField
        label="Say verse numbers when reading aloud"
        checked={prefs.readVerseNumbers}
        onChange={(checked) => onChange({ readVerseNumbers: checked })}
      />
    </div>
  </>
);

export const AudioSection = ({ prefs, onChange }: PreferenceSectionProps) => (
  <>
    <SectionTitle>Audio</SectionTitle>
    <Field label="Background audio volume">
      <RangeSlider
        aria-label="Background audio volume"
        value={prefs.backgroundVolume}
        min={0}
        max={100}
        suffix="%"
        onValueChange={(next) => onChange({ backgroundVolume: next })}
      />
    </Field>
    <div className="mb-1.5">
      <SwitchField
        label="Loop background audio"
        checked={prefs.loopAudio}
        onChange={(checked) => onChange({ loopAudio: checked })}
      />
    </div>
  </>
);
