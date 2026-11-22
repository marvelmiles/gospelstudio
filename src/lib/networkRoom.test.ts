import { describe, expect, it } from "vitest";
import { networkKeyOf, publicAddressOf, STUN_SERVERS } from "./networkRoom";

describe("public address from an ICE candidate", () => {
  it("reads the address of a server reflexive candidate", () => {
    expect(
      publicAddressOf(
        "candidate:842163049 1 udp 1677729535 102.89.34.7 52004 typ srflx raddr 0.0.0.0 rport 0 generation 0",
      ),
    ).toBe("102.89.34.7");
  });

  it("ignores local host and relay candidates", () => {
    expect(
      publicAddressOf(
        "candidate:1 1 udp 2122260223 192.168.1.20 61234 typ host generation 0",
      ),
    ).toBeNull();
    expect(
      publicAddressOf("candidate:2 1 udp 41885439 34.1.2.3 3478 typ relay"),
    ).toBeNull();
  });
});

describe("network key", () => {
  it("uses the whole IPv4 address, which every device behind the router shares", () => {
    expect(networkKeyOf("102.89.34.7")).toBe("102.89.34.7");
  });

  it("uses the IPv6 network prefix, since each device has its own IPv6 address", () => {
    const phone = networkKeyOf("2a02:c7c:1234:ab00:1c2d:3e4f:5a6b:7c8d");
    const laptop = networkKeyOf("2a02:0c7c:1234:ab00::99");
    expect(phone).toBe("2a02:c7c:1234:ab00");
    expect(laptop).toBe(phone);
  });

  it("expands a shortened IPv6 prefix the same way", () => {
    expect(networkKeyOf("2001:db8::1")).toBe("2001:db8:0:0");
  });

  it("rejects text that is not an address", () => {
    expect(networkKeyOf("not-an-address")).toBeNull();
  });
});

describe("STUN servers", () => {
  it("asks more than one provider so one blocked server cannot break quick connect", () => {
    const providers = new Set(
      STUN_SERVERS.map((url) =>
        url.split(":")[1].split(".").slice(-2).join("."),
      ),
    );
    expect(providers.size).toBeGreaterThanOrEqual(3);
  });
});
