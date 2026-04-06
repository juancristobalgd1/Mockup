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
  { id: 'coral', label: 'Coral', css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
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

interface PresetState {
  deviceType: DeviceType;
  deviceLandscape: boolean;
  bgType: 'gradient' | 'mesh' | 'solid' | 'pattern' | 'image';
  bgColor: string;
  scale: number;
  rotation: number;
  shadowIntensity: number;
  is3D: boolean;
  tiltX: number;
  tiltY: number;
  animation: 'none' | 'float' | 'pulse' | 'spin' | 'slide-in';
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
      scale: 0.85,
      rotation: -5,
      shadowIntensity: 60,
      is3D: true,
      tiltX: -8,
      tiltY: 10,
      animation: 'float',
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
      scale: 0.8,
      rotation: 0,
      shadowIntensity: 80,
      is3D: true,
      tiltX: -5,
      tiltY: 0,
      animation: 'none',
    }
  },
  {
    id: 'product-hunt',
    label: 'Product Hunt',
    thumb: 'sunset',
    state: {
      deviceType: 'iphone',
      deviceLandscape: true,
      bgType: 'gradient',
      bgColor: 'sunset',
      scale: 0.75,
      rotation: 3,
      shadowIntensity: 70,
      is3D: false,
      tiltX: 0,
      tiltY: 0,
      animation: 'none',
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
      scale: 0.78,
      rotation: 0,
      shadowIntensity: 50,
      is3D: true,
      tiltX: -10,
      tiltY: 5,
      animation: 'none',
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
      scale: 0.9,
      rotation: 0,
      shadowIntensity: 65,
      is3D: false,
      tiltX: 0,
      tiltY: 0,
      animation: 'pulse',
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
      scale: 0.88,
      rotation: 8,
      shadowIntensity: 75,
      is3D: true,
      tiltX: -5,
      tiltY: -8,
      animation: 'float',
    }
  },
];
