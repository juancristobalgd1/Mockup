import { useState, useRef, createContext, useContext } from "react";
import type { DeviceStoreType } from "./data/devices";

// DeviceType derives from DeviceStoreType in devices.ts — the single source of truth.
// When adding a new device category, update DeviceStoreType there; this stays in sync.
export type DeviceType = DeviceStoreType;
export type DeviceColor = "titanium" | "black" | "white" | "blue" | "naturallight" | "desert" | "sierra" | "clay";
export type BrowserMode = "dark" | "light";
export type BackgroundType = "none" | "solid" | "gradient" | "mesh" | "pattern" | "image" | "wallpaper" | "transparent" | "animated";
export type ShadowStyle = "none" | "spread" | "hug";
export type CanvasRatio = "free" | "1:1" | "4:5" | "16:9" | "9:16" | "4:3" | "3:2" | "2:3" | "3:1" | "5:4";
export type ContentType = "image" | "video" | null;
export type CreationMode = "mockup" | "movie" | "screenshot";

export type EasingType = 'linear' | 'smooth' | 'ease-in' | 'ease-out' | 'elastic' | 'bounce';

export interface CameraKeyframe {
  id: string;
  time: number;
  position: [number, number, number];
  target: [number, number, number];
  easing?: EasingType;
  label?: string;
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
}

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
  bgPattern: string;
  bgAnimated: string;
  bgOpacity: number;

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
  cameraAngle: 'hero' | 'front' | 'side' | 'top' | 'tilt-right' | 'tilt-left' | 'low' | 'diagonal' | 'dramatic';
  cameraResetKey: number;

  deviceScale: number;
  reflection: boolean;
  reflectionOpacity: number;
  grain: boolean;
  grainIntensity: number;
  bloomIntensity: number;

  bgBlur: number;
  bgVignette: boolean;
  bgVignetteIntensity: number;
  grainBgOnly: boolean;

  texts: TextOverlay[];

  movieMode: boolean;
  movieDuration: number;
  cameraKeyframes: CameraKeyframe[];

  creationMode: CreationMode;
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

  bgType: "gradient",
  bgColor: "purple-blue",
  bgImage: null,
  bgPattern: "dots",
  bgAnimated: "3d-aura",
  bgOpacity: 100,

  canvasRatio: "free",
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
  envPreset: "warehouse",
  envEnabled: true,
  lightExposure: 1.0,
  lightBrightness: 40,
  lightAmbient: 45,
  lightWarmth: 0,
  lightIBL: 40,
  contactShadowOpacity: 65,
  cameraAngle: "hero",
  cameraResetKey: 0,

  deviceScale: 45,
  reflection: false,
  reflectionOpacity: 50,
  grain: false,
  grainIntensity: 35,
  bloomIntensity: 22,

  bgBlur: 0,
  bgVignette: false,
  bgVignetteIntensity: 50,
  grainBgOnly: false,

  texts: [],

  movieMode: false,
  movieDuration: 5,
  cameraKeyframes: [],

  creationMode: 'mockup',
};

interface AppContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>, skipHistory?: boolean) => void;
  addText: () => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
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

  const updateState = (updates: Partial<AppState>, skipHistory = false) => {
    setState(prev => {
      if (!skipHistory) {
        historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), prev];
        futureRef.current = [];
        setHistoryLen(historyRef.current.length);
        setFutureLen(0);
      }
      return { ...prev, ...updates };
    });
  };

  const undo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    setState(current => {
      futureRef.current = [current, ...futureRef.current.slice(0, MAX_HISTORY - 1)];
      setHistoryLen(historyRef.current.length);
      setFutureLen(futureRef.current.length);
      return prev;
    });
  };

  const redo = () => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    setState(current => {
      historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), current];
      setHistoryLen(historyRef.current.length);
      setFutureLen(futureRef.current.length);
      return next;
    });
  };

  const addText = () => {
    const newText: TextOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      text: "Double-click to edit",
      x: 50,
      y: 50,
      fontSize: 24,
      color: "#ffffff",
      isBold: false,
      isItalic: false
    };
    setState(prev => ({ ...prev, texts: [...prev.texts, newText] }));
  };

  const updateText = (id: string, updates: Partial<TextOverlay>) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const removeText = (id: string) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.id !== id)
    }));
  };

  const addCameraKeyframe = (kf: Omit<CameraKeyframe, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => {
      const existing = prev.cameraKeyframes.filter(k => Math.abs(k.time - kf.time) > 0.1);
      const updated = [...existing, { ...kf, id }].sort((a, b) => a.time - b.time);
      return { ...prev, cameraKeyframes: updated };
    });
  };

  const removeCameraKeyframe = (id: string) => {
    setState(prev => ({
      ...prev,
      cameraKeyframes: prev.cameraKeyframes.filter(k => k.id !== id)
    }));
  };

  const updateCameraKeyframe = (id: string, updates: Partial<Omit<CameraKeyframe, 'id'>>) => {
    setState(prev => ({
      ...prev,
      cameraKeyframes: prev.cameraKeyframes
        .map(k => k.id === id ? { ...k, ...updates } : k)
        .sort((a, b) => a.time - b.time),
    }));
  };

  const clearCameraKeyframes = () => {
    setState(prev => ({ ...prev, cameraKeyframes: [] }));
  };

  return (
    <AppContext.Provider value={{
      state, updateState,
      addText, updateText, removeText,
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
