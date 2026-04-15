import { useState, useRef, createContext, useContext, useCallback } from "react";
import type { DeviceStoreType } from "./data/devices";

// DeviceType derives from DeviceStoreType in devices.ts — the single source of truth.
// When adding a new device category, update DeviceStoreType there; this stays in sync.
export type DeviceType = DeviceStoreType;
export type DeviceColor = "original" | "titanium" | "black" | "white" | "blue" | "naturallight" | "desert" | "sierra" | "clay" | (string & {});
export type BrowserMode = "dark" | "light";
export type BackgroundType = "none" | "solid" | "gradient" | "mesh" | "pattern" | "image" | "video" | "wallpaper" | "transparent" | "animated";
export type ShadowStyle = "none" | "spread" | "hug";
export type CanvasRatio = "free" | "1:1" | "4:5" | "16:9" | "9:16" | "4:3" | "3:2" | "2:3" | "3:1" | "5:4";
export type ContentType = "image" | "video" | null;
export type CreationMode = "mockup" | "movie" | "screenshot";
export type InteractionMode = 'none' | 'drag' | 'zoom';

export type EasingType = 'linear' | 'smooth' | 'ease-in' | 'ease-out' | 'elastic' | 'bounce';

export interface CameraKeyframe {
  id: string;
  time: number;
  position: [number, number, number];
  target: [number, number, number];
  easing?: EasingType;
  label?: string;
  sceneId?: string;
  sceneLabel?: string;
  sceneSource?: 'recording' | 'preset' | 'manual';
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  kind?: 'text' | 'label';
  labelAnchor?: LabelAnchorPosition;
  labelMode?: LabelTrackingMode;
  levitation?: number;
  fontFamily?: string;
}

export type LabelAnchorPosition = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left';
export type LabelTrackingMode = 'follow' | 'billboard' | 'fixed';

export type EnvPreset = 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night';

// ── Annotation stroke types ──────────────────────────────────────────
export type AnnotatePoint = { x: number; y: number };

export interface AnnotateFreeStroke {
  id: string;
  kind: 'free';
  tool: 'pen' | 'marker' | 'eraser';
  color: string;
  lineWidth: number;
  opacity: number;
  points: AnnotatePoint[];
}

export type AnnotateShapeTool = 'arrow' | 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'spiral' | 'wave';

export interface AnnotateShapeStroke {
  id: string;
  kind: 'shape';
  tool: AnnotateShapeTool;
  color: string;
  lineWidth: number;
  opacity?: number;
  start: AnnotatePoint;
  end: AnnotatePoint;
}

export interface AnnotateTextStroke {
  id: string;
  kind: 'text';
  color: string;
  fontSize: number;
  opacity?: number;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  text: string;
  position: AnnotatePoint;
}

export type AnyAnnotateStroke = AnnotateFreeStroke | AnnotateShapeStroke | AnnotateTextStroke;

export interface AppState {
  deviceModel: string;
  deviceType: DeviceType;
  deviceLandscape: boolean;
  deviceColor: DeviceColor;
  browserMode: BrowserMode;

  screenshotUrl: string | null;
  videoUrl: string | null;
  contentType: ContentType;

  bgType: BackgroundType;
  bgColor: string;
  bgImage: string | null;
  bgVideo: string | null;
  bgPattern: string;
  bgPattern: string;
  bgAnimated: string;
  bgOpacity: number;
  showBgSettings?: boolean;

  canvasRatio: CanvasRatio;
  canvasRadius: number;

  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;

  lightOverlay: string | null;
  lightOverlayOpacity: number;
  lightOverlayBlend: string;
  lightOverlayBgOnly: boolean;

  annotateMode: boolean;
  annotateTool: 'select' | 'pen' | 'marker' | 'eraser' | 'arrow' | 'rect' | 'text';
  annotateColor: string;
  annotateSize: 'S' | 'M' | 'L' | 'XL';
  annotateOpacity: number;
  annotateShape: 'arrow' | 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'spiral' | 'wave';
  annotateLineWidth: number;
  annotateClearKey: number;
  annotateStrokes: AnyAnnotateStroke[];

  animation: "none" | "float" | "spin" | "pulse" | "slide-in";
  autoRotate: boolean;
  autoRotateSpeed: number;
  envPreset: EnvPreset;
  envEnabled: boolean;
  lightExposure: number;
  lightBrightness: number;
  lightAmbient: number;
  lightWarmth: number;
  lightIBL: number;
  contactShadowOpacity: number;
  contactShadowDirection?: 'abajo' | 'atras' | 'izquierda' | 'derecha';
  cameraAngle: 'hero' | 'front' | 'side' | 'top' | 'tilt-right' | 'tilt-left' | 'low' | 'diagonal' | 'dramatic';
  cameraResetKey: number;

  deviceScale: number;
  scale?: number; // fallback for some legacy CSS views
  rotation?: number;
  canvasPadding?: number;
  labelTabActive?: 'positions' | 'behavior' | 'style';
  reflection: boolean;
  reflectionOpacity: number;
  glassReflection: boolean;
  grain: boolean;
  grainIntensity: number;
  bloomIntensity: number;

  bgBlur: number;
  bgVignette: boolean;
  bgVignetteIntensity: number;
  grainBgOnly: boolean;

  texts: TextOverlay[];
  labelDraftMode: LabelTrackingMode;
  labelDraftSize: number;
  labelDraftLevitation: number;
  labelDraftColor: string;
  labelDraftFont: string;

  movieMode: boolean;
  movieDuration: number;
  movieCurveTension: number;
  cameraKeyframes: CameraKeyframe[];

  // DSLR camera lens simulation
  dofEnabled: boolean;
  dofFocusDistance: number;   // 0-1 normalised
  dofFocalLength: number;     // 0-1 normalised
  dofBokehScale: number;      // 0-20
  dofFocus: number;           // Focus distance in meters
  dofAperture: number;        // Lens aperture (normalized)

  // Clay mode
  clayMode: boolean;
  clayColor: string;

  // Audio
  audioUrl: string | null;
  audioVolume: number;        // 0-100

  creationMode: CreationMode;
  showGrid?: boolean;
  activeLabelId: string | null;
  deviceSubTab: 'models' | 'colors' | 'orientation' | 'browser-theme';
  sceneSubTab: 'estudio' | 'luz' | 'camera' | 'motion' | 'effects' | 'shadow';
  labelsSubTab: 'view' | 'add' | 'subtract';
  interactionMode: InteractionMode;
  zoomValue: number;
  canvasPanX: number;
  canvasPanY: number;
}

export const defaultState: AppState = {
  deviceModel: "iphone-16-pro",
  deviceType: "iphone",
  deviceLandscape: false,
  deviceColor: "titanium",
  browserMode: "dark",

  screenshotUrl: null,
  videoUrl: null,
  contentType: null,

  bgType: "solid",
  bgColor: "#ffffff",
  bgImage: null,
  bgVideo: null,
  bgPattern: "dots",
  bgAnimated: "3d-aura",
  bgOpacity: 100,
  showBgSettings: false,
  deviceSubTab: 'models',
  sceneSubTab: 'estudio',
  labelsSubTab: 'view',

  canvasRatio: "1:1",
  canvasRadius: 0,

  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 30,

  lightOverlay: null,
  lightOverlayOpacity: 60,
  lightOverlayBlend: 'multiply',
  lightOverlayBgOnly: false,

  annotateMode: false,
  annotateTool: 'pen',
  annotateColor: '#ef4444',
  annotateSize: 'M',
  annotateOpacity: 1,
  annotateShape: 'rect',
  annotateLineWidth: 5,
  annotateClearKey: 0,
  annotateStrokes: [],

  animation: "float",
  autoRotate: false,
  autoRotateSpeed: 1.5,
  envPreset: "studio",
  envEnabled: true,
  lightExposure: 1.0,
  lightBrightness: 40,
  lightAmbient: 45,
  lightWarmth: 0,
  lightIBL: 40,
  contactShadowOpacity: 65,
  contactShadowDirection: 'atras',
  cameraAngle: "hero",
  cameraResetKey: 0,

  deviceScale: 45,
  reflection: false,
  reflectionOpacity: 50,
  glassReflection: true,
  grain: false,
  grainIntensity: 35,
  bloomIntensity: 22,

  bgBlur: 0,
  bgVignette: false,
  bgVignetteIntensity: 50,
  grainBgOnly: false,

  texts: [],
  labelDraftMode: 'follow',
  labelDraftSize: 13,
  labelDraftLevitation: 16,
  labelDraftColor: '#ffffff',
  labelDraftFont: 'Inter',

  movieMode: false,
  movieDuration: 5,
  movieCurveTension: 0.45,
  cameraKeyframes: [],

  dofEnabled: false,
  dofFocusDistance: 0.02,
  dofFocalLength: 0.05,
  dofBokehScale: 6,
  dofFocus: 10,
  dofAperture: 0.02,

  clayMode: false,
  clayColor: '#e8ddd3',

  audioUrl: null,
  audioVolume: 80,

  creationMode: 'mockup',
  activeLabelId: null,
  interactionMode: 'none',
  zoomValue: 58,
  canvasPanX: 0,
  canvasPanY: 0,
};

interface AppContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>, skipHistory?: boolean) => void;
  addText: () => void;
  addLabel: (anchor: LabelAnchorPosition) => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
  clearLabels: () => void;
  addCameraKeyframe: (kf: Omit<CameraKeyframe, 'id'>) => void;
  removeCameraKeyframe: (id: string) => void;
  updateCameraKeyframe: (id: string, updates: Partial<Omit<CameraKeyframe, 'id'>>) => void;
  clearCameraKeyframes: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const MAX_HISTORY = 50;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const historyRef = useRef<AppState[]>([]);
  const futureRef = useRef<AppState[]>([]);
  const [historyLen, setHistoryLen] = useState(0);
  const [futureLen, setFutureLen] = useState(0);

  const updateState = useCallback((updates: Partial<AppState>, skipHistory = false) => {
    setState(prev => {
      if (!skipHistory) {
        historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), prev];
        futureRef.current = [];
        setHistoryLen(historyRef.current.length);
        setFutureLen(0);
      }
      return { ...prev, ...updates };
    });
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setState(current => {
      futureRef.current = [current, ...futureRef.current.slice(0, MAX_HISTORY - 1)];
      setHistoryLen(historyRef.current.length);
      setFutureLen(futureRef.current.length);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    setState(current => {
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), current];
      setHistoryLen(historyRef.current.length);
      setFutureLen(futureRef.current.length);
      return next;
    });
  }, []);

  const addText = useCallback(() => {
    const newText: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: "Double-click to edit",
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#ffffff",
      isBold: false,
      isItalic: false,
      kind: 'text',
    };
    setState(prev => ({ ...prev, texts: [...prev.texts, newText] }));
  }, []);

  const addLabel = useCallback((anchor: LabelAnchorPosition) => {
    setState(prev => {
      const fixedPositions: Record<LabelAnchorPosition, { x: number; y: number }> = {
        'top': { x: 50, y: 16 },
        'top-right': { x: 78, y: 20 },
        'right': { x: 84, y: 50 },
        'bottom-right': { x: 78, y: 80 },
        'bottom': { x: 50, y: 84 },
        'bottom-left': { x: 22, y: 80 },
        'left': { x: 16, y: 50 },
        'top-left': { x: 22, y: 20 },
      };
      const fixedPosition = fixedPositions[anchor];
      const newLabel: TextOverlay = {
        id: Math.random().toString(36).substr(2, 9),
        text: 'New label',
        x: prev.labelDraftMode === 'fixed' ? fixedPosition.x : 50,
        y: prev.labelDraftMode === 'fixed' ? fixedPosition.y : 50,
        fontSize: prev.labelDraftSize,
        color: prev.labelDraftColor,
        isBold: true,
        isItalic: false,
        kind: 'label',
        labelAnchor: anchor,
        labelMode: prev.labelDraftMode,
        levitation: prev.labelDraftLevitation,
        fontFamily: prev.labelDraftFont,
      };
      return { 
        ...prev, 
        texts: [...prev.texts, newLabel],
        activeLabelId: newLabel.id
      };
    });
  }, []);

  const updateText = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  }, []);

  const removeText = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.id !== id)
    }));
  }, []);

  const clearLabels = useCallback(() => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.kind !== 'label')
    }));
  }, []);

  const addCameraKeyframe = useCallback((kf: Omit<CameraKeyframe, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => {
      const existing = prev.cameraKeyframes.filter(k => Math.abs(k.time - kf.time) > 0.1);
      const updated = [...existing, { ...kf, id }].sort((a, b) => a.time - b.time);
      return { ...prev, cameraKeyframes: updated };
    });
  }, []);

  const removeCameraKeyframe = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      cameraKeyframes: prev.cameraKeyframes.filter(k => k.id !== id)
    }));
  }, []);

  const updateCameraKeyframe = useCallback((id: string, updates: Partial<Omit<CameraKeyframe, 'id'>>) => {
    setState(prev => ({
      ...prev,
      cameraKeyframes: prev.cameraKeyframes
        .map(k => k.id === id ? { ...k, ...updates } : k)
        .sort((a, b) => a.time - b.time),
    }));
  }, []);

  const clearCameraKeyframes = useCallback(() => {
    setState(prev => ({ ...prev, cameraKeyframes: [] }));
  }, []);

  return (
    <AppContext.Provider value={{
      state, updateState,
      addText, addLabel, updateText, removeText, clearLabels,
      addCameraKeyframe, removeCameraKeyframe, updateCameraKeyframe, clearCameraKeyframes,
      undo, redo,
      canUndo: historyLen > 0,
      canRedo: futureLen > 0,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
