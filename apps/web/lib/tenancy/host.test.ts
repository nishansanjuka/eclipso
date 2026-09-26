import { describe, expect, it } from "vitest";
import { appUrl, orgUrl, parseHost } from "./host";

const ROOT = "aperture.lk";

describe("parseHost", () => {
  it("recognises the root, www and workspaces", () => {
    expect(parseHost("aperture.lk", ROOT)).toEqual({ kind: "root" });
    expect(parseHost("www.aperture.lk", ROOT)).toEqual({ kind: "www" });
    // "app" is reserved: it is not a workspace and not a host of its own.
    expect(parseHost("app.aperture.lk", ROOT)).toEqual({ kind: "unknown" });
    expect(parseHost("def-org.aperture.lk", ROOT)).toEqual({
      kind: "org",
      slug: "def-org",
    });
  });

  it("works with a port, as in local development", () => {
    const root = "dev.local:3001";
    expect(parseHost("dev.local:3001", root)).toEqual({ kind: "root" });
    expect(parseHost("kottawa.dev.local:3001", root)).toEqual({
      kind: "org",
      slug: "kottawa",
    });
  });

  it("is case-insensitive and ignores surrounding space", () => {
    expect(parseHost(" DEF-Org.Aperture.LK ", ROOT)).toEqual({
      kind: "org",
      slug: "def-org",
    });
  });

  it("treats foreign hosts as external, so plain localhost still works", () => {
    expect(parseHost("localhost:3001", ROOT)).toEqual({ kind: "external" });
    expect(parseHost("evil.com", ROOT)).toEqual({ kind: "external" });
    // A look-alike suffix is not under the root domain.
    expect(parseHost("def-org.notaperture.lk", ROOT)).toEqual({
      kind: "external",
    });
    expect(parseHost(null, ROOT)).toEqual({ kind: "external" });
    expect(parseHost("def-org.aperture.lk", "")).toEqual({ kind: "external" });
  });

  it("rejects nested or malformed labels under the root", () => {
    expect(parseHost("a.b.aperture.lk", ROOT)).toEqual({ kind: "unknown" });
    expect(parseHost("-bad.aperture.lk", ROOT)).toEqual({ kind: "unknown" });
    expect(parseHost("x.aperture.lk", ROOT)).toEqual({ kind: "unknown" });
  });
});

describe("urls", () => {
  const config = { rootDomain: "aperture.lk", protocol: "https" as const };

  it("builds workspace and app urls", () => {
    expect(orgUrl("keels", "/reports", config)).toBe(
      "https://keels.aperture.lk/reports",
    );
    expect(appUrl("/sign-in", config)).toBe("https://aperture.lk/sign-in");
  });
});

describe("baseUrl", () => {
  it("points at the root domain", async () => {
    const { baseUrl } = await import("./host");
    expect(baseUrl("/", { rootDomain: "aperture.lk", protocol: "https" })).toBe(
      "https://aperture.lk/",
    );
  });
});
