import { z } from "zod";
import { create } from "zustand";
import {
  readDeviceSetting,
  writeDeviceSetting,
} from "../../../lib/deviceSettings";

const SETTING_NAME = "program-sound";

const programSoundSettingsSchema = z.object({
  inputDeviceId: z.string().min(1).max(512).nullable().catch(null),
  polish: z.boolean().catch(true),
  noiseSuppression: z.boolean().catch(true),
});

type ProgramSoundSettings = z.output<typeof programSoundSettingsSchema>;

const DEFAULT_SETTINGS: ProgramSoundSettings = {
  inputDeviceId: null,
  polish: true,
  noiseSuppression: true,
};

export const useProgramSoundSettings = create<ProgramSoundSettings>()(() =>
  readDeviceSetting(SETTING_NAME, programSoundSettingsSchema, DEFAULT_SETTINGS),
);

const updateSettings = (patch: Partial<ProgramSoundSettings>): void => {
  useProgramSoundSettings.setState(patch);
  writeDeviceSetting(SETTING_NAME, useProgramSoundSettings.getState());
};

export const setSoundInputDevice = (inputDeviceId: string | null): void =>
  updateSettings({ inputDeviceId });

export const setSoundPolish = (polish: boolean): void =>
  updateSettings({ polish });

export const setNoiseSuppression = (noiseSuppression: boolean): void =>
  updateSettings({ noiseSuppression });
