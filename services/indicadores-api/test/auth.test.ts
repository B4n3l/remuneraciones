import { describe, expect, it } from "vitest";
import { verifyApiKey } from "../src/auth.js";

describe("verifyApiKey (constant-time compare)", () => {
  it("returns true for matching keys", () => {
    expect(verifyApiKey("secret", "secret")).toBe(true);
  });

  it("returns false for mismatched keys of equal length", () => {
    expect(verifyApiKey("secret", "otherr")).toBe(false);
  });

  it("returns false for a missing key", () => {
    expect(verifyApiKey(undefined, "secret")).toBe(false);
  });

  it("returns false for an empty key", () => {
    expect(verifyApiKey("", "secret")).toBe(false);
  });

  it("returns false (not throw) when lengths differ", () => {
    // timingSafeEqual throws on length mismatch; verifyApiKey must guard it.
    expect(verifyApiKey("short", "a-much-longer-key")).toBe(false);
  });
});
