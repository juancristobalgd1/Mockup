export type DeviceGroup = 'iPhone' | 'Android' | 'Tablet' | 'Desktop' | 'Browser' | 'Watch';

/** Back camera layout configuration */
export type CameraLayout =
  | 'triple-tri'    // iPhone Pro: triangular arrangement
  | 'triple-bar'    // Pixel: full-width camera bar
  | 'triple-round'  // OnePlus: large circular module
  | 'dual-v'        // iPhone base / older models
  | 'dual-diag'     // Diagonal dual (iPhone 13 style)
  | 'quad-samsung'  // Samsung Ultra: 4 lenses in rectangle module
  | 'none';

export interface DeviceModelDef {
  id: string;
  label: string;
  group: DeviceGroup;
  storeType: 'iphone' | 'android' | 'ipad' | 'macbook' | 'browser' | 'watch';
  /** Display dimensions in CSS px (portrait, unscaled) */
  w: number;
  h: number;
  /** Screen inset inside the frame (px) */
  insetTop: number;
  insetBottom: number;
  insetSide: number;
  /** Border radius of device body */
  br: string;
  /** Border radius of screen inner corners */
  screenBr: string;
  /** Front camera / notch style */
  camera: 'dynamic-island' | 'punch-hole' | 'notch' | 'none';
  /** Back camera arrangement */
  cameraLayout: CameraLayout;
  /** Frame material style */
  frame: 'titanium' | 'aluminum' | 'glass' | 'light';
  /** Extra hardware features */
  hasActionButton?: boolean;    // iPhone 15 Pro+, 16+
  hasCameraControl?: boolean;   // iPhone 16+
  hasSPen?: boolean;            // Samsung Ultra
  hasColors?: boolean;
  hasOrientation?: boolean;
  /** Thumbnail accent color for picker */
  accent: string;
  /** If set, uses a real GLB model instead of procedural geometry */
  glbUrl?: string;
  /**
   * Set to true when the GLB is exported with the screen facing -Z (away from
   * the default camera). The loader will rotate the model 180° around Y so the
   * screen faces the camera correctly.
   */
  screenFacesBack?: boolean;
  /**
   * Set to true to skip the flat overlay plane entirely.
   * Use for laptops / angled screens where the texture is applied directly to
   * the detected screen mesh instead.
   */
  skipOverlay?: boolean;
}

export const DEVICE_MODELS: DeviceModelDef[] = [
  // ── iPhone (GLB real models only) ─────────────────────────────────
  {
    id: 'iphone-17-pro',
    label: 'iPhone 17 Pro',
    group: 'iPhone',
    storeType: 'iphone',
    w: 197, h: 428,
    insetTop: 11, insetBottom: 11, insetSide: 9,
    br: '2.7rem', screenBr: '2.2rem',
    camera: 'dynamic-island',
    cameraLayout: 'triple-tri',
    frame: 'titanium',
    hasActionButton: true, hasCameraControl: true,
    hasColors: true, hasOrientation: true,
    accent: '#a8a29e',
    glbUrl: '/models/iphone17pro.glb',
  },
  {
    id: 'iphone-16',
    label: 'iPhone 16',
    group: 'iPhone',
    storeType: 'iphone',
    w: 196, h: 424,
    insetTop: 11, insetBottom: 11, insetSide: 9,
    br: '2.6rem', screenBr: '2.1rem',
    camera: 'dynamic-island',
    cameraLayout: 'dual-v',
    frame: 'aluminum',
    hasActionButton: true, hasCameraControl: true,
    hasColors: true, hasOrientation: true,
    accent: '#38bdf8',
    glbUrl: '/models/iphone16.glb',
  },
  // ── Android ───────────────────────────────────────────────────────
  {
    id: 'samsung-s25-ultra',
    label: 'Galaxy S25 Ultra',
    group: 'Android',
    storeType: 'android',
    w: 206, h: 446,
    insetTop: 10, insetBottom: 10, insetSide: 8,
    br: '1.6rem', screenBr: '1.2rem',
    camera: 'punch-hole',
    cameraLayout: 'quad-samsung',
    frame: 'titanium',
    hasSPen: true,
    hasColors: true, hasOrientation: true,
    accent: '#475569',
    glbUrl: '/models/samsungs25ultra.glb',
    skipOverlay: true,
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
    cameraLayout: 'triple-round',
    frame: 'glass',
    hasOrientation: true,
    accent: '#c084fc',
  },
  // ── Tablet ────────────────────────────────────────────────────────
  {
    id: 'ipad-pro-12',
    label: 'iPad Pro 12.9"',
    group: 'Tablet',
    storeType: 'ipad',
    w: 320, h: 426,
    insetTop: 28, insetBottom: 28, insetSide: 24,
    br: '1.4rem', screenBr: '0.7rem',
    camera: 'none',
    cameraLayout: 'none',
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
    insetTop: 24, insetBottom: 24, insetSide: 20,
    br: '1.2rem', screenBr: '0.6rem',
    camera: 'none',
    cameraLayout: 'none',
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
    cameraLayout: 'none',
    frame: 'aluminum',
    hasOrientation: true,
    accent: '#f59e0b',
  },
  // ── Desktop ───────────────────────────────────────────────────────
  {
    id: 'macbook-pro',
    label: 'MacBook Pro',
    group: 'Desktop',
    storeType: 'macbook',
    w: 560, h: 350,
    insetTop: 10, insetBottom: 8, insetSide: 12,
    br: '0.75rem', screenBr: '0.3rem',
    camera: 'none',
    cameraLayout: 'none',
    frame: 'aluminum',
    accent: '#6b7280',
    glbUrl: '/models/macbookpro.glb',
    skipOverlay: true,
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
    cameraLayout: 'none',
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
    cameraLayout: 'none',
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
    cameraLayout: 'none',
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
    cameraLayout: 'none',
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
  return DEVICE_MODELS.find(m => m.id === id) ?? DEVICE_MODELS[0];
}

export function getModelsInGroup(group: DeviceGroup): DeviceModelDef[] {
  return DEVICE_MODELS.filter(m => m.group === group);
}

export const DEFAULT_MODEL_ID = 'iphone-17-pro';
