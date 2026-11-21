interface DynamicsSettings {
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
}

const SOUND_POLISH = {
  rumbleCutoffHz: 80,
  leveler: {
    threshold: -24,
    knee: 12,
    ratio: 3,
    attack: 0.01,
    release: 0.25,
  },
  makeupGainDb: 4,
  limiter: {
    threshold: -1.5,
    knee: 0,
    ratio: 20,
    attack: 0.002,
    release: 0.08,
  },
} as const satisfies {
  rumbleCutoffHz: number;
  leveler: DynamicsSettings;
  makeupGainDb: number;
  limiter: DynamicsSettings;
};

export interface SoundPolishChain {
  readonly input: AudioNode;
  readonly output: AudioNode;
  disconnect(): void;
}

const decibelsToGain = (decibels: number): number => 10 ** (decibels / 20);

const createDynamics = (
  context: BaseAudioContext,
  settings: DynamicsSettings,
): DynamicsCompressorNode => new DynamicsCompressorNode(context, settings);

export const createSoundPolishChain = (
  context: BaseAudioContext,
): SoundPolishChain => {
  const rumbleFilter = new BiquadFilterNode(context, {
    type: "highpass",
    frequency: SOUND_POLISH.rumbleCutoffHz,
    Q: Math.SQRT1_2,
  });
  const leveler = createDynamics(context, SOUND_POLISH.leveler);
  const makeupGain = new GainNode(context, {
    gain: decibelsToGain(SOUND_POLISH.makeupGainDb),
  });
  const limiter = createDynamics(context, SOUND_POLISH.limiter);
  rumbleFilter.connect(leveler).connect(makeupGain).connect(limiter);

  return {
    input: rumbleFilter,
    output: limiter,
    disconnect: () => {
      for (const node of [rumbleFilter, leveler, makeupGain, limiter])
        node.disconnect();
    },
  };
};
