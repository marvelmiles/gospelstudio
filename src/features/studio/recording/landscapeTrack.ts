export const RECORDING_WIDTH = 1920;
export const RECORDING_HEIGHT = 1080;

interface VideoTrackProcessor {
  readonly readable: ReadableStream<VideoFrame>;
}

interface VideoTrackGenerator extends MediaStreamTrack {
  readonly writable: WritableStream<VideoFrame>;
}

interface InsertableStreamsScope {
  MediaStreamTrackProcessor?: new (init: {
    track: MediaStreamTrack;
  }) => VideoTrackProcessor;
  MediaStreamTrackGenerator?: new (init: {
    kind: "video";
  }) => VideoTrackGenerator;
}

export interface FrameBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const isRecordingSize = (frame: VideoFrame): boolean =>
  frame.displayWidth === RECORDING_WIDTH &&
  frame.displayHeight === RECORDING_HEIGHT;

export const letterboxInRecording = (
  sourceWidth: number,
  sourceHeight: number,
): FrameBox => {
  const scale = Math.min(
    RECORDING_WIDTH / sourceWidth,
    RECORDING_HEIGHT / sourceHeight,
  );
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  return {
    x: Math.round((RECORDING_WIDTH - width) / 2),
    y: Math.round((RECORDING_HEIGHT - height) / 2),
    width,
    height,
  };
};

export const toLandscapeTrack = (
  source: MediaStreamTrack,
): MediaStreamTrack => {
  const { MediaStreamTrackProcessor, MediaStreamTrackGenerator } =
    globalThis as typeof globalThis & InsertableStreamsScope;
  if (
    !MediaStreamTrackProcessor ||
    !MediaStreamTrackGenerator ||
    typeof OffscreenCanvas === "undefined"
  )
    return source;

  const canvas = new OffscreenCanvas(RECORDING_WIDTH, RECORDING_HEIGHT);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return source;

  const processor = new MediaStreamTrackProcessor({ track: source });
  const generator = new MediaStreamTrackGenerator({ kind: "video" });
  const framing = new TransformStream<VideoFrame, VideoFrame>({
    transform: (frame, controller) => {
      if (isRecordingSize(frame)) {
        controller.enqueue(frame);
        return;
      }
      const box = letterboxInRecording(frame.displayWidth, frame.displayHeight);
      context.fillStyle = "#000000";
      context.fillRect(0, 0, RECORDING_WIDTH, RECORDING_HEIGHT);
      context.drawImage(frame, box.x, box.y, box.width, box.height);
      const framed = new VideoFrame(canvas, {
        timestamp: frame.timestamp,
        duration: frame.duration ?? undefined,
      });
      frame.close();
      controller.enqueue(framed);
    },
  });

  void processor.readable
    .pipeThrough(framing)
    .pipeTo(generator.writable)
    .catch(() => {});
  return generator;
};
