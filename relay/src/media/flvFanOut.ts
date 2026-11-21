import {
  createFlvHeader,
  isAacSequenceHeader,
  isAvcSequenceHeader,
  isVideoKeyFrame,
  type FlvTag,
} from "../../../src/features/liveStream/lib/flv";

export interface FlvSink {
  write(bytes: Uint8Array): void;
  readonly backlogBytes: number;
}

interface SinkEntry {
  sink: FlvSink;
  started: boolean;
  dropping: boolean;
}

const MAX_BACKLOG_BYTES = 8 * 1024 * 1024;
const RESUME_BACKLOG_BYTES = 1024 * 1024;

export class FlvFanOut {
  private readonly header = createFlvHeader();
  private videoConfig: Uint8Array | null = null;
  private audioConfig: Uint8Array | null = null;
  private readonly sinks = new Map<string, SinkEntry>();

  get hasVideoConfig(): boolean {
    return this.videoConfig !== null;
  }

  reset(): void {
    this.videoConfig = null;
    this.audioConfig = null;
    for (const entry of this.sinks.values()) {
      entry.started = false;
      entry.dropping = false;
    }
  }

  attach(id: string, sink: FlvSink): void {
    this.sinks.set(id, { sink, started: false, dropping: false });
  }

  detach(id: string): void {
    this.sinks.delete(id);
  }

  push(tag: FlvTag): void {
    if (isAvcSequenceHeader(tag)) this.videoConfig = tag.bytes;
    else if (isAacSequenceHeader(tag)) this.audioConfig = tag.bytes;
    for (const entry of this.sinks.values()) this.deliver(entry, tag);
  }

  private deliver(entry: SinkEntry, tag: FlvTag): void {
    if (!entry.started) {
      this.startSink(entry, tag);
      return;
    }
    const keyFrame = isVideoKeyFrame(tag);
    if (entry.dropping) {
      if (!keyFrame || entry.sink.backlogBytes > RESUME_BACKLOG_BYTES) return;
      entry.dropping = false;
    } else if (entry.sink.backlogBytes > MAX_BACKLOG_BYTES) {
      entry.dropping = true;
      return;
    }
    entry.sink.write(tag.bytes);
  }

  private startSink(entry: SinkEntry, tag: FlvTag): void {
    if (!isVideoKeyFrame(tag) || !this.videoConfig) return;
    entry.sink.write(this.header);
    entry.sink.write(this.videoConfig);
    if (this.audioConfig) entry.sink.write(this.audioConfig);
    entry.sink.write(tag.bytes);
    entry.started = true;
  }
}
