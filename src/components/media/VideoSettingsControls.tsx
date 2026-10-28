import type { VideoSettings } from "../../types";
import {
  formatDuration,
  needsHoursField,
  timecodeShape,
} from "../../lib/media";
import { Field, Range, SectionTitle, Select, Toggle } from "../ui/Field";
import { InfoTip } from "../ui/InfoTip";
import {
  PLAYBACK_RATE_OPTIONS,
  SCREEN_FIT_OPTIONS,
} from "../../lib/mediaOptions";
import { cn } from "../../lib/cn";
import { AdjustmentControls, settingsColumns } from "./AdjustmentControls";
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
          <Range
            value={settings.volume}
            min={0}
            max={100}
            suffix="%"
            onChange={(event) =>
              onChange({ volume: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Speed">
          <Select
            value={String(settings.playbackRate)}
            options={PLAYBACK_RATE_OPTIONS}
            onChange={(event) =>
              onChange({ playbackRate: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Screen fit">
          <Select
            value={settings.fit}
            options={SCREEN_FIT_OPTIONS}
            onChange={(event) =>
              onChange({ fit: event.target.value as VideoSettings["fit"] })
            }
          />
        </Field>
      </div>
      <div className="mb-1 flex flex-wrap gap-6">
        <div className="min-w-45 flex-1">
          <Toggle
            label="Muted"
            checked={settings.muted}
            onChange={(muted) => onChange({ muted })}
          />
        </div>
        <div className="min-w-45 flex-1">
          <Toggle
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
