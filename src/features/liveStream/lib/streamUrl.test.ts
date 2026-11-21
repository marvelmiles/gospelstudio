import { describe, expect, it } from "vitest";
import {
  buildStreamUrl,
  isPrivateHost,
  redactIdentifier,
  redactStreamKey,
  redactStreamUrlsInText,
  serverUrlProblem,
  streamKeyProblem,
  streamUrlSchema,
} from "./streamUrl";

describe("stream key redaction", () => {
  it("keeps only the first and last characters of a key", () => {
    expect(redactIdentifier("abcdefghijkl")).toBe("{abc...jkl}");
    expect(redactIdentifier("abcdefgh")).toBe("{ab...gh}");
    expect(redactIdentifier("abcd")).toBe("{a...d}");
    expect(redactIdentifier("ab")).toBe("{...}");
  });

  it("redacts only the last path segment of an RTMP address", () => {
    expect(
      redactStreamKey("rtmps://a.rtmps.youtube.com/live2/abcd-efgh-ijkl"),
    ).toBe("rtmps://a.rtmps.youtube.com/live2/{abc...jkl}");
  });

  it("treats a Facebook query string as part of the key", () => {
    expect(
      redactStreamKey(
        "rtmps://live-api-s.facebook.com:443/rtmp/FB-123-0-Ab?s_bl=1&a=xyz",
      ),
    ).toBe("rtmps://live-api-s.facebook.com:443/rtmp/{FB-...xyz}");
  });

  it("keeps an already redacted address as it is", () => {
    const text = "failed rtmp://live.twitch.tv/app/{liv...789}";
    expect(redactStreamUrlsInText(text)).toBe(text);
  });

  it("redacts every address inside free text", () => {
    expect(
      redactStreamUrlsInText(
        "failed rtmp://live.twitch.tv/app/live_123456789 after 3 retries",
      ),
    ).toBe("failed rtmp://live.twitch.tv/app/{liv...789} after 3 retries");
  });
});

describe("stream addresses", () => {
  it("joins the server address and the key with one slash", () => {
    expect(buildStreamUrl("rtmp://live.twitch.tv/app/", " live_1 ")).toBe(
      "rtmp://live.twitch.tv/app/live_1",
    );
  });

  it("accepts the platform server addresses", () => {
    expect(serverUrlProblem("rtmps://a.rtmps.youtube.com/live2")).toBeNull();
    expect(
      serverUrlProblem("rtmps://live-api-s.facebook.com:443/rtmp"),
    ).toBeNull();
  });

  it("explains what is wrong with a server address", () => {
    expect(serverUrlProblem("youtube")).toMatch(/rtmp:\/\//);
    expect(serverUrlProblem("https://youtube.com/live2")).toMatch(/rtmp/);
    expect(serverUrlProblem("rtmp://live.twitch.tv")).toMatch(/path/);
    expect(serverUrlProblem("rtmp://host.com/app?key=1")).toMatch(/stream key/);
    expect(serverUrlProblem("rtmp://10.0.0.5/app")).toMatch(/public/);
  });

  it("checks stream keys for length and characters", () => {
    expect(streamKeyProblem("live_123456789")).toBeNull();
    expect(streamKeyProblem("ab")).not.toBeNull();
    expect(streamKeyProblem("has space")).not.toBeNull();
  });

  it("validates full stream addresses on the server", () => {
    expect(
      streamUrlSchema.safeParse("rtmps://a.rtmps.youtube.com/live2/abc-def")
        .success,
    ).toBe(true);
    expect(
      streamUrlSchema.safeParse("rtmp://a.rtmp.youtube.com/live2").success,
    ).toBe(false);
    expect(
      streamUrlSchema.safeParse("rtmp://a.rtmp.youtube.com/live2/a b").success,
    ).toBe(false);
  });

  it("leaves the public host check to the relay, which also checks DNS", () => {
    expect(
      streamUrlSchema.safeParse("rtmp://192.168.1.20/live/key123").success,
    ).toBe(true);
    expect(serverUrlProblem("rtmp://192.168.1.20/live")).toMatch(/public/);
  });

  it("recognises local and private hosts", () => {
    for (const host of [
      "localhost",
      "printer.local",
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.0.10",
      "169.254.1.1",
      "100.64.0.1",
      "[::1]",
      "[fd00::1]",
    ])
      expect(isPrivateHost(host), host).toBe(true);
    for (const host of ["a.rtmps.youtube.com", "8.8.8.8", "172.32.0.1"])
      expect(isPrivateHost(host), host).toBe(false);
  });
});
