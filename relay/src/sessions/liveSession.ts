import {
  FlvStreamReader,
  isAvcSequenceHeader,
} from "../../../src/features/liveStream/lib/flv";
import type {
  DestinationInput,
  IngestState,
  SessionSnapshot,
} from "../../../src/features/liveStream/lib/liveRelayContract";
import { DestinationRelay } from "../media/destinationRelay";
import { FlvFanOut } from "../media/flvFanOut";
import type { StartMediaProcess } from "../media/mediaProcess";
import { tokenMatches } from "./sessionTokens";

const BITRATE_WINDOW_MS = 5000;

export interface LiveSessionOptions {
  sessionId: string;
  tokenDigest: Buffer;
  startProcess: StartMediaProcess;
  startTimeoutMs: number;
  reconnectGraceMs: number;
  onEnded: (session: LiveSession) => void;
  now?: () => number;
}

export interface IngestHandle {
  push(chunk: Uint8Array): void;
  close(): void;
}

type SnapshotListener = (snapshot: SessionSnapshot) => void;

interface ByteSample {
  at: number;
  bytes: number;
}

export class LiveSession {
  readonly id: string;
  private readonly options: LiveSessionOptions;
  private readonly now: () => number;
  private readonly fanOut = new FlvFanOut();
  private readonly destinations = new Map<string, DestinationRelay>();
  private readonly listeners = new Set<SnapshotListener>();
  private ingest: IngestState = "waiting";
  private ingestOwner: symbol | null = null;
  private replaceIngest: (() => void) | null = null;
  private reader: FlvStreamReader | null = null;
  private isMediaFlowing = false;
  private samples: ByteSample[] = [];
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: LiveSessionOptions) {
    this.options = options;
    this.id = options.sessionId;
    this.now = options.now ?? Date.now;
    this.expireAfter(options.startTimeoutMs);
  }

  get hasEnded(): boolean {
    return this.ingest === "ended";
  }

  verifyToken(token: string): boolean {
    return tokenMatches(token, this.options.tokenDigest);
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  openIngest(onReplaced: () => void): IngestHandle {
    this.replaceIngest?.();
    const owner = Symbol("ingest");
    this.ingestOwner = owner;
    this.replaceIngest = onReplaced;
    this.reader = new FlvStreamReader();
    this.isMediaFlowing = false;
    this.samples = [];
    this.fanOut.reset();
    this.clearExpiry();
    this.ingest = "receiving";
    this.notify();
    return {
      push: (chunk) => this.receive(owner, chunk),
      close: () => this.closeIngest(owner),
    };
  }

  setDestinations(inputs: readonly DestinationInput[]): SessionSnapshot {
    const wanted = new Map(inputs.map((input) => [input.id, input.url]));
    for (const [id, relay] of this.destinations) {
      if (wanted.get(id) === relay.url) continue;
      relay.stop();
      this.destinations.delete(id);
    }
    for (const [id, url] of wanted) {
      const existing = this.destinations.get(id);
      if (existing) {
        if (existing.currentState === "failed" && this.isMediaFlowing)
          existing.retryNow();
        continue;
      }
      const relay = this.createRelay(id, url);
      this.destinations.set(id, relay);
      if (this.isMediaFlowing) relay.start();
    }
    this.notify();
    return this.snapshot();
  }

  snapshot(): SessionSnapshot {
    return {
      sessionId: this.id,
      ingest: this.ingest,
      receivedKbps: this.receivedKbps(),
      destinations: [...this.destinations.values()].map((relay) =>
        relay.snapshot(),
      ),
    };
  }

  receivedKbps(): number {
    const since = this.now() - BITRATE_WINDOW_MS;
    this.samples = this.samples.filter((sample) => sample.at >= since);
    const bytes = this.samples.reduce(
      (total, sample) => total + sample.bytes,
      0,
    );
    return Math.round((bytes * 8) / BITRATE_WINDOW_MS);
  }

  end(): void {
    if (this.hasEnded) return;
    this.clearExpiry();
    this.ingest = "ended";
    this.ingestOwner = null;
    this.replaceIngest = null;
    for (const relay of this.destinations.values()) relay.stop();
    this.notify();
    this.listeners.clear();
    this.options.onEnded(this);
  }

  private receive(owner: symbol, chunk: Uint8Array): void {
    if (owner !== this.ingestOwner || !this.reader) return;
    this.samples.push({ at: this.now(), bytes: chunk.byteLength });
    for (const tag of this.reader.push(chunk)) {
      this.fanOut.push(tag);
      if (!this.isMediaFlowing && isAvcSequenceHeader(tag)) this.startRelays();
    }
  }

  private startRelays(): void {
    this.isMediaFlowing = true;
    for (const relay of this.destinations.values()) relay.start();
  }

  private closeIngest(owner: symbol): void {
    if (owner !== this.ingestOwner || this.hasEnded) return;
    this.ingestOwner = null;
    this.replaceIngest = null;
    this.reader = null;
    this.ingest = "interrupted";
    this.expireAfter(this.options.reconnectGraceMs);
    this.notify();
  }

  private createRelay(id: string, url: string): DestinationRelay {
    return new DestinationRelay({
      id,
      url,
      startProcess: this.options.startProcess,
      attachSink: (sinkId, sink) => this.fanOut.attach(sinkId, sink),
      detachSink: (sinkId) => this.fanOut.detach(sinkId),
      onChange: () => this.notify(),
      now: this.now,
    });
  }

  private expireAfter(delayMs: number): void {
    this.clearExpiry();
    this.expiryTimer = setTimeout(() => this.end(), delayMs);
    this.expiryTimer.unref?.();
  }

  private clearExpiry(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
  }

  private notify(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
