import type React from 'react';
import type { DeviceType } from '../store';

export interface BackgroundGradient {
  id: string;
  label: string;
  css: string;
}

export const GRADIENTS: BackgroundGradient[] = [
  { id: 'purple-blue', label: 'Purple Blue', css: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
  { id: 'fire', label: 'Fire', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'night', label: 'Night', css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'golden', label: 'Golden', css: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'candy', label: 'Candy', css: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'coral', label: 'Coral', css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'dark-blue', label: 'Deep Sea', css: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' },
  { id: 'neon', label: 'Neon', css: 'linear-gradient(135deg, #08AEEA 0%, #2AF598 100%)' },
];

export interface MeshGradient {
  id: string;
  label: string;
  css: string;
}

export const MESH_GRADIENTS: MeshGradient[] = [
  {
    id: 'mesh-aurora',
    label: 'Aurora',
    css: `radial-gradient(at 40% 20%, #7c3aed 0px, transparent 50%), radial-gradient(at 80% 0%, #0ea5e9 0px, transparent 50%), radial-gradient(at 0% 50%, #ec4899 0px, transparent 50%), radial-gradient(at 80% 50%, #6d28d9 0px, transparent 50%), radial-gradient(at 0% 100%, #0891b2 0px, transparent 50%), #0f0a1e`
  },
  {
    id: 'mesh-forest',
    label: 'Forest',
    css: `radial-gradient(at 20% 30%, #059669 0px, transparent 50%), radial-gradient(at 70% 10%, #0891b2 0px, transparent 50%), radial-gradient(at 90% 70%, #16a34a 0px, transparent 50%), radial-gradient(at 10% 80%, #0d9488 0px, transparent 50%), #061a14`
  },
  {
    id: 'mesh-fire',
    label: 'Fire',
    css: `radial-gradient(at 30% 20%, #dc2626 0px, transparent 50%), radial-gradient(at 80% 10%, #ea580c 0px, transparent 50%), radial-gradient(at 60% 70%, #b91c1c 0px, transparent 50%), radial-gradient(at 10% 80%, #c2410c 0px, transparent 50%), #1a0808`
  },
  {
    id: 'mesh-ocean',
    label: 'Ocean',
    css: `radial-gradient(at 20% 20%, #0284c7 0px, transparent 50%), radial-gradient(at 70% 10%, #0891b2 0px, transparent 50%), radial-gradient(at 80% 60%, #1d4ed8 0px, transparent 50%), radial-gradient(at 5% 70%, #0369a1 0px, transparent 50%), #03111e`
  },
  {
    id: 'mesh-candy',
    label: 'Candy',
    css: `radial-gradient(at 30% 20%, #a855f7 0px, transparent 50%), radial-gradient(at 75% 15%, #ec4899 0px, transparent 50%), radial-gradient(at 85% 65%, #f43f5e 0px, transparent 50%), radial-gradient(at 10% 75%, #8b5cf6 0px, transparent 50%), #1a0b1e`
  },
  {
    id: 'mesh-gold',
    label: 'Gold',
    css: `radial-gradient(at 25% 25%, #d97706 0px, transparent 50%), radial-gradient(at 75% 10%, #f59e0b 0px, transparent 50%), radial-gradient(at 80% 70%, #92400e 0px, transparent 50%), radial-gradient(at 15% 80%, #b45309 0px, transparent 50%), #1a1008`
  },
];

export interface PatternOption {
  id: string;
  label: string;
  bgStyle: (color: string) => React.CSSProperties;
}

export const PATTERNS: PatternOption[] = [
  {
    id: 'dots',
    label: 'Dots',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    })
  },
  {
    id: 'grid',
    label: 'Grid',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    })
  },
  {
    id: 'lines',
    label: 'Lines',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 0, transparent 50%)',
      backgroundSize: '16px 16px',
    })
  },
];

export interface WallpaperOption {
  id: string;
  label: string;
  css: string;
  thumb: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'tahoe-light',
    label: 'Tahoe Light',
    css: `radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #93c5fd 30%, #60a5fa 60%, #dbeafe 100%)`,
    thumb: '#93c5fd',
  },
  {
    id: 'tahoe-dark',
    label: 'Tahoe Dark',
    css: `radial-gradient(ellipse at 40% 20%, #1e3a5f 0%, #0c1e3b 40%, #081022 70%, #0a1628 100%)`,
    thumb: '#1e3a5f',
  },
  {
    id: 'sunset-shore',
    label: 'Sunset Shore',
    css: `linear-gradient(180deg, #1a0533 0%, #6b21a8 25%, #c2410c 55%, #ea580c 75%, #fbbf24 90%, #fef3c7 100%)`,
    thumb: '#ea580c',
  },
  {
    id: 'pine-forest',
    label: 'Pine Forest',
    css: `radial-gradient(ellipse at 50% 100%, #052e16 0%, #14532d 40%, #166534 70%, #4ade80 100%)`,
    thumb: '#166534',
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    css: `linear-gradient(160deg, #7c2d12 0%, #c2410c 20%, #ea580c 40%, #f59e0b 65%, #fde68a 85%, #fff7ed 100%)`,
    thumb: '#f59e0b',
  },
  {
    id: 'arctic-ice',
    label: 'Arctic Ice',
    css: `radial-gradient(ellipse at 50% 30%, #f0f9ff 0%, #bae6fd 30%, #7dd3fc 55%, #0ea5e9 80%, #0284c7 100%)`,
    thumb: '#bae6fd',
  },
  {
    id: 'lava-field',
    label: 'Lava Field',
    css: `radial-gradient(ellipse at 30% 80%, #7f1d1d 0%, #991b1b 30%, #b91c1c 50%, #c2410c 70%, #1c0503 100%)`,
    thumb: '#991b1b',
  },
  {
    id: 'rose-bloom',
    label: 'Rose Bloom',
    css: `radial-gradient(ellipse at 60% 40%, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #ec4899 75%, #be185d 100%)`,
    thumb: '#f9a8d4',
  },
  {
    id: 'night-sky',
    label: 'Night Sky',
    css: `radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #312e81 20%, #1e3a5f 50%, #0f172a 80%, #020617 100%)`,
    thumb: '#312e81',
  },
  {
    id: 'citrus',
    label: 'Citrus',
    css: `linear-gradient(135deg, #fef9c3 0%, #fde047 25%, #facc15 50%, #eab308 75%, #ca8a04 100%)`,
    thumb: '#fde047',
  },
  {
    id: 'lavender',
    label: 'Lavender Fields',
    css: `radial-gradient(ellipse at 50% 60%, #ede9fe 0%, #ddd6fe 25%, #c4b5fd 50%, #7c3aed 80%, #4c1d95 100%)`,
    thumb: '#c4b5fd',
  },
  {
    id: 'sand-dunes',
    label: 'Sand Dunes',
    css: `linear-gradient(160deg, #fef3c7 0%, #fde68a 20%, #f59e0b 45%, #d97706 65%, #92400e 85%, #451a03 100%)`,
    thumb: '#f59e0b',
  },
];

interface PresetState {
  deviceType: DeviceType;
  deviceLandscape?: boolean;
  bgType: 'gradient' | 'mesh' | 'solid' | 'pattern' | 'image' | 'wallpaper';
  bgColor: string;
  animation: 'none' | 'float' | 'pulse' | 'spin' | 'slide-in';
  autoRotate?: boolean;
  envPreset?: 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night';
  contactShadowOpacity?: number;
}

export interface Preset {
  id: string;
  label: string;
  thumb: string;
  state: PresetState;
}

export const PRESETS: Preset[] = [
  {
    id: 'app-store',
    label: 'App Store',
    thumb: 'purple-blue',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'purple-blue',
      animation: 'float',
      envPreset: 'studio',
    }
  },
  {
    id: 'twitter-banner',
    label: 'Twitter Banner',
    thumb: 'night',
    state: {
      deviceType: 'browser',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'night',
      animation: 'none',
      envPreset: 'city',
      contactShadowOpacity: 80,
    }
  },
  {
    id: 'product-hunt',
    label: 'Product Hunt',
    thumb: 'sunset',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'sunset',
      animation: 'none',
      envPreset: 'sunset',
    }
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    thumb: 'mesh-ocean',
    state: {
      deviceType: 'macbook',
      deviceLandscape: false,
      bgType: 'mesh',
      bgColor: 'mesh-ocean',
      animation: 'none',
      envPreset: 'warehouse',
      contactShadowOpacity: 50,
    }
  },
  {
    id: 'instagram-story',
    label: 'Instagram',
    thumb: 'fire',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'fire',
      animation: 'float',
      envPreset: 'studio',
    }
  },
  {
    id: 'dark-showcase',
    label: 'Dark Mode',
    thumb: 'mesh-aurora',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'mesh',
      bgColor: 'mesh-aurora',
      animation: 'float',
      envPreset: 'night',
      contactShadowOpacity: 75,
    }
  },
  {
    id: 'night-city',
    label: 'Night City',
    thumb: 'night-sky',
    state: {
      deviceType: 'iphone',
      bgType: 'wallpaper',
      bgColor: 'night-sky',
      animation: 'float',
      envPreset: 'night',
      contactShadowOpacity: 80,
    }
  },
];
