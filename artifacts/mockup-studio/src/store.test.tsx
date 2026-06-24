import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppProvider, useApp, defaultState, type AppState, type TextOverlay, type CameraKeyframe } from "./store";

function renderStore() {
  return renderHook(() => useApp(), { wrapper: AppProvider });
}

describe("AppProvider", () => {
  describe("initial state", () => {
    it("provides default state", () => {
      const { result } = renderStore();
      expect(result.current.state).toEqual(defaultState);
    });

    it("starts with undo/redo disabled", () => {
      const { result } = renderStore();
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe("updateState", () => {
    it("partially updates state", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#000000", deviceModel: "samsung-s25" }));
      expect(result.current.state.bgColor).toBe("#000000");
      expect(result.current.state.deviceModel).toBe("samsung-s25");
      expect(result.current.state.deviceType).toBe(defaultState.deviceType);
    });

    it("records history by default", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#ff0000" }));
      expect(result.current.canUndo).toBe(true);
    });

    it("skips history when skipHistory is true", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#ff0000" }, true));
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe("undo / redo", () => {
    it("undo restores previous state", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#ff0000" }));
      act(() => result.current.updateState({ bgColor: "#00ff00" }));
      expect(result.current.state.bgColor).toBe("#00ff00");

      act(() => result.current.undo());
      expect(result.current.state.bgColor).toBe("#ff0000");
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it("redo restores undone state", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#ff0000" }));
      act(() => result.current.updateState({ bgColor: "#00ff00" }));
      act(() => result.current.undo());
      act(() => result.current.redo());
      expect(result.current.state.bgColor).toBe("#00ff00");
    });

    it("clears future on new action after undo", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ bgColor: "#ff0000" }));
      act(() => result.current.updateState({ bgColor: "#00ff00" }));
      act(() => result.current.undo());
      expect(result.current.canRedo).toBe(true);

      act(() => result.current.updateState({ bgColor: "#0000ff" }));
      expect(result.current.canRedo).toBe(false);
      expect(result.current.state.bgColor).toBe("#0000ff");
    });

    it("does nothing when history is empty", () => {
      const { result } = renderStore();
      act(() => result.current.undo());
      expect(result.current.state).toEqual(defaultState);
      act(() => result.current.redo());
      expect(result.current.state).toEqual(defaultState);
    });

    it("limits history to 50 entries", () => {
      const { result } = renderStore();
      for (let i = 0; i < 60; i++) {
        act(() => result.current.updateState({ bgColor: `#${i.toString(16).padStart(6, "0")}` }));
      }
      expect(result.current.state.bgColor).toBe("#00003b");
      act(() => result.current.undo());
      expect(result.current.state.bgColor).toBe("#00003a");
      for (let i = 0; i < 50; i++) {
        act(() => result.current.undo());
      }
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe("text overlays", () => {
    it("adds a text overlay with defaults", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      expect(result.current.state.texts).toHaveLength(1);
      const text = result.current.state.texts[0];
      expect(text.text).toBe("Double-click to edit");
      expect(text.kind).toBe("text");
      expect(text.x).toBe(50);
      expect(text.y).toBe(50);
      expect(text.fontSize).toBe(24);
      expect(text.color).toBe("#ffffff");
      expect(text.isBold).toBe(false);
      expect(text.isItalic).toBe(false);
      expect(text.id).toBeTruthy();
    });

    it("adds multiple text overlays", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      act(() => result.current.addText());
      expect(result.current.state.texts).toHaveLength(2);
    });

    it("updates a text overlay by id", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      const id = result.current.state.texts[0].id;
      act(() => result.current.updateText(id, { text: "Updated", fontSize: 32 }));
      expect(result.current.state.texts[0].text).toBe("Updated");
      expect(result.current.state.texts[0].fontSize).toBe(32);
    });

    it("does not modify other texts on update", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      act(() => result.current.addText());
      const [first, second] = result.current.state.texts;
      act(() => result.current.updateText(first.id, { text: "First updated" }));
      expect(result.current.state.texts[0].text).toBe("First updated");
      expect(result.current.state.texts[1].text).toBe(second.text);
    });

    it("removes a text overlay by id", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      act(() => result.current.addText());
      const id = result.current.state.texts[0].id;
      act(() => result.current.removeText(id));
      expect(result.current.state.texts).toHaveLength(1);
      expect(result.current.state.texts[0].id).not.toBe(id);
    });

    it("is a no-op when removing a non-existent id", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      act(() => result.current.removeText("non-existent"));
      expect(result.current.state.texts).toHaveLength(1);
    });
  });

  describe("labels", () => {
    it("adds a label at a given anchor position", () => {
      const { result } = renderStore();
      act(() => result.current.addLabel("top-right"));
      expect(result.current.state.texts).toHaveLength(1);
      const label = result.current.state.texts[0] as TextOverlay;
      expect(label.kind).toBe("label");
      expect(label.labelAnchor).toBe("top-right");
      expect(label.isBold).toBe(true);
      expect(label.text).toBe("New label");
    });

    it("sets activeLabelId after adding a label", () => {
      const { result } = renderStore();
      act(() => result.current.addLabel("bottom"));
      expect(result.current.state.activeLabelId).toBe(result.current.state.texts[0].id);
    });

    it("uses draft settings for labels", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ labelDraftSize: 20, labelDraftColor: "#ff0000" }));
      act(() => result.current.addLabel("left"));
      const label = result.current.state.texts[0] as TextOverlay;
      expect(label.fontSize).toBe(20);
      expect(label.color).toBe("#ff0000");
    });

    it("clears all labels but keeps text overlays", () => {
      const { result } = renderStore();
      act(() => result.current.addText());
      act(() => result.current.addLabel("top"));
      act(() => result.current.addLabel("bottom"));
      expect(result.current.state.texts).toHaveLength(3);
      act(() => result.current.clearLabels());
      expect(result.current.state.texts).toHaveLength(1);
      expect(result.current.state.texts[0].kind).toBe("text");
    });

    it("places fixed-mode labels at anchor position", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ labelDraftMode: "fixed" }));
      act(() => result.current.addLabel("top-right"));
      const label = result.current.state.texts[0] as TextOverlay;
      expect(label.x).toBe(78);
      expect(label.y).toBe(20);
    });

    it("places non-fixed labels at center", () => {
      const { result } = renderStore();
      act(() => result.current.updateState({ labelDraftMode: "follow" }));
      act(() => result.current.addLabel("top-right"));
      const label = result.current.state.texts[0] as TextOverlay;
      expect(label.x).toBe(50);
      expect(label.y).toBe(50);
    });
  });

  describe("camera keyframes", () => {
    const keyframe = { time: 0, position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] };

    it("adds a keyframe with an id", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe(keyframe));
      expect(result.current.state.cameraKeyframes).toHaveLength(1);
      expect(result.current.state.cameraKeyframes[0].id).toBeTruthy();
      expect(result.current.state.cameraKeyframes[0].time).toBe(0);
    });

    it("sorts keyframes by time", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 5 }));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 0 }));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 2.5 }));
      const times = result.current.state.cameraKeyframes.map(k => k.time);
      expect(times).toEqual([0, 2.5, 5]);
    });

    it("deduplicates keyframes within 0.1s tolerance", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 0 }));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 0.05 }));
      expect(result.current.state.cameraKeyframes).toHaveLength(1);
    });

    it("removes a keyframe by id", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe(keyframe));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 2 }));
      const id = result.current.state.cameraKeyframes[0].id;
      act(() => result.current.removeCameraKeyframe(id));
      expect(result.current.state.cameraKeyframes).toHaveLength(1);
      expect(result.current.state.cameraKeyframes[0].id).not.toBe(id);
    });

    it("updates a keyframe and re-sorts", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 0 }));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 5 }));
      const id = result.current.state.cameraKeyframes[0].id;
      act(() => result.current.updateCameraKeyframe(id, { time: 10 }));
      expect(result.current.state.cameraKeyframes[0].time).toBe(5);
      expect(result.current.state.cameraKeyframes[1].time).toBe(10);
    });

    it("clears all keyframes", () => {
      const { result } = renderStore();
      act(() => result.current.addCameraKeyframe(keyframe));
      act(() => result.current.addCameraKeyframe({ ...keyframe, time: 2 }));
      act(() => result.current.clearCameraKeyframes());
      expect(result.current.state.cameraKeyframes).toHaveLength(0);
    });
  });

  describe("useApp validation", () => {
    it("throws when used outside AppProvider", () => {
      expect(() => renderHook(() => useApp())).toThrow("useApp must be used within AppProvider");
    });
  });
});
