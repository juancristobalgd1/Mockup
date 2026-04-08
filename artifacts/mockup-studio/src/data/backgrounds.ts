import type React from 'react';
import type { DeviceType } from '../store';

export interface BackgroundGradient {
  id: string;
  label: string;
  css: string;
}

export const GRADIENTS: BackgroundGradient[] = [
  { id: 'purple-blue', label: 'Blue Violet', css: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
  { id: 'fire', label: 'Fire', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'night', label: 'Night', css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'golden', label: 'Golden', css: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'candy', label: 'Candy', css: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
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
    css: `radial-gradient(at 40% 20%, #0ea5e9 0px, transparent 50%), radial-gradient(at 80% 0%, #06b6d4 0px, transparent 50%), radial-gradient(at 0% 50%, #ec4899 0px, transparent 50%), radial-gradient(at 80% 50%, #0284c7 0px, transparent 50%), radial-gradient(at 0% 100%, #0891b2 0px, transparent 50%), #03111e`
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
    css: `radial-gradient(at 30% 20%, #f43f5e 0px, transparent 50%), radial-gradient(at 75% 15%, #ec4899 0px, transparent 50%), radial-gradient(at 85% 65%, #f97316 0px, transparent 50%), radial-gradient(at 10% 75%, #e11d48 0px, transparent 50%), #1a080e`
  },
  {
    id: 'mesh-gold',
    label: 'Gold',
    css: `radial-gradient(at 25% 25%, #d97706 0px, transparent 50%), radial-gradient(at 75% 10%, #f59e0b 0px, transparent 50%), radial-gradient(at 80% 70%, #92400e 0px, transparent 50%), radial-gradient(at 15% 80%, #b45309 0px, transparent 50%), #1a1008`
  },
  {
    id: 'mesh-violet',
    label: 'Violet',
    css: `radial-gradient(at 20% 20%, #7c3aed 0px, transparent 50%), radial-gradient(at 80% 10%, #a855f7 0px, transparent 50%), radial-gradient(at 70% 70%, #6d28d9 0px, transparent 50%), radial-gradient(at 5% 75%, #8b5cf6 0px, transparent 50%), #0d0820`
  },
  {
    id: 'mesh-rose',
    label: 'Rose',
    css: `radial-gradient(at 35% 15%, #f43f5e 0px, transparent 50%), radial-gradient(at 80% 20%, #fb7185 0px, transparent 50%), radial-gradient(at 60% 75%, #e11d48 0px, transparent 50%), radial-gradient(at 10% 65%, #fda4af 0px, transparent 50%), radial-gradient(at 85% 80%, #be123c 0px, transparent 50%), #1a0510`
  },
  {
    id: 'mesh-midnight',
    label: 'Midnight',
    css: `radial-gradient(at 30% 30%, #1e3a5f 0px, transparent 55%), radial-gradient(at 75% 15%, #312e81 0px, transparent 50%), radial-gradient(at 85% 70%, #1e1b4b 0px, transparent 50%), radial-gradient(at 10% 80%, #0f172a 0px, transparent 50%), #020617`
  },
  {
    id: 'mesh-neon',
    label: 'Neon',
    css: `radial-gradient(at 25% 25%, #22d3ee 0px, transparent 50%), radial-gradient(at 75% 15%, #a3e635 0px, transparent 50%), radial-gradient(at 80% 70%, #06b6d4 0px, transparent 50%), radial-gradient(at 10% 70%, #4ade80 0px, transparent 50%), #030a0a`
  },
  {
    id: 'mesh-peach',
    label: 'Peach',
    css: `radial-gradient(at 30% 20%, #fb923c 0px, transparent 50%), radial-gradient(at 80% 10%, #fbbf24 0px, transparent 50%), radial-gradient(at 70% 70%, #f97316 0px, transparent 50%), radial-gradient(at 10% 75%, #fdba74 0px, transparent 50%), #1a0d05`
  },
  {
    id: 'mesh-mint',
    label: 'Mint',
    css: `radial-gradient(at 20% 25%, #34d399 0px, transparent 50%), radial-gradient(at 75% 10%, #6ee7b7 0px, transparent 50%), radial-gradient(at 80% 65%, #059669 0px, transparent 50%), radial-gradient(at 10% 75%, #10b981 0px, transparent 50%), #021a10`
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
  {
    id: 'cross',
    label: 'Cross',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundPosition: '-1px -1px',
    })
  },
  {
    id: 'dots-lg',
    label: 'Circles',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 3px, transparent 3px)',
      backgroundSize: '28px 28px',
    })
  },
  {
    id: 'checker',
    label: 'Checker',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    })
  },
  {
    id: 'zigzag',
    label: 'Zigzag',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.07) 25%, transparent 25%) -10px 0, linear-gradient(225deg, rgba(255,255,255,0.07) 25%, transparent 25%) -10px 0, linear-gradient(315deg, rgba(255,255,255,0.07) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%)`,
      backgroundSize: '20px 20px',
    })
  },
  {
    id: 'waves',
    label: 'Waves',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.06) 18px, rgba(255,255,255,0.06) 20px)`,
      backgroundSize: '100% 20px',
    })
  },
  {
    id: 'diamond',
    label: 'Diamond',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.08) 75%)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 12px 12px',
    })
  },
  {
    id: 'noise',
    label: 'Noise',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
      backgroundSize: '200px 200px',
    })
  },
  {
    id: 'hexagon',
    label: 'Hex',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle farthest-side at 0% 50%, transparent 23%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.07) 34%, transparent 35%), radial-gradient(circle farthest-side at 100% 50%, transparent 23%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.07) 34%, transparent 35%)`,
      backgroundSize: '30px 18px',
    })
  },
  {
    id: 'triangle',
    label: 'Triangles',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(60deg, rgba(255,255,255,0.07) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.07) 75%), linear-gradient(120deg, rgba(255,255,255,0.07) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.07) 75%)`,
      backgroundSize: '24px 42px',
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
    label: 'Sky Dusk',
    css: `radial-gradient(ellipse at 50% 60%, #e0f2fe 0%, #bae6fd 25%, #7dd3fc 50%, #0284c7 80%, #0c4a6e 100%)`,
    thumb: '#7dd3fc',
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
