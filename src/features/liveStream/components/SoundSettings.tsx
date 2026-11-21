import { useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { FieldLabel } from "../../studio/properties/fields";
import {
  useProgramCaptureStore,
  type SoundInputStatus,
} from "../../studio/capture/programCapture";
import type { NoiseSuppressionState } from "../../studio/capture/programSound";
import {
  setNoiseSuppression,
  setSoundInputDevice,
  setSoundPolish,
  useProgramSoundSettings,
} from "../../studio/capture/programSoundSettings";
import { useAudioInputDevices } from "../../studio/hooks/useAudioInputDevices";
import { useProgramSoundLevel } from "../../studio/hooks/useProgramSoundLevel";

const NO_INPUT = "";
const LEVEL_SEGMENTS = 20;

const SOUND_INPUT_NOTES: Record<SoundInputStatus, string | null> = {
  off: null,
  connecting: "Connecting to the sound input.",
  on: "Sound input connected.",
  unavailable:
    "This sound input is not available. Check that it is plugged in, then choose it again.",
};

const NOISE_SUPPRESSION_NOTES: Record<NoiseSuppressionState, string | null> = {
  off: null,
  starting: "Starting noise cancellation.",
  on: "Noise cancellation is on.",
  unavailable:
    "Noise cancellation could not start in this browser. The sound continues without it.",
};

const SoundInputSelect = ({ value }: { value: string | null }) => {
  const devices = useAudioInputDevices();
  const options = [
    { value: NO_INPUT, label: "None, use camera and shared tab sound" },
    ...devices.map((device) => ({
      value: device.deviceId,
      label: device.label,
    })),
  ];
  if (value && !devices.some((device) => device.deviceId === value))
    options.push({ value, label: "Saved input (not connected)" });

  return (
    <OptionSelect
      aria-label="Sound desk or microphone"
      value={value ?? NO_INPUT}
      options={options}
      onValueChange={(next) => setSoundInputDevice(next || null)}
    />
  );
};

const SoundInputField = () => {
  const inputDeviceId = useProgramSoundSettings((state) => state.inputDeviceId);
  const status = useProgramCaptureStore((state) => state.soundInput);
  const [isChoosing, setIsChoosing] = useState(inputDeviceId !== null);
  const note = SOUND_INPUT_NOTES[status];

  return (
    <div className="mb-1">
      <FieldLabel>Sound desk or microphone</FieldLabel>
      {isChoosing ? (
        <SoundInputSelect value={inputDeviceId} />
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsChoosing(true)}
        >
          <Mic />
          Choose a sound input
        </Button>
      )}
      <p
        aria-live="polite"
        className={cn(
          "m-0 mt-1.5 text-[12px] leading-snug",
          status === "unavailable"
            ? "text-warning-foreground"
            : "text-subtle-foreground",
        )}
      >
        {note ??
          "Connect the church sound desk with a USB audio interface for the clearest sound. It is used whenever you record or go live."}
      </p>
    </div>
  );
};

const segmentColor = (index: number): string => {
  if (index >= LEVEL_SEGMENTS - 2) return "bg-destructive";
  if (index >= LEVEL_SEGMENTS - 5) return "bg-warning";
  return "bg-success";
};

const SoundLevelMeter = ({ level }: { level: number }) => {
  const scaled = Math.min(1, Math.sqrt(level) * 1.4);
  const lit = Math.round(scaled * LEVEL_SEGMENTS);
  return (
    <div className="mt-1">
      <FieldLabel>Sound going out</FieldLabel>
      <div
        role="meter"
        aria-label="Sound level going out"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scaled * 100)}
        className="flex h-2.5 gap-0.5"
      >
        {Array.from({ length: LEVEL_SEGMENTS }, (_, index) => (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-[2px]",
              index < lit ? segmentColor(index) : "bg-secondary",
            )}
          />
        ))}
      </div>
    </div>
  );
};

export const SoundSettings = () => {
  const polish = useProgramSoundSettings((state) => state.polish);
  const noiseSuppression = useProgramSoundSettings(
    (state) => state.noiseSuppression,
  );
  const noiseState = useProgramCaptureStore((state) => state.noiseSuppression);
  const level = useProgramSoundLevel();
  const noiseNote = NOISE_SUPPRESSION_NOTES[noiseState];

  return (
    <div className="flex flex-col gap-1">
      <SoundInputField />
      <SwitchField
        label="Polish the sound: cut rumble and even out loud and quiet parts"
        checked={polish}
        onChange={setSoundPolish}
      />
      <SwitchField
        label="AI noise cancellation for speaking"
        checked={noiseSuppression}
        onChange={setNoiseSuppression}
      />
      {noiseNote && (
        <p
          aria-live="polite"
          className={cn(
            "m-0 text-[12px] leading-snug",
            noiseState === "unavailable"
              ? "text-warning-foreground"
              : "text-subtle-foreground",
          )}
        >
          {noiseNote}
        </p>
      )}
      {level !== null && <SoundLevelMeter level={level} />}
    </div>
  );
};
