import { useState, createContext, useContext } from "react";
import type { DeviceStoreType } from "./data/devices";

// DeviceType derives from DeviceStoreType in devices.ts — the single source of truth.
// When adding a new device category, update DeviceStoreType there; this stays in sync.
export type DeviceType = DeviceStoreType;
export type DeviceColor = "titanium" | "black" | "white" | "blue" | "naturallight" | "desert" | "sierra" | "clay";
export type BrowserMode = "dark" | "light";
export type BackgroundType = "none" | "solid" | "gradient" | "mesh" | "pattern" | "image" | "wallpaper" | "transparent";
export type ShadowStyle = "none" | "spread" | "hug";
export type CanvasRatio = "free" | "1:1" | "4:5" | "16:9" | "9:16" | "4:3" | "3:2" | "2:3" | "3:1" | "5:4";
export type ContentType = "image" | "video" | null;
export type CreationMode = "mockup" | "movie" | "screenshot";

export interface CameraKeyframe {
  id: string;
  time: number;
  position: [number, number, number];
  target: [number, number, number];
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
  bgOpacity: number;

  canvasRatio: CanvasRatio;
  canvasRadius: number;

  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;

  lightOverlay: string | null;
  lightOverlayOpacity: number;
  lightOverlayBlend: string;

  annotateMode: boolean;
  annotateTool: 'select' | 'pen' | 'marker' | 'eraser' | 'arrow' | 'rect' | 'text';
  annotateColor: string;
  annotateSize: 'S' | 'M' | 'L' | 'XL';
  annotateClearKey: number;

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
  bgOpacity: 100,

  canvasRatio: "free",
  canvasRadius: 0,

  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 30,

  lightOverlay: null,
  lightOverlayOpacity: 60,
  lightOverlayBlend: 'multiply',

  annotateMode: false,
  annotateTool: 'pen',
  annotateColor: '#ef4444',
  annotateSize: 'M',
  annotateClearKey: 0,

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

  texts: [],

  movieMode: false,
  movieDuration: 5,
  cameraKeyframes: [],

  creationMode: 'mockup',
};

interface AppContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  addText: () => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
  addCameraKeyframe: (kf: Omit<CameraKeyframe, 'id'>) => void;
  removeCameraKeyframe: (id: string) => void;
  clearCameraKeyframes: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
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

  const clearCameraKeyframes = () => {
    setState(prev => ({ ...prev, cameraKeyframes: [] }));
  };

  return (
    <AppContext.Provider value={{ state, updateState, addText, updateText, removeText, addCameraKeyframe, removeCameraKeyframe, clearCameraKeyframes }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
