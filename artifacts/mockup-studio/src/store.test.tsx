// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AppProvider, useApp } from "./store";

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;

describe("undo history", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["performance"] }));
  afterEach(() => vi.useRealTimers());

  const setup = () => renderHook(() => useApp(), { wrapper }).result;

  it("collapses a continuous slider drag into one undo step", () => {
    const app = setup();
    const initial = app.current.state.bgBlur;
    for (let v = 1; v <= 30; v++) {
      act(() => app.current.updateState({ bgBlur: v }));
      vi.advanceTimersByTime(16);
    }
    act(() => app.current.undo());
    expect(app.current.state.bgBlur).toBe(initial);
    expect(app.current.canUndo).toBe(false);
    act(() => app.current.redo());
    expect(app.current.state.bgBlur).toBe(30);
  });

  it("keeps separate edits as separate steps", () => {
    const app = setup();
    act(() => app.current.updateState({ bgBlur: 5 }));
    vi.advanceTimersByTime(1000);
    act(() => app.current.updateState({ bgBlur: 9 }));
    act(() => app.current.undo());
    expect(app.current.state.bgBlur).toBe(5);
  });

  it("undoes text edits and additions step by step", () => {
    const app = setup();
    act(() => app.current.addText());
    const id = app.current.state.texts[0].id;
    vi.advanceTimersByTime(1000);
    for (const text of ["H", "Ho", "Hola"]) {
      act(() => app.current.updateText(id, { text }));
      vi.advanceTimersByTime(50);
    }
    act(() => app.current.undo());
    expect(app.current.state.texts).toHaveLength(1);
    expect(app.current.state.texts[0].text).not.toBe("Hola");
    act(() => app.current.undo());
    expect(app.current.state.texts).toHaveLength(0);
  });

  it("does not record changes made with skipHistory", () => {
    const app = setup();
    act(() => app.current.updateState({ zoomValue: 3 }, true));
    expect(app.current.state.zoomValue).toBe(3);
    expect(app.current.canUndo).toBe(false);
  });
});
