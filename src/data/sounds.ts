import type { AudioItem } from "../types";

const SOUND_ASSETS_PATH = "/assets/sounds";
const BUILT_IN_SOUNDS_DATE = "2026-11-04T00:00:00.000Z";

interface BuiltInSound {
  file: string;
  name: string;
  duration: number;
}

const SOUND_ASSETS: BuiltInSound[] = [
  { file: "aylex-worlds", name: "Aylex - Worlds", duration: 140.73 },
  { file: "nebulite-japan", name: "Nebulite - Japan", duration: 198.88 },
  { file: "pufino-enlivening", name: "Pufino - Enlivening", duration: 152.82 },
  { file: "pufino-harmony", name: "Pufino - Harmony", duration: 210 },
  { file: "sunova-heroes", name: "Sunova - Heroes", duration: 162.6 },
];

const builtInSound = ({ file, name, duration }: BuiltInSound): AudioItem => ({
  id: `snd-${file}`,
  name,
  src: `${SOUND_ASSETS_PATH}/${file}.m4a`,
  duration,
  builtIn: true,
  createdAt: BUILT_IN_SOUNDS_DATE,
  updatedAt: BUILT_IN_SOUNDS_DATE,
});

export const DEFAULT_AUDIO: AudioItem[] = SOUND_ASSETS.map(builtInSound);
