export const FLV_TAG_AUDIO = 8;
export const FLV_TAG_VIDEO = 9;

const FLV_TAG_SCRIPT = 18;
const FLV_SIGNATURE = [0x46, 0x4c, 0x56];
const FLV_VERSION = 1;
const FLV_HAS_AUDIO_AND_VIDEO = 0x05;
const FLV_HEADER_SIZE = 9;
const TAG_HEADER_SIZE = 11;
const PREVIOUS_TAG_SIZE_BYTES = 4;
const MAX_TAG_DATA_SIZE = 8 * 1024 * 1024;

const AVC_CODEC_ID = 7;
const FRAME_TYPE_KEY = 1;
const FRAME_TYPE_INTER = 2;
const AVC_SEQUENCE_HEADER = 0;
const AVC_NALU = 1;

const AAC_SOUND_FORMAT = 10;
const AAC_AUDIO_HEADER = 0xaf;
const AAC_SEQUENCE_HEADER = 0;
const AAC_RAW = 1;

const KNOWN_TAG_TYPES = new Set([FLV_TAG_AUDIO, FLV_TAG_VIDEO, FLV_TAG_SCRIPT]);

export interface FlvTag {
  type: number;
  timestampMs: number;
  data: Uint8Array;
  bytes: Uint8Array;
}

export class FlvFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlvFormatError";
  }
}

const writeUint24 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = (value >>> 16) & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = value & 0xff;
};

const writeUint32 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = (value >>> 24) & 0xff;
  writeUint24(target, offset + 1, value & 0xffffff);
};

const readUint24 = (source: Uint8Array, offset: number): number =>
  (source[offset] << 16) | (source[offset + 1] << 8) | source[offset + 2];

const withPrefix = (prefix: number[], payload: Uint8Array): Uint8Array => {
  const data = new Uint8Array(prefix.length + payload.byteLength);
  data.set(prefix, 0);
  data.set(payload, prefix.length);
  return data;
};

export const createFlvHeader = (): Uint8Array => {
  const header = new Uint8Array(FLV_HEADER_SIZE + PREVIOUS_TAG_SIZE_BYTES);
  header.set(FLV_SIGNATURE, 0);
  header[3] = FLV_VERSION;
  header[4] = FLV_HAS_AUDIO_AND_VIDEO;
  writeUint32(header, 5, FLV_HEADER_SIZE);
  return header;
};

export const encodeFlvTag = (
  type: number,
  timestampMs: number,
  data: Uint8Array,
): Uint8Array => {
  const timestamp = Math.max(0, Math.round(timestampMs)) >>> 0;
  const tag = new Uint8Array(
    TAG_HEADER_SIZE + data.byteLength + PREVIOUS_TAG_SIZE_BYTES,
  );
  tag[0] = type;
  writeUint24(tag, 1, data.byteLength);
  writeUint24(tag, 4, timestamp & 0xffffff);
  tag[7] = (timestamp >>> 24) & 0xff;
  tag.set(data, TAG_HEADER_SIZE);
  writeUint32(
    tag,
    TAG_HEADER_SIZE + data.byteLength,
    TAG_HEADER_SIZE + data.byteLength,
  );
  return tag;
};

const videoHeader = (frameType: number): number =>
  (frameType << 4) | AVC_CODEC_ID;

export const avcSequenceHeaderData = (decoderConfig: Uint8Array): Uint8Array =>
  withPrefix(
    [videoHeader(FRAME_TYPE_KEY), AVC_SEQUENCE_HEADER, 0, 0, 0],
    decoderConfig,
  );

export const avcVideoData = (
  avccFrame: Uint8Array,
  isKeyFrame: boolean,
): Uint8Array =>
  withPrefix(
    [
      videoHeader(isKeyFrame ? FRAME_TYPE_KEY : FRAME_TYPE_INTER),
      AVC_NALU,
      0,
      0,
      0,
    ],
    avccFrame,
  );

export const aacSequenceHeaderData = (
  audioSpecificConfig: Uint8Array,
): Uint8Array =>
  withPrefix([AAC_AUDIO_HEADER, AAC_SEQUENCE_HEADER], audioSpecificConfig);

export const aacAudioData = (rawFrame: Uint8Array): Uint8Array =>
  withPrefix([AAC_AUDIO_HEADER, AAC_RAW], rawFrame);

export const isAvcSequenceHeader = (tag: FlvTag): boolean =>
  tag.type === FLV_TAG_VIDEO &&
  (tag.data[0] & 0x0f) === AVC_CODEC_ID &&
  tag.data[1] === AVC_SEQUENCE_HEADER;

export const isAacSequenceHeader = (tag: FlvTag): boolean =>
  tag.type === FLV_TAG_AUDIO &&
  tag.data[0] >> 4 === AAC_SOUND_FORMAT &&
  tag.data[1] === AAC_SEQUENCE_HEADER;

export const isVideoKeyFrame = (tag: FlvTag): boolean =>
  tag.type === FLV_TAG_VIDEO &&
  tag.data[0] >> 4 === FRAME_TYPE_KEY &&
  tag.data[1] === AVC_NALU;

const concat = (first: Uint8Array, second: Uint8Array): Uint8Array => {
  if (first.byteLength === 0) return second;
  const joined = new Uint8Array(first.byteLength + second.byteLength);
  joined.set(first, 0);
  joined.set(second, first.byteLength);
  return joined;
};

export class FlvStreamReader {
  private pending: Uint8Array = new Uint8Array(0);
  private hasHeader = false;

  push(chunk: Uint8Array): FlvTag[] {
    this.pending = concat(this.pending, chunk);
    if (!this.hasHeader && !this.readHeader()) return [];
    const tags: FlvTag[] = [];
    let offset = 0;
    while (this.pending.byteLength - offset >= TAG_HEADER_SIZE) {
      const type = this.pending[offset];
      const dataSize = readUint24(this.pending, offset + 1);
      if (!KNOWN_TAG_TYPES.has(type))
        throw new FlvFormatError(`Unknown FLV tag type ${type}`);
      if (dataSize > MAX_TAG_DATA_SIZE)
        throw new FlvFormatError("FLV tag is too large");
      const total = TAG_HEADER_SIZE + dataSize + PREVIOUS_TAG_SIZE_BYTES;
      if (this.pending.byteLength - offset < total) break;
      const bytes = this.pending.slice(offset, offset + total);
      const timestampMs = (readUint24(bytes, 4) | (bytes[7] << 24)) >>> 0;
      tags.push({
        type,
        timestampMs,
        data: bytes.subarray(TAG_HEADER_SIZE, TAG_HEADER_SIZE + dataSize),
        bytes,
      });
      offset += total;
    }
    this.pending = this.pending.slice(offset);
    return tags;
  }

  private readHeader(): boolean {
    const needed = FLV_HEADER_SIZE + PREVIOUS_TAG_SIZE_BYTES;
    if (this.pending.byteLength < needed) return false;
    if (FLV_SIGNATURE.some((byte, index) => this.pending[index] !== byte))
      throw new FlvFormatError("The stream is not FLV");
    this.pending = this.pending.slice(needed);
    this.hasHeader = true;
    return true;
  }
}
