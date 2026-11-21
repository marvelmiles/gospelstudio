import {
  createNoiseSuppressor,
  NOISE_SUPPRESSION_SAMPLE_RATE,
  type NoiseSuppressor,
} from "./noiseSuppression";
import { createSoundPolishChain } from "./soundPolish";

export type NoiseSuppressionState = "off" | "starting" | "on" | "unavailable";

export interface ProgramSoundMixer {
  readonly context: AudioContext;
  readonly output: MediaStreamAudioDestinationNode;
  addScreenAudio(capture: MediaStream): void;
  setCameraAudio(streams: readonly MediaStream[]): void;
  setSoundInput(stream: MediaStream | null): void;
  setPolish(enabled: boolean): void;
  setNoiseSuppression(enabled: boolean): Promise<NoiseSuppressionState>;
  level(): number;
  dispose(): void;
}

const hasAudio = (stream: MediaStream): boolean =>
  stream.getAudioTracks().length > 0;

const ANALYSER_SIZE = 1024;

export const createProgramSoundMixer = (polish: boolean): ProgramSoundMixer => {
  const context = new AudioContext({
    sampleRate: NOISE_SUPPRESSION_SAMPLE_RATE,
  });
  const output = context.createMediaStreamDestination();
  output.channelCount = 2;
  const bus = new GainNode(context);
  const analyser = new AnalyserNode(context, { fftSize: ANALYSER_SIZE });
  const samples = new Float32Array(ANALYSER_SIZE);
  const polishChain = createSoundPolishChain(context);
  const cameraSources = new Map<MediaStream, MediaStreamAudioSourceNode>();
  const fixedSources: MediaStreamAudioSourceNode[] = [];
  let soundInputSource: MediaStreamAudioSourceNode | null = null;
  let isPolished = polish;
  let suppressor: NoiseSuppressor | null = null;
  let suppressionRequest = 0;
  let isDisposed = false;

  const connectSource = (stream: MediaStream): MediaStreamAudioSourceNode => {
    const node = context.createMediaStreamSource(stream);
    node.connect(bus);
    return node;
  };

  const reroute = (): void => {
    bus.disconnect();
    suppressor?.node.disconnect();
    polishChain.output.disconnect();
    let tail: AudioNode = bus;
    if (suppressor) {
      tail.connect(suppressor.node);
      tail = suppressor.node;
    }
    if (isPolished) {
      tail.connect(polishChain.input);
      tail = polishChain.output;
    }
    tail.connect(output);
    tail.connect(analyser);
  };

  const replaceSuppressor = (next: NoiseSuppressor | null): void => {
    const previous = suppressor;
    suppressor = next;
    reroute();
    previous?.destroy();
  };

  reroute();

  return {
    context,
    output,

    setPolish: (enabled) => {
      isPolished = enabled;
      reroute();
    },

    setNoiseSuppression: async (enabled) => {
      const request = ++suppressionRequest;
      if (!enabled) {
        replaceSuppressor(null);
        return "off";
      }
      if (suppressor) return "on";
      try {
        const created = await createNoiseSuppressor(context);
        if (request !== suppressionRequest || isDisposed) {
          created.destroy();
          return suppressor && !isDisposed ? "on" : "off";
        }
        replaceSuppressor(created);
        return "on";
      } catch {
        return "unavailable";
      }
    },

    level: () => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      return Math.sqrt(sum / samples.length);
    },

    addScreenAudio: (capture) => {
      if (!hasAudio(capture)) return;
      fixedSources.push(
        connectSource(new MediaStream(capture.getAudioTracks())),
      );
    },

    setCameraAudio: (streams) => {
      const wanted = new Set(streams.filter(hasAudio));
      for (const [stream, node] of cameraSources) {
        if (wanted.has(stream)) continue;
        node.disconnect();
        cameraSources.delete(stream);
      }
      for (const stream of wanted)
        if (!cameraSources.has(stream))
          cameraSources.set(stream, connectSource(stream));
    },

    setSoundInput: (stream) => {
      soundInputSource?.disconnect();
      soundInputSource =
        stream && hasAudio(stream) ? connectSource(stream) : null;
    },

    dispose: () => {
      isDisposed = true;
      suppressionRequest += 1;
      for (const node of [...fixedSources, ...cameraSources.values()])
        node.disconnect();
      soundInputSource?.disconnect();
      cameraSources.clear();
      suppressor?.destroy();
      suppressor = null;
      polishChain.disconnect();
      bus.disconnect();
      analyser.disconnect();
      void context.close().catch(() => {});
    },
  };
};
