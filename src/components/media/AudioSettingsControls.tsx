import type { AudioSettings } from "../../types";
import { formatDuration } from "../../lib/media";
import { Field, SectionTitle } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { InfoTip } from "@/components/shared/InfoTip";
import { TrimFields } from "./TrimFields";

interface AudioSettingsControlsProps {
  settings: AudioSettings;
  onChange: (changes: Partial<AudioSettings>) => void;
  duration?: number;
  playhead: number;
  onIssueChange?: (field: string, message: string | null) => void;
}

export const AudioSettingsControls = ({
  settings,
  onChange,
  duration,
  playhead,
  onIssueChange,
}: AudioSettingsControlsProps) => {
  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Trim">
            Playback runs from the trim start to the trim end
            {duration ? ` (sound is ${formatDuration(duration)})` : ""}, and
            loops back to the start while slides are shown.
          </InfoTip>
        }
      >
        Trim
      </SectionTitle>
      <TrimFields
        trim={settings}
        onChange={onChange}
        duration={duration}
        playhead={playhead}
        onIssueChange={onIssueChange}
      />

      <SectionTitle>Level</SectionTitle>
      <Field label={`Volume (${settings.volume}%)`}>
        <RangeSlider
          value={settings.volume}
          min={0}
          max={100}
          suffix="%"
          onValueChange={(next) => onChange({ volume: next })}
        />
      </Field>
    </>
  );
};
