import type { VideoSettings } from "../../types";
import {
  formatDuration,
  needsHoursField,
  timecodeShape,
} from "../../lib/media";
import { Field, SectionTitle } from "@/components/shared/Field";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { InfoTip } from "@/components/shared/InfoTip";
import {
  PLAYBACK_RATE_OPTIONS,
  SCREEN_FIT_OPTIONS,
} from "../../lib/mediaOptions";
import { cn } from "../../lib/utils";
import { AdjustmentControls } from "./AdjustmentControls";
import { settingsColumns } from "./settingsColumns";
import { TrimFields } from "./TrimFields";

interface VideoSettingsControlsProps {
  settings: VideoSettings;
  onChange: (changes: Partial<VideoSettings>) => void;
  duration?: number;
  playhead?: number;
  onIssueChange?: (field: string, message: string | null) => void;
  narrow?: boolean;
}

export const VideoSettingsControls = ({
  settings,
  onChange,
  duration,
  playhead,
  onIssueChange,
  narrow,
}: VideoSettingsControlsProps) => {
  const columns = settingsColumns(narrow);
  const shape = timecodeShape(needsHoursField(duration));

  return (
    <>
      <SectionTitle
        info={
          <InfoTip title="Trim">
            Playback runs from the trim start to the trim end
            {duration ? ` (video is ${formatDuration(duration)})` : ""}. Write
            both as {shape}, two digits per field. Clearing the end takes it
            back to the last frame.
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
        className={columns}
        onIssueChange={onIssueChange}
      />

      <SectionTitle>Playback</SectionTitle>
      <div className={cn("grid gap-x-4", columns)}>
        <Field label={`Volume (${settings.volume}%)`}>
          <RangeSlider
            value={settings.volume}
            min={0}
            max={100}
            suffix="%"
            onValueChange={(next) => onChange({ volume: next })}
          />
        </Field>
        <Field label="Speed">
          <OptionSelect
            value={String(settings.playbackRate)}
            options={PLAYBACK_RATE_OPTIONS}
            onValueChange={(next) => onChange({ playbackRate: Number(next) })}
          />
        </Field>
        <Field label="Screen fit">
          <OptionSelect
            value={settings.fit}
            options={SCREEN_FIT_OPTIONS}
            onValueChange={(next) =>
              onChange({ fit: next as VideoSettings["fit"] })
            }
          />
        </Field>
      </div>
      <div className="mb-1 flex flex-wrap gap-6">
        <div className="min-w-45 flex-1">
          <SwitchField
            label="Muted"
            checked={settings.muted}
            onChange={(muted) => onChange({ muted })}
          />
        </div>
        <div className="min-w-45 flex-1">
          <SwitchField
            label="Loop"
            checked={settings.loop}
            onChange={(loop) => onChange({ loop })}
          />
        </div>
      </div>

      <SectionTitle>Adjustments</SectionTitle>
      <AdjustmentControls value={settings} onChange={onChange} />
    </>
  );
};
