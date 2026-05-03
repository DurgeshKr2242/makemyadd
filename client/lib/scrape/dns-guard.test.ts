import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  default: { lookup: vi.fn() },
  lookup: vi.fn(),
}));

import * as dns from "node:dns/promises";

import { isPrivateAddress, resolvePublicHostname } from "./dns-guard";

afterEach(() => vi.restoreAllMocks());

describe("isPrivateAddress", () => {
  it.each([
    ["10.0.0.1", true],
    ["10.255.255.254", true],
    ["172.16.0.1", true],
    ["172.31.255.254", true],
    ["192.168.1.1", true],
    ["127.0.0.1", true],
    ["169.254.169.254", true], // cloud metadata
    ["100.64.0.1", true], // CGNAT
    ["::1", true],
    ["fc00::1", true],
    ["fe80::1", true],
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["2001:4860:4860::8888", false],
    ["172.32.0.1", false], // just outside RFC1918 range
    ["172.15.255.254", false],
  ])("classifies %s correctly (%s)", (ip, expected) => {
    expect(isPrivateAddress(ip)).toBe(expected);
  });
});

describe("resolvePublicHostname", () => {
  it("returns ok when all answers are public", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: "104.21.50.1", family: 4 },
      { address: "172.67.140.1", family: 4 },
    ] as never);
    const r = await resolvePublicHostname("example.com");
    expect(r).toEqual({ ok: true });
  });

  it("rejects when ANY answer resolves to a private address", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([
      { address: "104.21.50.1", family: 4 },
      { address: "10.0.0.5", family: 4 }, // poisoned
    ] as never);
    const r = await resolvePublicHostname("evil.com");
    expect(r).toEqual({ ok: false, reason: "resolves_to_private:10.0.0.5" });
  });

  it("rejects on lookup error (NXDOMAIN, etc.)", async () => {
    vi.mocked(dns.lookup).mockRejectedValue(
      Object.assign(new Error("nx"), { code: "ENOTFOUND" }),
    );
    const r = await resolvePublicHostname("nx.example");
    expect(r.ok).toBe(false);
  });
});
