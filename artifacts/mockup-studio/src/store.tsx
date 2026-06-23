import { useRef, useState, useCallback, useEffect, createContext, useContext, useMemo } from "react";
import { useAppStore, resetStore as resetZustandStore } from "./store/index";
import type { AppStore } from "./store/index";
import type {
  AppState,
  LabelAnchorPosition,
  LabelTrackingMode,
  TextOverlay,
  CameraKeyframe,
  AnnotateShapeTool,
  AnyAnnotateStroke,
} from "./store/types";

// Re-exportar tipos para que los imports existentes no se rompan
export type {
  DeviceType,
  DeviceColor,
  BackgroundType,
  ShadowStyle,
  CanvasRatio,
  ContentType,
  CreationMode,
  InteractionMode,
  EasingType,
  CameraKeyframe,
  TextOverlay,
  LabelAnchorPosition,
  LabelTrackingMode,
  EnvPreset,
  AnnotatePoint,
  AnnotateFreeStroke,
  AnnotateShapeTool,
  AnnotateShapeStroke,
  AnnotateTextStroke,
  AnnotateStickerStroke,
  AnyAnnotateStroke,
  AppState,
} from "./store/types";
export { defaultState } from "./store/types";

export function resetStore() {
  resetZustandStore();
  globalHistory.length = 0;
  globalFuture.length = 0;
  globalHistoryLen = 0;
  globalFutureLen = 0;
  notifyListeners();
}

// Lista de keys de AppState para extraer solo propiedades del store
const STATE_KEYS: (keyof AppState)[] = [
  "deviceModel",
  "deviceType",
  "deviceLandscape",
  "deviceColor",
  "screenshotUrl",
  "videoUrl",
  "contentType",
  "bgType",
  "bgColor",
  "bgImage",
  "bgVideo",
  "bgPattern",
  "bgPatternColor",
  "bgPatternEnabled",
  "bgPatternScale",
  "bgPatternOpacity",
  "bgPatternBlur",
  "bgAnimated",
  "bgOpacity",
  "showBgSettings",
  "canvasRatio",
  "canvasRadius",
  "overlayEnabled",
  "overlayColor",
  "overlayOpacity",
  "lightOverlay",
  "lightOverlayOpacity",
  "lightOverlayBlend",
  "lightOverlayBgOnly",
  "annotateMode",
  "annotateTool",
  "annotateColor",
  "annotateSize",
  "annotateOpacity",
  "annotateShape",
  "annotateLineWidth",
  "annotateClearKey",
  "annotateStrokes",
  "animation",
  "autoRotate",
  "autoRotateSpeed",
  "envPreset",
  "envEnabled",
  "lightExposure",
  "lightBrightness",
  "lightAmbient",
  "lightWarmth",
  "lightIBL",
  "contactShadowOpacity",
  "contactShadowDirection",
  "cameraAngle",
  "cameraResetKey",
  "deviceScale",
  "scale",
  "rotation",
  "canvasPadding",
  "labelTabActive",
  "reflection",
  "reflectionOpacity",
  "glassReflection",
  "grain",
  "grainIntensity",
  "bloomIntensity",
  "bgBlur",
  "bgVignette",
  "bgVignetteIntensity",
  "grainBgOnly",
  "texts",
  "labelDraftMode",
  "labelDraftSize",
  "labelDraftLevitation",
  "labelDraftColor",
  "labelDraftFont",
  "movieMode",
  "movieDuration",
  "movieCurveTension",
  "cameraKeyframes",
  "dofEnabled",
  "dofFocusDistance",
  "dofFocalLength",
  "dofBokehScale",
  "dofFocus",
  "dofAperture",
  "clayMode",
  "clayColor",
  "audioUrl",
  "audioVolume",
  "creationMode",
  "showGrid",
  "activeLabelId",
  "deviceSubTab",
  "sceneSubTab",
  "labelsSubTab",
  "interactionMode",
  "zoomValue",
  "canvasPanX",
  "canvasPanY",
];

function extractState(store: AppStore): AppState {
  const state = {} as AppState;
  for (const key of STATE_KEYS) {
    (state as any)[key] = store[key];
  }
  return state;
}

type StateUpdater = Partial<AppState> | ((prev: AppState) => Partial<AppState>);

interface AppContextType {
  state: AppState;
  updateState: (updates: StateUpdater, skipHistory?: boolean) => void;
  addText: () => void;
  addLabel: (anchor: LabelAnchorPosition) => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
  clearLabels: () => void;
  addCameraKeyframe: (kf: Omit<CameraKeyframe, "id">) => void;
  removeCameraKeyframe: (id: string) => void;
  updateCameraKeyframe: (
    id: string,
    updates: Partial<Omit<CameraKeyframe, "id">>
  ) => void;
  clearCameraKeyframes: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<boolean>(false);

// Historial compartido a nivel de módulo para mantener semántica global de undo/redo
const globalHistory: AppState[] = [];
const globalFuture: AppState[] = [];
let globalHistoryLen = 0;
let globalFutureLen = 0;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

const MAX_HISTORY = 50;

function pushBounded(history: AppState[], state: AppState) {
  history.push(state);
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

export function AppProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: Partial<AppState>;
}) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && initialState) {
      useAppStore.setState(initialState);
      initialized.current = true;
    }
  }, [initialState]);

  return <AppContext.Provider value={true}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const insideProvider = useContext(AppContext);
  if (!insideProvider) {
    throw new Error("useApp must be used within AppProvider");
  }
  // Leer todo el store (esto causará re-render en cualquier cambio, igual que Context)
  const store = useAppStore();

  const [tick, setTick] = useState(0);

  // Suscribirse a cambios en las longitudes de historial global
  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);

  const state = useMemo(() => extractState(store), [store]);

  const updateState = useCallback(
    (updates: StateUpdater, skipHistory = false) => {
      const current = extractState(useAppStore.getState());
      if (!skipHistory) {
        pushBounded(globalHistory, current);
        globalFuture.length = 0;
        globalHistoryLen = globalHistory.length;
        globalFutureLen = 0;
        notifyListeners();
      }
      const resolved =
        typeof updates === "function" ? updates(current) : updates;
      useAppStore.setState(resolved);
    },
    []
  );

  const undo = useCallback(() => {
    if (globalHistory.length === 0) return;
    const prev = globalHistory[globalHistory.length - 1];
    globalHistory.pop();
    const current = extractState(useAppStore.getState());
    pushBounded(globalFuture, current);
    globalHistoryLen = globalHistory.length;
    globalFutureLen = globalFuture.length;
    notifyListeners();
    useAppStore.setState(prev);
  }, []);

  const redo = useCallback(() => {
    if (globalFuture.length === 0) return;
    const next = globalFuture[globalFuture.length - 1];
    globalFuture.pop();
    const current = extractState(useAppStore.getState());
    pushBounded(globalHistory, current);
    globalHistoryLen = globalHistory.length;
    globalFutureLen = globalFuture.length;
    notifyListeners();
    useAppStore.setState(next);
  }, []);

  return {
    state,
    updateState,
    // Expose all store actions
    ...store,
    undo,
    redo,
    canUndo: globalHistoryLen > 0,
    canRedo: globalFutureLen > 0,
  };
}
