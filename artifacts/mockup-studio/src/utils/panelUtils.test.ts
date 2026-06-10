import { describe, it, expect, beforeEach } from "vitest";
import { safeW, clampL, clampT, getModeAccent, getDefaultTab } from "./panelUtils";

describe("safeW", () => {
  it("returns a min() CSS expression", () => {
    const result = safeW(320);
    expect(result).toBe("min(320px, calc(100vw - 16px))");
  });

  it("handles zero", () => {
    expect(safeW(0)).toBe("min(0px, calc(100vw - 16px))");
  });
});

describe("clampL", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
  });

  it("clamps left edge inside viewport", () => {
    expect(clampL(0, 200)).toBe(8);
    expect(clampL(100, 200)).toBe(100);
    expect(clampL(1000, 200)).toBe(816);
  });

  it("applies offset correctly", () => {
    expect(clampL(100, 200, 50)).toBe(150);
  });

  it("prevents negative values", () => {
    expect(clampL(-50, 200)).toBe(8);
  });
});

describe("clampT", () => {
  it("never goes below 8", () => {
    expect(clampT(0)).toBe(8);
    expect(clampT(-10)).toBe(8);
    expect(clampT(8)).toBe(8);
    expect(clampT(100)).toBe(100);
  });
});

describe("getModeAccent", () => {
  it("returns red for movie mode", () => {
    expect(getModeAccent("movie")).toEqual({
      color: "#dc2626",
      bg: "rgba(220,38,38,0.08)",
      border: "rgba(220,38,38,0.3)",
    });
  });

  it("returns blue for screenshot mode", () => {
    expect(getModeAccent("screenshot")).toEqual({
      color: "#0284c7",
      bg: "rgba(2,132,199,0.08)",
      border: "rgba(2,132,199,0.3)",
    });
  });

  it("returns gray for default modes", () => {
    const result = getModeAccent("mockup");
    expect(result.color).toBe("#374151");
    expect(result).toEqual({
      color: "#374151",
      bg: "rgba(55,65,81,0.07)",
      border: "rgba(55,65,81,0.25)",
    });
  });

  it("returns gray for unknown modes", () => {
    expect(getModeAccent("unknown")).toEqual({
      color: "#374151",
      bg: "rgba(55,65,81,0.07)",
      border: "rgba(55,65,81,0.25)",
    });
  });
});

describe("getDefaultTab", () => {
  it("returns 'canvas' for canvas mode", () => {
    expect(getDefaultTab("canvas")).toBe("canvas");
  });

  it("returns 'canvas' for movie mode", () => {
    expect(getDefaultTab("movie")).toBe("canvas");
  });

  it("returns 'device' for screenshot mode", () => {
    expect(getDefaultTab("screenshot")).toBe("device");
  });

  it("returns 'device' for mockup mode", () => {
    expect(getDefaultTab("mockup")).toBe("device");
  });

  it("returns 'device' for unknown modes", () => {
    expect(getDefaultTab("unknown")).toBe("device");
  });
});
