import { describe, expect, it } from "vitest";
import { offerCodeFromText, offerLinkUrl, readCameraLink } from "./cameraLink";

const ORIGIN = "https://gospelstudio.app";
const CODE = "WS3T1U WY94%O042+DW:$*-./";

Object.assign(globalThis, { window: { location: { origin: ORIGIN } } });

describe("camera links", () => {
  it("carries a pairing code in the link and reads it back unchanged", () => {
    const link = offerLinkUrl(CODE);

    expect(link.startsWith(`${ORIGIN}/camera#offer=`)).toBe(true);
    expect(readCameraLink(new URL(link)).offerCode).toBe(CODE);
    expect(offerCodeFromText(link)).toBe(CODE);
  });

  it("leaves a plain pasted code alone", () => {
    expect(offerCodeFromText(CODE)).toBe(CODE);
  });

  it("only accepts a studio link with a real room and token", () => {
    const good = new URL(
      `${ORIGIN}/camera?room=net-gz0nrq&studio=97e2c9b1-2eab-42d9-8cd9-bcc54337cf1b`,
    );
    const forged = new URL(`${ORIGIN}/camera?room=../../x&studio=<script>`);

    expect(readCameraLink(good).studio).toEqual({
      room: "net-gz0nrq",
      studio: "97e2c9b1-2eab-42d9-8cd9-bcc54337cf1b",
    });
    expect(readCameraLink(forged).studio).toBeNull();
  });
});
