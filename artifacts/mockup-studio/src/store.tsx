import { useState, createContext, useContext } from "react";

export type DeviceType = "iphone" | "android" | "ipad" | "macbook" | "browser" | "watch" | "imac";
export type DeviceColor = "titanium" | "black" | "white" | "blue";
export type BrowserMode = "dark" | "light";
export type BackgroundType = "solid" | "gradient" | "mesh" | "pattern" | "image" | "wallpaper";
export type ShadowStyle = "none" | "spread" | "hug";
export type CanvasRatio = "free" | "1:1" | "4:5" | "16:9" | "9:16";
export type ContentType = "image" | "video" | null;

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

  scale: number;
  rotation: number;
  borderRadius: number;

  shadowStyle: ShadowStyle;
  shadowIntensity: number;
  shadowDirection: number;

  canvasPadding: number;
  canvasRatio: CanvasRatio;

  is3D: boolean;
  tiltX: number;
  tiltY: number;

  overlayEnabled: boolean;
  overlayColor: string;
  overlayOpacity: number;

  animation: "none" | "float" | "spin" | "pulse" | "slide-in";

  texts: TextOverlay[];
}

export const defaultState: AppState = {
  deviceModel: "iphone-15-pro",
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

  scale: 0.85,
  rotation: -5,
  borderRadius: 44,

  shadowStyle: "spread",
  shadowIntensity: 65,
  shadowDirection: 180,

  canvasPadding: 0,
  canvasRatio: "free",

  is3D: true,
  tiltX: -8,
  tiltY: 10,

  overlayEnabled: false,
  overlayColor: "#000000",
  overlayOpacity: 30,

  animation: "float",

  texts: []
};

interface AppContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  addText: () => void;
  updateText: (id: string, updates: Partial<TextOverlay>) => void;
  removeText: (id: string) => void;
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

  return (
    <AppContext.Provider value={{ state, updateState, addText, updateText, removeText }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
