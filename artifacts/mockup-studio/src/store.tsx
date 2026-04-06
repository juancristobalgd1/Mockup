import { useState, createContext, useContext } from "react";

export type DeviceType = "iphone" | "android" | "ipad" | "macbook" | "browser" | "watch";
export type BackgroundType = "solid" | "gradient" | "mesh" | "pattern" | "image";

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
  deviceType: DeviceType;
  deviceLandscape: boolean;
  screenshotUrl: string | null;
  
  bgType: BackgroundType;
  bgColor: string; // Used for solid and gradient (as preset ID)
  bgImage: string | null;
  bgPattern: string;

  scale: number;
  rotation: number;
  shadowIntensity: number;
  borderRadius: number;

  is3D: boolean;
  tiltX: number;
  tiltY: number;

  animation: "none" | "float" | "spin" | "pulse" | "slide-in";

  texts: TextOverlay[];
}

export const defaultState: AppState = {
  deviceType: "iphone",
  deviceLandscape: false,
  screenshotUrl: null,
  
  bgType: "gradient",
  bgColor: "purple-blue",
  bgImage: null,
  bgPattern: "dots",

  scale: 0.85,
  rotation: -5,
  shadowIntensity: 65,
  borderRadius: 32,

  is3D: true,
  tiltX: -8,
  tiltY: 10,

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
      text: "Double click to edit",
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
