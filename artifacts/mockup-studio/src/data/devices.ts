export type DeviceGroup = 'iPhone' | 'Android' | 'Tablet' | 'Desktop' | 'Browser' | 'Watch';

export interface DeviceModelDef {
  id: string;
  label: string;
  group: DeviceGroup;
  storeType: 'iphone' | 'android' | 'ipad' | 'macbook' | 'browser' | 'watch' | 'imac';
  /** Display dimensions in CSS px (portrait, unscaled) */
  w: number;
  h: number;
  /** Screen inset inside the frame (px) */
  insetTop: number;
  insetBottom: number;
  insetSide: number;
  /** Border radius of device body (rem string or px number) */
  br: string;
  /** Border radius of screen inner corners */
  screenBr: string;
  /** Camera style inside screen */
  camera: 'dynamic-island' | 'punch-hole' | 'notch' | 'none';
  /** Frame material style */
  frame: 'titanium' | 'aluminum' | 'glass' | 'light';
  /** Whether device supports color variants */
  hasColors?: boolean;
  /** Whether device supports orientation */
  hasOrientation?: boolean;
  /** Thumbnail accent color for picker */
  accent: string;
}

export const DEVICE_MODELS: DeviceModelDef[] = [
  // ── iPhone ────────────────────────────────────────────────────────
  {
    id: 'iphone-15-pro-max',
    label: 'iPhone 15 Pro Max',
    group: 'iPhone',
    storeType: 'iphone',
    w: 215, h: 466,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '2.8rem', screenBr: '2.3rem',
    camera: 'dynamic-island',
    frame: 'titanium',
    hasColors: true, hasOrientation: true,
    accent: '#9ca3af',
  },
  {
    id: 'iphone-15-pro',
    label: 'iPhone 15 Pro',
    group: 'iPhone',
    storeType: 'iphone',
    w: 196, h: 425,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '2.6rem', screenBr: '2.1rem',
    camera: 'dynamic-island',
    frame: 'titanium',
    hasColors: true, hasOrientation: true,
    accent: '#a8a29e',
  },
  {
    id: 'iphone-15',
    label: 'iPhone 15',
    group: 'iPhone',
    storeType: 'iphone',
    w: 196, h: 425,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '2.6rem', screenBr: '2.1rem',
    camera: 'dynamic-island',
    frame: 'aluminum',
    hasColors: true, hasOrientation: true,
    accent: '#60a5fa',
  },
  {
    id: 'iphone-14-pro',
    label: 'iPhone 14 Pro',
    group: 'iPhone',
    storeType: 'iphone',
    w: 194, h: 420,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '2.5rem', screenBr: '2.0rem',
    camera: 'dynamic-island',
    frame: 'titanium',
    hasColors: true, hasOrientation: true,
    accent: '#854d0e',
  },
  {
    id: 'iphone-13',
    label: 'iPhone 13',
    group: 'iPhone',
    storeType: 'iphone',
    w: 192, h: 416,
    insetTop: 14, insetBottom: 14, insetSide: 14,
    br: '2.4rem', screenBr: '1.9rem',
    camera: 'notch',
    frame: 'aluminum',
    hasColors: true, hasOrientation: true,
    accent: '#6b7280',
  },
  // ── Android ───────────────────────────────────────────────────────
  {
    id: 'samsung-s24-ultra',
    label: 'Galaxy S24 Ultra',
    group: 'Android',
    storeType: 'android',
    w: 210, h: 456,
    insetTop: 10, insetBottom: 10, insetSide: 10,
    br: '1.6rem', screenBr: '1.2rem',
    camera: 'punch-hole',
    frame: 'titanium',
    hasOrientation: true,
    accent: '#475569',
  },
  {
    id: 'samsung-s24',
    label: 'Galaxy S24',
    group: 'Android',
    storeType: 'android',
    w: 188, h: 408,
    insetTop: 10, insetBottom: 10, insetSide: 10,
    br: '1.8rem', screenBr: '1.4rem',
    camera: 'punch-hole',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#1e40af',
  },
  {
    id: 'pixel-8-pro',
    label: 'Pixel 8 Pro',
    group: 'Android',
    storeType: 'android',
    w: 204, h: 455,
    insetTop: 11, insetBottom: 11, insetSide: 11,
    br: '2.0rem', screenBr: '1.6rem',
    camera: 'punch-hole',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#065f46',
  },
  {
    id: 'oneplus-12',
    label: 'OnePlus 12',
    group: 'Android',
    storeType: 'android',
    w: 198, h: 432,
    insetTop: 10, insetBottom: 10, insetSide: 10,
    br: '1.9rem', screenBr: '1.5rem',
    camera: 'punch-hole',
    frame: 'glass',
    hasOrientation: true,
    accent: '#7c3aed',
  },
  // ── Tablet ────────────────────────────────────────────────────────
  {
    id: 'ipad-pro-12',
    label: 'iPad Pro 12.9"',
    group: 'Tablet',
    storeType: 'ipad',
    w: 320, h: 426,
    insetTop: 28, insetBottom: 36, insetSide: 24,
    br: '1.4rem', screenBr: '0.7rem',
    camera: 'none',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#94a3b8',
  },
  {
    id: 'ipad-pro-11',
    label: 'iPad Pro 11"',
    group: 'Tablet',
    storeType: 'ipad',
    w: 264, h: 377,
    insetTop: 24, insetBottom: 32, insetSide: 20,
    br: '1.2rem', screenBr: '0.6rem',
    camera: 'none',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#64748b',
  },
  {
    id: 'ipad-mini',
    label: 'iPad Mini',
    group: 'Tablet',
    storeType: 'ipad',
    w: 228, h: 348,
    insetTop: 28, insetBottom: 36, insetSide: 18,
    br: '1.3rem', screenBr: '0.5rem',
    camera: 'none',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#f59e0b',
  },
  // ── Desktop ───────────────────────────────────────────────────────
  {
    id: 'macbook-pro-16',
    label: 'MacBook Pro 16"',
    group: 'Desktop',
    storeType: 'macbook',
    w: 560, h: 360,
    insetTop: 14, insetBottom: 10, insetSide: 18,
    br: '0.75rem', screenBr: '0.4rem',
    camera: 'none',
    frame: 'aluminum',
    accent: '#6b7280',
  },
  {
    id: 'macbook-air',
    label: 'MacBook Air M2',
    group: 'Desktop',
    storeType: 'macbook',
    w: 520, h: 336,
    insetTop: 14, insetBottom: 10, insetSide: 18,
    br: '0.6rem', screenBr: '0.35rem',
    camera: 'none',
    frame: 'aluminum',
    accent: '#e5c07b',
  },
  {
    id: 'imac-27',
    label: 'iMac 27"',
    group: 'Desktop',
    storeType: 'imac',
    w: 460, h: 300,
    insetTop: 16, insetBottom: 30, insetSide: 10,
    br: '1rem', screenBr: '0.4rem',
    camera: 'none',
    frame: 'light',
    accent: '#93c5fd',
  },
  // ── Browser ───────────────────────────────────────────────────────
  {
    id: 'browser-dark',
    label: 'Browser Dark',
    group: 'Browser',
    storeType: 'browser',
    w: 540, h: 360,
    insetTop: 46, insetBottom: 0, insetSide: 0,
    br: '0.625rem', screenBr: '0',
    camera: 'none',
    frame: 'glass',
    accent: '#374151',
  },
  {
    id: 'browser-light',
    label: 'Browser Light',
    group: 'Browser',
    storeType: 'browser',
    w: 540, h: 360,
    insetTop: 46, insetBottom: 0, insetSide: 0,
    br: '0.625rem', screenBr: '0',
    camera: 'none',
    frame: 'light',
    accent: '#d1d5db',
  },
  // ── Watch ─────────────────────────────────────────────────────────
  {
    id: 'apple-watch-ultra',
    label: 'Watch Ultra 2',
    group: 'Watch',
    storeType: 'watch',
    w: 185, h: 222,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '35%', screenBr: '28%',
    camera: 'none',
    frame: 'titanium',
    accent: '#f97316',
  },
  {
    id: 'apple-watch-s9',
    label: 'Watch Series 9',
    group: 'Watch',
    storeType: 'watch',
    w: 175, h: 210,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '36%', screenBr: '30%',
    camera: 'none',
    frame: 'aluminum',
    accent: '#e11d48',
  },
];

export const DEVICE_GROUPS: DeviceGroup[] = ['iPhone', 'Android', 'Tablet', 'Desktop', 'Browser', 'Watch'];

export const GROUP_ICONS: Record<DeviceGroup, string> = {
  iPhone: '📱',
  Android: '🤖',
  Tablet: '⬛',
  Desktop: '💻',
  Browser: '🌐',
  Watch: '⌚',
};

export function getModelById(id: string): DeviceModelDef {
  return DEVICE_MODELS.find(m => m.id === id) ?? DEVICE_MODELS[1];
}

export function getModelsInGroup(group: DeviceGroup): DeviceModelDef[] {
  return DEVICE_MODELS.filter(m => m.group === group);
}

export const DEFAULT_MODEL_ID = 'iphone-15-pro';
