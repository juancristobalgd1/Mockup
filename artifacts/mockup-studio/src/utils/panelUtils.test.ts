import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeW, clampL, clampT, getModeAccent, getDefaultTab, extractColorsFromImage } from "./panelUtils";

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

describe("extractColorsFromImage", () => {
  let mockImageInstance: { crossOrigin: string; onload: (() => void) | null; onerror: (() => void) | null; src: string }

  beforeEach(() => {
    vi.restoreAllMocks()
    mockImageInstance = { crossOrigin: '', onload: null, onerror: null, src: '' }

    // Mock Image constructor using a proper function so `new Image()` works
    vi.stubGlobal('Image', vi.fn().mockImplementation(function () {
      return mockImageInstance
    }))

    // Mock canvas
    const mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([
          ...Array.from({ length: 200 }, () => [255, 0, 0, 255]).flat(),
          ...Array.from({ length: 100 }, () => [0, 0, 255, 255]).flat(),
          ...Array.from({ length: 100 }, () => [0, 255, 0, 128]).flat(),
        ]).slice(0, 1600),
      })),
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return { width: 20, height: 20, getContext: () => mockContext } as any
      }
      return document.createElement(tag)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("extracts dominant colors from an image", async () => {
    const promise = extractColorsFromImage('fake-src.png')
    mockImageInstance.onload!()
    const colors = await promise
    expect(colors.length).toBeGreaterThanOrEqual(2)
    expect(colors[0]).toBe('rgb(255,0,0)')
    expect(colors[1]).toBe('rgb(0,0,255)')
  })

  it("returns empty array on image error", async () => {
    const promise = extractColorsFromImage('bad-src.png')
    mockImageInstance.onerror!()
    const colors = await promise
    expect(colors).toEqual([])
  })

  it("returns empty array when canvas context is null", async () => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return { width: 20, height: 20, getContext: () => null } as any
      }
      return document.createElement(tag)
    })
    const promise = extractColorsFromImage('fake-src.png')
    mockImageInstance.onload!()
    const colors = await promise
    expect(colors).toEqual([])
  })
});
