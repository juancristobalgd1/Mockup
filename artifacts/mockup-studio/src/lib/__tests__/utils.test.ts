import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("filters out falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b");
  });
});
