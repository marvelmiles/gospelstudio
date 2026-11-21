import rnnoiseWorkletUrl from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseSimdWasmUrl from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";

export const NOISE_SUPPRESSION_SAMPLE_RATE = 48_000;

const CHANNELS = 2;

export interface NoiseSuppressor {
  readonly node: AudioNode;
  destroy(): void;
}

let wasmBinary: Promise<ArrayBuffer> | null = null;
const loadedContexts = new WeakMap<BaseAudioContext, Promise<void>>();

const loadWasm = async (): Promise<ArrayBuffer> => {
  const { loadRnnoise } = await import("@sapphi-red/web-noise-suppressor");
  wasmBinary ??= loadRnnoise({
    url: rnnoiseWasmUrl,
    simdUrl: rnnoiseSimdWasmUrl,
  }).catch((error: unknown) => {
    wasmBinary = null;
    throw error;
  });
  return wasmBinary;
};

const loadWorklet = (context: AudioContext): Promise<void> => {
  let loading = loadedContexts.get(context);
  if (!loading) {
    loading = context.audioWorklet.addModule(rnnoiseWorkletUrl);
    loadedContexts.set(context, loading);
  }
  return loading;
};

export const createNoiseSuppressor = async (
  context: AudioContext,
): Promise<NoiseSuppressor> => {
  const [binary, { RnnoiseWorkletNode }] = await Promise.all([
    loadWasm(),
    import("@sapphi-red/web-noise-suppressor"),
    loadWorklet(context),
  ]);
  const node = new RnnoiseWorkletNode(context, {
    wasmBinary: binary,
    maxChannels: CHANNELS,
  });
  return {
    node,
    destroy: () => {
      node.disconnect();
      node.destroy();
    },
  };
};
