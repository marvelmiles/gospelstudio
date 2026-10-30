import type { ReactNode } from "react";
import type { DraftEditOptions } from "../../hooks/useDraftHistory";
import { Field, SectionTitle } from "@/components/shared/Field";
import { InfoTip } from "@/components/shared/InfoTip";
import { RangeSlider } from "@/components/shared/RangeSlider";
import { SwitchField } from "@/components/shared/SwitchField";

export interface PlaybackChanges {
  autoPlay?: boolean;
  loopSlides?: boolean;
  slideDurationSeconds?: number;
}

interface PlaybackSettingsProps {
  autoPlay: boolean;
  loopSlides: boolean;
  seconds: number;
  info: ReactNode;
  infoAlign?: "start" | "center" | "end";
  onChange: (changes: PlaybackChanges, options?: DraftEditOptions) => void;
}

const MIN_SLIDE_SECONDS = 3;
const MAX_SLIDE_SECONDS = 60;

export const PlaybackSettings = ({
  autoPlay,
  loopSlides,
  seconds,
  info,
  infoAlign,
  onChange,
}: PlaybackSettingsProps) => (
  <>
    <SectionTitle
      info={
        <InfoTip title="Playback" align={infoAlign}>
          {info}
        </InfoTip>
      }
    >
      Playback
    </SectionTitle>
    <div className="mb-3">
      <SwitchField
        label="Auto-play slides while presenting"
        checked={autoPlay}
        onChange={(checked) => onChange({ autoPlay: checked })}
      />
      {autoPlay && (
        <SwitchField
          label="Loop back to the first slide after the last"
          checked={loopSlides}
          onChange={(checked) => onChange({ loopSlides: checked })}
        />
      )}
    </div>
    {autoPlay && (
      <Field label={`Seconds per slide (${seconds}s)`}>
        <RangeSlider
          value={seconds}
          min={MIN_SLIDE_SECONDS}
          max={MAX_SLIDE_SECONDS}
          suffix="s"
          onValueChange={(next) =>
            onChange(
              { slideDurationSeconds: next },
              { coalesceKey: "slideDurationSeconds" },
            )
          }
        />
      </Field>
    )}
  </>
);
