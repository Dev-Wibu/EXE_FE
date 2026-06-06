import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTokenExpiresAt, isSessionExpired } from "./auth-session";

// Helper: build a minimal JWT with a given exp claim
function makeToken(exp?: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const payload = btoa(JSON.stringify(exp !== undefined ? { exp } : {}))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const signature = "sig";
  return `${header}.${payload}.${signature}`;
}

describe("getTokenExpiresAt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null for null/undefined/empty token", () => {
    expect(getTokenExpiresAt(null)).toBeNull();
    expect(getTokenExpiresAt(undefined)).toBeNull();
    expect(getTokenExpiresAt("")).toBeNull();
  });

  it("returns Date.now() for a non-JWT string (fewer than 3 segments)", () => {
    const now = Date.now();
    expect(getTokenExpiresAt("not-a-jwt")).toBe(now);
    expect(getTokenExpiresAt("ab.cd")).toBe(now);
  });

  it("returns Date.now() when payload is not valid base64", () => {
    const now = Date.now();
    expect(getTokenExpiresAt("aaa.!!!invalid.bbb")).toBe(now);
  });

  it("returns Date.now() when payload has no exp claim", () => {
    const now = Date.now();
    const token = makeToken(); // no exp
    expect(getTokenExpiresAt(token)).toBe(now);
  });

  it("returns Date.now() when exp is not a finite number", () => {
    const now = Date.now();
    const token = makeToken(Infinity as unknown as number);
    expect(getTokenExpiresAt(token)).toBe(now);
  });

  it("converts exp (seconds) to milliseconds", () => {
    const expSeconds = 1735689600; // 2025-01-01T00:00:00Z
    const token = makeToken(expSeconds);
    expect(getTokenExpiresAt(token)).toBe(expSeconds * 1000);
  });

  it("returns negative milliseconds for negative exp (edge case)", () => {
    const token = makeToken(-1);
    expect(getTokenExpiresAt(token)).toBe(-1000);
  });

  it("returns 0 for exp of 0 (valid finite number)", () => {
    const token = makeToken(0);
    expect(getTokenExpiresAt(token)).toBe(0);
  });

  it("returns Date.now() when exp is a non-number type (string)", () => {
    // Build token with exp as string
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payload = btoa(JSON.stringify({ exp: "not-a-number" }))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const token = `${header}.${payload}.sig`;
    const now = Date.now();
    expect(getTokenExpiresAt(token)).toBe(now);
  });

  it("handles token with more than 3 segments", () => {
    const expSeconds = 1735689600;
    const token = makeToken(expSeconds);
    // Extra segment appended — payload is still in parts[1]
    expect(getTokenExpiresAt(`${token}.extra`)).toBe(expSeconds * 1000);
  });

  it("strips Bearer prefix before parsing", () => {
    const expSeconds = 1735689600;
    const token = makeToken(expSeconds);
    expect(getTokenExpiresAt(`Bearer ${token}`)).toBe(expSeconds * 1000);
    expect(getTokenExpiresAt(`bearer ${token}`)).toBe(expSeconds * 1000);
  });
});

describe("isSessionExpired", () => {
  it("returns false for null/undefined", () => {
    expect(isSessionExpired(null)).toBe(false);
    expect(isSessionExpired(undefined)).toBe(false);
  });

  it("returns false for non-finite numbers", () => {
    expect(isSessionExpired(NaN)).toBe(false);
    expect(isSessionExpired(Infinity)).toBe(false);
  });

  it("returns true when now >= expiresAt", () => {
    expect(isSessionExpired(1000, 1000)).toBe(true);
    expect(isSessionExpired(1000, 2000)).toBe(true);
  });

  it("returns false when now < expiresAt", () => {
    expect(isSessionExpired(2000, 1000)).toBe(false);
  });
});
