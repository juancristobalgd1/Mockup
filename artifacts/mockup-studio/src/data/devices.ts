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

/** All possible device store/category types. This is the single source of truth.
 *  Import this type wherever DeviceType is needed (e.g. store.tsx). */
export type DeviceStoreType = 'iphone' | 'android' | 'ipad' | 'macbook' | 'browser' | 'watch';

export interface DeviceModelDef {
  id: string;
  label: string;
  group: DeviceGroup;
  storeType: DeviceStoreType;
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
   * Optional Z-axis rotation (radians) applied to the GLB model before
   * computing scale/position. Use for models exported in landscape orientation
   * that need to be rotated into portrait (e.g. Math.PI / 2).
   */
  glbRotateZ?: number;
  /**
   * Optional X-axis rotation (radians) applied to the GLB model before
   * computing scale/position. Use for models where the "up" axis is Z
   * (e.g. Apple Watch exported Z-up, needing -Math.PI/2 to face camera).
   */
  glbRotateX?: number;
  /**
   * Set to true to skip the flat overlay plane entirely.
   * Use for laptops / angled screens where the texture is applied directly to
   * the detected screen mesh instead.
   */
  skipOverlay?: boolean;
  /**
   * THREE.js node name of the screen/display mesh in the GLB file.
   * When set, the loader finds this mesh directly instead of relying on
   * material-name heuristics (which break when materials have no names).
   */
  screenMeshName?: string;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO ADD A NEW 3D DEVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Copy the .glb model file to:  public/models/<your-model>.glb
 * 2. Add a new entry below with the fields:
 *      id         – unique kebab-case identifier
 *      label      – display name shown in the picker
 *      group      – one of the DeviceGroup values (or add a new one)
 *      storeType  – controls which store tab it appears under
 *      w / h      – screen dimensions in CSS px (portrait orientation)
 *      inset*     – pixels of bezel on each side
 *      br         – CSS border-radius of the device body
 *      screenBr   – CSS border-radius of the screen corners
 *      camera     – front-camera style ('dynamic-island' | 'punch-hole' | 'notch' | 'none')
 *      cameraLayout – rear camera arrangement (or 'none')
 *      frame      – chassis material style
 *      accent     – thumbnail accent color (CSS hex)
 *      glbUrl     – path to the .glb model (relative to /public)
 *
 * Optional GLB tuning fields:
 *      screenFacesBack  – set true if the screen faces -Z in the export
 *      glbRotateZ       – radians to rotate landscape-exported models into portrait
 *      glbRotateX       – radians to fix Z-up exported models (e.g. -Math.PI/2)
 *      skipOverlay      – true for laptops/angled screens (texture applied to mesh)
 *      screenMeshName   – THREE.js node name of the screen mesh (skips auto-detection)
 *
 * That's it — no other files need to be changed. The renderer picks up the
 * new entry automatically, preloads the GLB, and handles screen content,
 * lighting, orientation, and color variants without any extra wiring.
 * ─────────────────────────────────────────────────────────────────────────────
 */
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
    skipOverlay: true,
    screenMeshName: 'Object_55',
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
    id: 'samsung-s26-ultra',
    label: 'Galaxy S26 Ultra',
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
    accent: '#334155',
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
    hasColors: true, hasOrientation: true,
    accent: '#c084fc',
    glbUrl: '/models/oneplus12.glb',
    screenFacesBack: true,
    skipOverlay: true,
  },
  // ── Tablet ────────────────────────────────────────────────────────
  {
    id: 'ipad-pro-12',
    label: 'iPad Pro 12.9"',
    group: 'Tablet',
    storeType: 'ipad',
    w: 340, h: 454,
    insetTop: 14, insetBottom: 14, insetSide: 14,
    br: '1.6rem', screenBr: '0.8rem',
    camera: 'none',
    cameraLayout: 'none',
    frame: 'aluminum',
    hasColors: true, hasOrientation: true,
    accent: '#94a3b8',
    glbUrl: '/models/ipadpro129.glb',
    skipOverlay: true,
  },
  {
    id: 'ipad-mini-6',
    label: 'iPad Mini 6',
    group: 'Tablet',
    storeType: 'ipad',
    w: 268, h: 408,
    insetTop: 12, insetBottom: 12, insetSide: 12,
    br: '1.6rem', screenBr: '0.7rem',
    camera: 'none',
    cameraLayout: 'none',
    frame: 'aluminum',
    hasColors: true, hasOrientation: true,
    accent: '#64748b',
    glbUrl: '/models/ipadmini6.glb',
    screenFacesBack: true,
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
    id: 'apple-watch-s4',
    label: 'Apple Watch',
    group: 'Watch',
    storeType: 'watch',
    w: 172, h: 210,
    insetTop: 10, insetBottom: 10, insetSide: 10,
    br: '38%', screenBr: '30%',
    camera: 'none',
    cameraLayout: 'none',
    frame: 'aluminum',
    hasColors: true,
    accent: '#64748b',
    glbUrl: '/models/applewatch.glb',
    glbRotateX: -Math.PI / 2,
    skipOverlay: true,
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
