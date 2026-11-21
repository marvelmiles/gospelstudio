import { describe, expect, it } from "vitest";
import {
  aacAudioData,
  aacSequenceHeaderData,
  avcSequenceHeaderData,
  avcVideoData,
  encodeFlvTag,
  FLV_TAG_AUDIO,
  FLV_TAG_VIDEO,
  type FlvTag,
} from "../../../src/features/liveStream/lib/flv";
import { FlvFanOut, type FlvSink } from "./flvFanOut";

const tagOf = (type: number, timestampMs: number, data: Uint8Array): FlvTag => {
  const bytes = encodeFlvTag(type, timestampMs, data);
  return {
    type,
    timestampMs,
    data: bytes.subarray(11, 11 + data.byteLength),
    bytes,
  };
};

const videoConfig = tagOf(
  FLV_TAG_VIDEO,
  0,
  avcSequenceHeaderData(new Uint8Array([1])),
);
const audioConfig = tagOf(
  FLV_TAG_AUDIO,
  0,
  aacSequenceHeaderData(new Uint8Array([2])),
);
const keyFrame = (at: number) =>
  tagOf(FLV_TAG_VIDEO, at, avcVideoData(new Uint8Array([3]), true));
const interFrame = (at: number) =>
  tagOf(FLV_TAG_VIDEO, at, avcVideoData(new Uint8Array([4]), false));
const audioFrame = (at: number) =>
  tagOf(FLV_TAG_AUDIO, at, aacAudioData(new Uint8Array([5])));

const recordingSink = (backlog = { bytes: 0 }) => {
  const writes: Uint8Array[] = [];
  const sink: FlvSink = {
    write: (bytes) => writes.push(bytes),
    get backlogBytes() {
      return backlog.bytes;
    },
  };
  return { sink, writes, backlog };
};

describe("FLV fan-out", () => {
  it("starts a new platform on a key frame with the header and both configs first", () => {
    const fanOut = new FlvFanOut();
    fanOut.push(videoConfig);
    fanOut.push(audioConfig);
    const platform = recordingSink();
    fanOut.attach("youtube", platform.sink);

    fanOut.push(interFrame(10));
    fanOut.push(audioFrame(12));
    expect(platform.writes).toHaveLength(0);

    fanOut.push(keyFrame(2000));
    fanOut.push(audioFrame(2010));
    expect(platform.writes.map((write) => write.byteLength)).toEqual([
      13,
      videoConfig.bytes.byteLength,
      audioConfig.bytes.byteLength,
      keyFrame(0).bytes.byteLength,
      audioFrame(0).bytes.byteLength,
    ]);
    expect(platform.writes[0][0]).toBe(0x46);
  });

  it("waits for a video config before starting anyone", () => {
    const fanOut = new FlvFanOut();
    const platform = recordingSink();
    fanOut.attach("facebook", platform.sink);
    fanOut.push(keyFrame(0));
    expect(platform.writes).toHaveLength(0);
    expect(fanOut.hasVideoConfig).toBe(false);
  });

  it("drops a slow platform's frames until a key frame, without affecting others", () => {
    const fanOut = new FlvFanOut();
    fanOut.push(videoConfig);
    const slow = recordingSink();
    const fast = recordingSink();
    fanOut.attach("slow", slow.sink);
    fanOut.attach("fast", fast.sink);
    fanOut.push(keyFrame(0));
    const slowBefore = slow.writes.length;

    slow.backlog.bytes = 9 * 1024 * 1024;
    fanOut.push(interFrame(33));
    fanOut.push(interFrame(66));
    expect(slow.writes).toHaveLength(slowBefore);
    expect(fast.writes).toHaveLength(slowBefore + 2);

    slow.backlog.bytes = 0;
    fanOut.push(interFrame(99));
    expect(slow.writes).toHaveLength(slowBefore);
    fanOut.push(keyFrame(2000));
    expect(slow.writes).toHaveLength(slowBefore + 1);
  });

  it("makes every platform wait for the next key frame after a reset", () => {
    const fanOut = new FlvFanOut();
    fanOut.push(videoConfig);
    const platform = recordingSink();
    fanOut.attach("twitch", platform.sink);
    fanOut.push(keyFrame(0));
    fanOut.reset();
    const before = platform.writes.length;
    fanOut.push(keyFrame(10));
    expect(platform.writes).toHaveLength(before);
    fanOut.push(videoConfig);
    fanOut.push(keyFrame(20));
    expect(platform.writes.length).toBeGreaterThan(before);
  });
});
