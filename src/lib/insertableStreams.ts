interface TrackProcessor<T> {
  readonly readable: ReadableStream<T>;
}

export interface VideoTrackGenerator extends MediaStreamTrack {
  readonly writable: WritableStream<VideoFrame>;
}

interface InsertableStreamsScope {
  MediaStreamTrackProcessor?: new (init: {
    track: MediaStreamTrack;
  }) => TrackProcessor<VideoFrame | AudioData>;
  MediaStreamTrackGenerator?: new (init: {
    kind: "video";
  }) => VideoTrackGenerator;
}

const scope = (): InsertableStreamsScope =>
  globalThis as typeof globalThis & InsertableStreamsScope;

export const hasTrackProcessor = (): boolean =>
  typeof scope().MediaStreamTrackProcessor === "function";

export const videoFramesOf = (
  track: MediaStreamTrack,
): ReadableStream<VideoFrame> | null => {
  const Processor = scope().MediaStreamTrackProcessor;
  return Processor
    ? (new Processor({ track }).readable as ReadableStream<VideoFrame>)
    : null;
};

export const audioDataOf = (
  track: MediaStreamTrack,
): ReadableStream<AudioData> | null => {
  const Processor = scope().MediaStreamTrackProcessor;
  return Processor
    ? (new Processor({ track }).readable as ReadableStream<AudioData>)
    : null;
};

export const createVideoTrackGenerator = (): VideoTrackGenerator | null => {
  const Generator = scope().MediaStreamTrackGenerator;
  return Generator ? new Generator({ kind: "video" }) : null;
};
