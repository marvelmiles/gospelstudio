import { AdaptiveBitrate } from "./adaptiveBitrate";
import {
  aacAudioData,
  aacSequenceHeaderData,
  avcSequenceHeaderData,
  avcVideoData,
  createFlvHeader,
  encodeFlvTag,
  FLV_TAG_AUDIO,
  FLV_TAG_VIDEO,
} from "./flv";
import { IngestConnection } from "./ingestConnection";
import {
  audioEncoderConfigFor,
  videoEncoderConfigFor,
} from "./liveEncoderConfig";
import type {
  EncoderEvent,
  EncoderFailure,
  EncoderStartCommand,
} from "./liveEncoderProtocol";
import {
  LIVE_AUDIO_BITRATE_KBPS,
  LIVE_KEYFRAME_INTERVAL_MS,
  type LiveQualityProfile,
} from "./liveQuality";

const STATS_INTERVAL_MS = 1000;
const MAX_ENCODE_QUEUE = 5;
const MIN_FRAME_SPACING = 0.6;
const BITRATE_CHANGE_RATIO = 0.1;
const MIN_RECONFIGURE_INTERVAL_MS = 3000;
const ENCODER_FAILED_MESSAGE =
  "This computer could not encode the stream. Close other heavy apps, or choose a lower picture quality.";

const copyBytes = (source: AllowSharedBufferSource): Uint8Array =>
  ArrayBuffer.isView(source)
    ? new Uint8Array(
        source.buffer,
        source.byteOffset,
        source.byteLength,
      ).slice()
    : new Uint8Array(source).slice();

const sameBytes = (first: Uint8Array | null, second: Uint8Array): boolean =>
  first !== null &&
  first.byteLength === second.byteLength &&
  first.every((byte, index) => byte === second[index]);

export class LiveEncoderPipeline {
  private readonly emit: (event: EncoderEvent) => void;
  private readonly quality: LiveQualityProfile;
  private readonly startedAt = performance.now();
  private readonly bitrate: AdaptiveBitrate;
  private readonly connection: IngestConnection;
  private readonly videoEncoder: VideoEncoder;
  private readonly timers: ReturnType<typeof setInterval>[] = [];
  private readonly readers: ReadableStreamDefaultReader<
    VideoFrame | AudioData
  >[] = [];
  private videoConfig: VideoEncoderConfig;
  private audioEncoder: AudioEncoder | null = null;
  private latestFrame: VideoFrame | null = null;
  private videoDescription: Uint8Array | null = null;
  private audioDescription: Uint8Array | null = null;
  private videoConfigTag: Uint8Array | null = null;
  private audioConfigTag: Uint8Array | null = null;
  private lastKeyFrameMs = Number.NEGATIVE_INFINITY;
  private lastFrameMs = Number.NEGATIVE_INFINITY;
  private needsKeyFrame = true;
  private dropVideo = false;
  private audioOffsetUs: number | null = null;
  private sentBytes = 0;
  private droppedFrames = 0;
  private lastReconfigureMs = 0;
  private isStopped = false;

  constructor(
    command: EncoderStartCommand,
    emit: (event: EncoderEvent) => void,
  ) {
    this.emit = emit;
    this.quality = command.quality;
    this.bitrate = new AdaptiveBitrate({
      minKbps: command.quality.minVideoBitrateKbps,
      maxKbps: command.quality.maxVideoBitrateKbps,
      audioKbps: LIVE_AUDIO_BITRATE_KBPS,
    });
    this.videoConfig = videoEncoderConfigFor(
      command.quality,
      command.videoCodec,
    );
    this.videoEncoder = new VideoEncoder({
      output: (chunk, metadata) => this.sendVideo(chunk, metadata),
      error: () => this.stopWith("encoder_failed", ENCODER_FAILED_MESSAGE),
    });
    this.videoEncoder.configure(this.videoConfig);
    this.connection = new IngestConnection(command.ingestUrl, command.token, {
      onReady: () => this.handleConnected(),
      onSession: (session) => this.emit({ type: "session", session }),
      onReconnecting: (attempt) => this.emit({ type: "reconnecting", attempt }),
      onFailed: (reason, message) => this.stopWith(reason, message),
    });
    void this.readVideo(command.video);
    void this.readAudio(command.audio);
    this.timers.push(
      setInterval(() => this.encodeFrame(), 1000 / command.quality.frameRate),
      setInterval(() => this.reportStats(), STATS_INTERVAL_MS),
    );
  }

  stop(): void {
    if (this.isStopped) return;
    this.isStopped = true;
    for (const timer of this.timers) clearInterval(timer);
    for (const reader of this.readers) void reader.cancel().catch(() => {});
    this.latestFrame?.close();
    this.latestFrame = null;
    for (const encoder of [this.videoEncoder, this.audioEncoder])
      if (encoder && encoder.state !== "closed") encoder.close();
    this.connection.close();
  }

  private elapsedMs(): number {
    return performance.now() - this.startedAt;
  }

  private stopWith(reason: EncoderFailure, message: string): void {
    if (this.isStopped) return;
    this.stop();
    this.emit({ type: "failed", reason, message });
  }

  private send(bytes: Uint8Array): void {
    if (this.connection.send(bytes)) this.sentBytes += bytes.byteLength;
  }

  private handleConnected(): void {
    this.send(createFlvHeader());
    if (this.videoConfigTag) this.send(this.videoConfigTag);
    if (this.audioConfigTag) this.send(this.audioConfigTag);
    this.needsKeyFrame = true;
    this.emit({ type: "connected" });
  }

  private async readVideo(stream: ReadableStream<VideoFrame>): Promise<void> {
    const reader = stream.getReader();
    this.readers.push(reader);
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        if (this.isStopped) {
          value.close();
          return;
        }
        this.latestFrame?.close();
        this.latestFrame = value;
      }
    } catch {
      return;
    }
  }

  private async readAudio(stream: ReadableStream<AudioData>): Promise<void> {
    const reader = stream.getReader();
    this.readers.push(reader);
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        this.encodeAudio(value);
      }
    } catch {
      return;
    }
  }

  private encodeFrame(): void {
    const source = this.latestFrame;
    if (!source || this.isStopped || !this.connection.isOpen) return;
    if (
      this.dropVideo ||
      this.videoEncoder.encodeQueueSize > MAX_ENCODE_QUEUE
    ) {
      this.droppedFrames += 1;
      return;
    }
    const timestampMs = this.elapsedMs();
    const frameIntervalMs = 1000 / this.quality.frameRate;
    if (timestampMs - this.lastFrameMs < frameIntervalMs * MIN_FRAME_SPACING)
      return;
    this.lastFrameMs = timestampMs;
    const keyFrame =
      this.needsKeyFrame ||
      timestampMs - this.lastKeyFrameMs >= LIVE_KEYFRAME_INTERVAL_MS;
    const frame = new VideoFrame(source, {
      timestamp: Math.round(timestampMs * 1000),
      duration: Math.round(1_000_000 / this.quality.frameRate),
    });
    try {
      this.videoEncoder.encode(frame, { keyFrame });
    } finally {
      frame.close();
    }
    if (!keyFrame) return;
    this.lastKeyFrameMs = timestampMs;
    this.needsKeyFrame = false;
  }

  private encodeAudio(data: AudioData): void {
    try {
      if (this.isStopped || !this.connection.isOpen) return;
      if (!this.audioEncoder) {
        this.audioEncoder = new AudioEncoder({
          output: (chunk, metadata) => this.sendAudio(chunk, metadata),
          error: () => this.stopWith("encoder_failed", ENCODER_FAILED_MESSAGE),
        });
        this.audioEncoder.configure(
          audioEncoderConfigFor(data.sampleRate, data.numberOfChannels),
        );
      }
      this.audioOffsetUs ??= this.elapsedMs() * 1000 - data.timestamp;
      this.audioEncoder.encode(data);
    } finally {
      data.close();
    }
  }

  private sendVideo(
    chunk: EncodedVideoChunk,
    metadata?: EncodedVideoChunkMetadata,
  ): void {
    const timestampMs = chunk.timestamp / 1000;
    const description = metadata?.decoderConfig?.description;
    if (description) {
      const bytes = copyBytes(description);
      if (!sameBytes(this.videoDescription, bytes)) {
        this.videoDescription = bytes;
        this.videoConfigTag = encodeFlvTag(
          FLV_TAG_VIDEO,
          timestampMs,
          avcSequenceHeaderData(bytes),
        );
        this.send(this.videoConfigTag);
      }
    }
    if (!this.videoConfigTag) return;
    const frame = new Uint8Array(chunk.byteLength);
    chunk.copyTo(frame);
    this.send(
      encodeFlvTag(
        FLV_TAG_VIDEO,
        timestampMs,
        avcVideoData(frame, chunk.type === "key"),
      ),
    );
  }

  private sendAudio(
    chunk: EncodedAudioChunk,
    metadata?: EncodedAudioChunkMetadata,
  ): void {
    const timestampMs = (chunk.timestamp + (this.audioOffsetUs ?? 0)) / 1000;
    const description = metadata?.decoderConfig?.description;
    if (description) {
      const bytes = copyBytes(description);
      if (!sameBytes(this.audioDescription, bytes)) {
        this.audioDescription = bytes;
        this.audioConfigTag = encodeFlvTag(
          FLV_TAG_AUDIO,
          Math.max(0, timestampMs),
          aacSequenceHeaderData(bytes),
        );
        this.send(this.audioConfigTag);
      }
    }
    if (!this.audioConfigTag) return;
    const frame = new Uint8Array(chunk.byteLength);
    chunk.copyTo(frame);
    this.send(
      encodeFlvTag(
        FLV_TAG_AUDIO,
        Math.max(0, timestampMs),
        aacAudioData(frame),
      ),
    );
  }

  private reportStats(): void {
    const sentKbps = Math.round((this.sentBytes * 8) / STATS_INTERVAL_MS);
    this.sentBytes = 0;
    if (!this.connection.isOpen) return;
    const decision = this.bitrate.update(this.connection.bufferedBytes);
    this.dropVideo = decision.dropVideo;
    this.applyBitrate(decision.targetKbps);
    this.emit({
      type: "stats",
      stats: {
        sentKbps,
        targetKbps: decision.targetKbps,
        bufferedMs: decision.bufferedMs,
        droppedFrames: this.droppedFrames,
        health: decision.health,
      },
    });
  }

  private applyBitrate(targetKbps: number): void {
    const currentKbps = (this.videoConfig.bitrate ?? 0) / 1000;
    if (Math.abs(targetKbps - currentKbps) / currentKbps < BITRATE_CHANGE_RATIO)
      return;
    const now = this.elapsedMs();
    if (now - this.lastReconfigureMs < MIN_RECONFIGURE_INTERVAL_MS) return;
    this.lastReconfigureMs = now;
    this.videoConfig = { ...this.videoConfig, bitrate: targetKbps * 1000 };
    this.videoEncoder.configure(this.videoConfig);
    this.needsKeyFrame = true;
  }
}
