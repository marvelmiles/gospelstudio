import {
  createVideoTrackGenerator,
  videoFramesOf,
} from "../../../lib/insertableStreams";

export interface FrameSize {
  width: number;
  height: number;
}

export const FULL_HD_FRAME: FrameSize = { width: 1920, height: 1080 };

export interface FrameBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const fillsFrame = (videoFrame: VideoFrame, frame: FrameSize): boolean =>
  videoFrame.displayWidth === frame.width &&
  videoFrame.displayHeight === frame.height;

export const letterboxInFrame = (
  sourceWidth: number,
  sourceHeight: number,
  frame: FrameSize = FULL_HD_FRAME,
): FrameBox => {
  const scale = Math.min(
    frame.width / sourceWidth,
    frame.height / sourceHeight,
  );
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);
  return {
    x: Math.round((frame.width - width) / 2),
    y: Math.round((frame.height - height) / 2),
    width,
    height,
  };
};

export const toLandscapeTrack = (
  source: MediaStreamTrack,
  frame: FrameSize = FULL_HD_FRAME,
): MediaStreamTrack => {
  if (typeof OffscreenCanvas === "undefined") return source;
  const canvas = new OffscreenCanvas(frame.width, frame.height);
  const context = canvas.getContext("2d", { alpha: false });
  const generator = context ? createVideoTrackGenerator() : null;
  const frames = generator ? videoFramesOf(source) : null;
  if (!context || !generator || !frames) return source;

  const framing = new TransformStream<VideoFrame, VideoFrame>({
    transform: (videoFrame, controller) => {
      if (fillsFrame(videoFrame, frame)) {
        controller.enqueue(videoFrame);
        return;
      }
      const box = letterboxInFrame(
        videoFrame.displayWidth,
        videoFrame.displayHeight,
        frame,
      );
      context.fillStyle = "#000000";
      context.fillRect(0, 0, frame.width, frame.height);
      context.drawImage(videoFrame, box.x, box.y, box.width, box.height);
      const framed = new VideoFrame(canvas, {
        timestamp: videoFrame.timestamp,
        duration: videoFrame.duration ?? undefined,
      });
      videoFrame.close();
      controller.enqueue(framed);
    },
  });

  void frames
    .pipeThrough(framing)
    .pipeTo(generator.writable)
    .catch(() => {});
  return generator;
};
