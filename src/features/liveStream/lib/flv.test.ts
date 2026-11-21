import { describe, expect, it } from "vitest";
import {
  aacAudioData,
  aacSequenceHeaderData,
  avcSequenceHeaderData,
  avcVideoData,
  createFlvHeader,
  encodeFlvTag,
  FLV_TAG_AUDIO,
  FLV_TAG_VIDEO,
  FlvFormatError,
  FlvStreamReader,
  isAacSequenceHeader,
  isAvcSequenceHeader,
  isVideoKeyFrame,
} from "./flv";

const bytes = (...values: number[]) => new Uint8Array(values);

const sampleStream = (): Uint8Array[] => [
  createFlvHeader(),
  encodeFlvTag(FLV_TAG_VIDEO, 0, avcSequenceHeaderData(bytes(1, 100, 0, 40))),
  encodeFlvTag(FLV_TAG_AUDIO, 0, aacSequenceHeaderData(bytes(0x11, 0x90))),
  encodeFlvTag(FLV_TAG_VIDEO, 0, avcVideoData(bytes(0, 0, 0, 1, 0x65), true)),
  encodeFlvTag(FLV_TAG_AUDIO, 21, aacAudioData(bytes(9, 9, 9))),
  encodeFlvTag(FLV_TAG_VIDEO, 33, avcVideoData(bytes(0, 0, 0, 1, 0x41), false)),
];

const joined = (parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
};

describe("FLV muxing", () => {
  it("writes the standard header with audio and video flags", () => {
    expect([...createFlvHeader()]).toEqual([
      0x46, 0x4c, 0x56, 1, 5, 0, 0, 0, 9, 0, 0, 0, 0,
    ]);
  });

  it("writes a tag with its size, timestamp and trailing tag size", () => {
    const tag = encodeFlvTag(FLV_TAG_AUDIO, 0x01020304, bytes(7, 8));
    expect([...tag]).toEqual([
      8, 0, 0, 2, 0x02, 0x03, 0x04, 0x01, 0, 0, 0, 7, 8, 0, 0, 0, 13,
    ]);
  });

  it("marks AVC key frames, inter frames and sequence headers", () => {
    expect([...avcSequenceHeaderData(bytes(1)).slice(0, 2)]).toEqual([0x17, 0]);
    expect([...avcVideoData(bytes(1), true).slice(0, 2)]).toEqual([0x17, 1]);
    expect([...avcVideoData(bytes(1), false).slice(0, 2)]).toEqual([0x27, 1]);
    expect([...aacSequenceHeaderData(bytes(1)).slice(0, 2)]).toEqual([0xaf, 0]);
    expect([...aacAudioData(bytes(1)).slice(0, 2)]).toEqual([0xaf, 1]);
  });
});

describe("FLV reading", () => {
  it("reads back every tag with its timestamp and kind", () => {
    const tags = new FlvStreamReader().push(joined(sampleStream()));
    expect(tags.map((tag) => [tag.type, tag.timestampMs])).toEqual([
      [9, 0],
      [8, 0],
      [9, 0],
      [8, 21],
      [9, 33],
    ]);
    expect(isAvcSequenceHeader(tags[0])).toBe(true);
    expect(isAacSequenceHeader(tags[1])).toBe(true);
    expect(isVideoKeyFrame(tags[2])).toBe(true);
    expect(isVideoKeyFrame(tags[4])).toBe(false);
    expect(isVideoKeyFrame(tags[0])).toBe(false);
  });

  it("handles a stream split at any byte", () => {
    const stream = joined(sampleStream());
    for (const size of [1, 3, 7, 16]) {
      const reader = new FlvStreamReader();
      const tags = [];
      for (let offset = 0; offset < stream.byteLength; offset += size)
        tags.push(...reader.push(stream.slice(offset, offset + size)));
      expect(tags, `chunks of ${size}`).toHaveLength(5);
      expect([...tags[3].data]).toEqual([0xaf, 1, 9, 9, 9]);
    }
  });

  it("keeps each tag's full bytes for forwarding unchanged", () => {
    const [, , , keyFrame] = sampleStream();
    const tags = new FlvStreamReader().push(joined(sampleStream()));
    expect([...tags[2].bytes]).toEqual([...keyFrame]);
  });

  it("refuses data that is not FLV", () => {
    expect(() =>
      new FlvStreamReader().push(
        new TextEncoder().encode("GET / HTTP/1.1\r\n"),
      ),
    ).toThrow(FlvFormatError);
  });

  it("refuses unknown tag types", () => {
    const stream = joined([createFlvHeader(), encodeFlvTag(42, 0, bytes(1))]);
    expect(() => new FlvStreamReader().push(stream)).toThrow(FlvFormatError);
  });
});
