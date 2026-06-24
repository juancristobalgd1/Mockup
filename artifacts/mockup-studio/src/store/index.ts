import { create } from "zustand";
import { defaultState } from "./types";
import type { DeviceSlice } from "./slices/deviceSlice";
import { deviceSlice } from "./slices/deviceSlice";
import type { BackgroundSlice } from "./slices/backgroundSlice";
import { backgroundSlice } from "./slices/backgroundSlice";
import type { SceneSlice } from "./slices/sceneSlice";
import { sceneSlice } from "./slices/sceneSlice";
import type { CanvasSlice } from "./slices/canvasSlice";
import { canvasSlice } from "./slices/canvasSlice";
import type { AnnotateSlice } from "./slices/annotateSlice";
import { annotateSlice } from "./slices/annotateSlice";
import type { LabelsSlice } from "./slices/labelsSlice";
import { labelsSlice } from "./slices/labelsSlice";
import type { MovieSlice } from "./slices/movieSlice";
import { movieSlice } from "./slices/movieSlice";
import type { UiSlice } from "./slices/uiSlice";
import { uiSlice } from "./slices/uiSlice";

export type AppStore = DeviceSlice &
  BackgroundSlice &
  SceneSlice &
  CanvasSlice &
  AnnotateSlice &
  LabelsSlice &
  MovieSlice &
  UiSlice;

export const useAppStore = create<AppStore>()(
  (set, get, api) => ({
    ...deviceSlice(set, get, api),
    ...backgroundSlice(set, get, api),
    ...sceneSlice(set, get, api),
    ...canvasSlice(set, get, api),
    ...annotateSlice(set, get, api),
    ...labelsSlice(set, get, api),
    ...movieSlice(set, get, api),
    ...uiSlice(set, get, api),
  })
);

/** Reset store to default state (useful in tests). */
export function resetStore() {
  useAppStore.setState(defaultState as Partial<AppStore>, false);
}
