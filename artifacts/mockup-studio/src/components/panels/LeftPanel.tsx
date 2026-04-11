import { useState, useRef, useEffect, memo } from 'react';
import {
  Smartphone, Shuffle, Wand2, Image as ImageIcon, Sliders,
  LayoutGrid, X, RefreshCw, Sun, RotateCcw, Search,
  Lamp, Warehouse, Sunset, Building2, TreePine, Moon, Sparkles, Video,
} from 'lucide-react';
import type { Tab } from './tabs';
import { TAB_ICONS } from './tabs';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, PRESETS, ANIMATED_BACKGROUNDS, ANIMATED_BG_KEYFRAMES } from '../../data/backgrounds';
import { LIGHT_OVERLAYS } from '../../data/lightOverlays';
import { DEVICE_MODELS, DEVICE_GROUPS, GROUP_ICONS, getModelById } from '../../data/devices';
import type { DeviceGroup } from '../../data/devices';
import type { DeviceColor, EnvPreset, CanvasRatio } from '../../store';

type IconProps = { size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string };

const IPHONE_COLORS: { id: DeviceColor; label: string; bg: string; border: string }[] = [
  { id: 'titanium',     label: 'Titanium',    bg: 'linear-gradient(135deg, #3a3a3a, #1e1e1e)', border: '#555'    },
  { id: 'black',        label: 'Black',       bg: 'linear-gradient(135deg, #1a1a1a, #050505)', border: '#333'    },
  { id: 'white',        label: 'White',       bg: 'linear-gradient(135deg, #d8d8d8, #b0b0b0)', border: '#aaa'    },
  { id: 'blue',         label: 'Blue',        bg: 'linear-gradient(135deg, #2a3f6f, #0f1e40)', border: '#3a5080' },
  { id: 'naturallight', label: 'Natural',     bg: 'linear-gradient(135deg, #c2b8a3, #a8a090)', border: '#a89c8a' },
  { id: 'desert',       label: 'Desert',      bg: 'linear-gradient(135deg, #9c8878, #7a6858)', border: '#8a7868' },
  { id: 'sierra',       label: 'Sierra',      bg: 'linear-gradient(135deg, #6b8ca3, #4a6e8a)', border: '#5a7a90' },
];

const ENV_PRESETS: { id: 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night'; label: string }[] = [
  { id: 'studio',    label: 'Studio'    },
  { id: 'warehouse', label: 'Warehouse' },
  { id: 'city',      label: 'City'      },
  { id: 'sunset',    label: 'Sunset'    },
  { id: 'forest',    label: 'Forest'    },
  { id: 'night',     label: 'Night'     },
];
const ENV_ICON: Record<string, React.ReactNode> = {
  studio:    <Lamp    size={20} strokeWidth={1.5} />,
  warehouse: <Warehouse size={20} strokeWidth={1.5} />,
  city:      <Building2 size={20} strokeWidth={1.5} />,
  sunset:    <Sunset  size={20} strokeWidth={1.5} />,
  forest:    <TreePine size={20} strokeWidth={1.5} />,
  night:     <Moon    size={20} strokeWidth={1.5} />,
};

const CANVAS_RATIOS = [
  { id: 'free',  label: 'Free'  },
  { id: '1:1',   label: '1:1'   },
  { id: '4:5',   label: '4:5'   },
  { id: '16:9',  label: '16:9'  },
  { id: '9:16',  label: '9:16'  },
] as const;

// ── Horizontal-scroll strip ───────────────────────────────────────
const HScroll = ({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{
    display: 'flex', gap, overflowX: 'auto', paddingBottom: 2,
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  } as React.CSSProperties}>
    {children}
  </div>
);

// ── Compact section row ───────────────────────────────────────────
const LABEL_SHADOW = '0 1px 5px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.7)';

const Section = ({ label, children, action }: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.62)',
        textShadow: LABEL_SHADOW,
      }}>
        {label}
      </span>
      {action}
    </div>
    {children}
  </div>
);

// ── Chip button (horizontal pill) ─────────────────────────────────
const Chip = ({ active, onClick, children, style }: {
  active: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties;
}) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.45)',
      border: active ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.18)',
      color: active ? '#0d0e0f' : 'rgba(255,255,255,0.82)',
      cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', ...style,
    }}
  >
    {children}
  </button>
);

// ── Toggle switch ─────────────────────────────────────────────────
const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    style={{
      position: 'relative', width: 36, height: 20, borderRadius: 10, flexShrink: 0,
      background: enabled ? 'rgba(48,209,88,0.55)' : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: 'pointer', transition: 'background 0.2s',
    }}>
    <div style={{
      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
      background: enabled ? '#fff' : 'rgba(255,255,255,0.6)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.5)', transition: 'left 0.18s',
      left: enabled ? 18 : 2,
    }} />
  </button>
);

// ── Slider ────────────────────────────────────────────────────────
// Uses local state + rAF throttle to decouple drag from store updates.
// • Label updates instantly (local state, no global re-render).
// • Store commits at most once per animation frame (~60 fps).
// • Pointer-up always flushes the final value.
const Slider = memo(function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const [local, setLocal] = useState(value);
  const isDragging  = useRef(false);
  const pending     = useRef<number | null>(null);
  const rafId       = useRef<number>(0);

  // Sync external value → local when a preset/template is applied externally
  useEffect(() => {
    if (!isDragging.current) setLocal(value);
  }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onChange(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocal(v);
    scheduleFlush(v);
  };

  const handlePointerDown = () => { isDragging.current = true; };

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
    pending.current = null;
    onChange(Number(e.currentTarget.value));
  };

  const display = Number.isInteger(step) ? String(local) : local.toFixed(2);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', fontVariantNumeric: 'tabular-nums' }}>
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={local}
        className="ms-range w-full"
        onChange={handleChange}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
});

// ── MiniSlider — compact 2-column variant of Slider ──────────────
const MiniSlider = memo(function MiniSlider({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const [local, setLocal] = useState(value);
  const isDragging = useRef(false);
  const pending    = useRef<number | null>(null);
  const rafId      = useRef<number>(0);

  useEffect(() => { if (!isDragging.current) setLocal(value); }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onChange(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value); setLocal(v); scheduleFlush(v);
  };
  const handlePointerDown = () => { isDragging.current = true; };
  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
    pending.current = null;
    onChange(Number(e.currentTarget.value));
  };

  const display = Number.isInteger(step) ? String(local) : local.toFixed(2);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.38)' }}>{label}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.52)', fontVariantNumeric: 'tabular-nums' }}>{display}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={local}
        className="ms-range w-full"
        onChange={handleChange} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} />
    </div>
  );
});

// ── Device thumbnail ──────────────────────────────────────────────
function DeviceThumbnail({ modelId, isSelected }: { modelId: string; isSelected: boolean }) {
  const def = getModelById(modelId);
  const isPhone   = def.storeType === 'iphone' || def.storeType === 'android';
  const isTablet  = def.storeType === 'ipad';
  const isWatch   = def.storeType === 'watch';
  const isMac     = def.storeType === 'macbook';
  const isBrowser = def.storeType === 'browser';

  const accent = isSelected ? 'rgba(255,255,255,0.85)' : (def.accent ?? 'rgba(255,255,255,0.35)');
  const body   = isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';

  if (isPhone) {
    const r = def.storeType === 'android' ? 6 : 8;
    return (
      <svg width="24" height="40" viewBox="0 0 28 46" fill="none">
        <rect x="1" y="1" width="26" height="44" rx={r} fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        {def.camera === 'dynamic-island' ? <rect x="9" y="4" width="10" height="3" rx="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'punch-hole' ? <circle cx="14" cy="5.5" r="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'notch' ? <rect x="7" y="0" width="14" height="4" rx="2" fill={body} stroke={accent} strokeWidth="1" />
          : null}
        <rect x="4" y="9" width="20" height="30" rx="2" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <rect x="27" y="14" width="2" height="8" rx="1" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isTablet) {
    return (
      <svg width="30" height="40" viewBox="0 0 36 46" fill="none">
        <rect x="1" y="1" width="34" height="44" rx="4" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="7" width="28" height="32" rx="2" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <circle cx="18" cy="42" r="2" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isWatch) {
    return (
      <svg width="24" height="34" viewBox="0 0 28 38" fill="none">
        <rect x="8" y="0" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="8" y="33" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="1" y="6" width="26" height="26" rx="8" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="9" width="20" height="20" rx="6" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
      </svg>
    );
  }
  if (isMac) {
    return (
      <svg width="40" height="30" viewBox="0 0 44 36" fill="none">
        <rect x="4" y="1" width="36" height="24" rx="2" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="7" y="4" width="30" height="18" rx="1" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <rect x="1" y="25" width="42" height="5" rx="1.5" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
      </svg>
    );
  }
  if (isBrowser) {
    return (
      <svg width="40" height="28" viewBox="0 0 44 30" fill="none">
        <rect x="1" y="1" width="42" height="28" rx="3" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="1" y="1" width="42" height="8" rx="3" fill={accent} opacity="0.18" />
        <rect x="4" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.5" />
        <rect x="10" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.3" />
        <rect x="4" y="11" width="36" height="16" rx="1" fill={isSelected ? 'rgba(55,65,81,0.12)' : 'rgba(0,0,0,0.03)'} />
      </svg>
    );
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────
function extractColorsFromImage(imgSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20; canvas.height = 20;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0, 20, 20);
      const data = ctx.getImageData(0, 0, 20, 20).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        if (data[i + 3] < 128) continue;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
      resolve(sorted.slice(0, 4).map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return `rgb(${r},${g},${b})`;
      }));
    };
    img.onerror = () => resolve([]);
    img.src = imgSrc;
  });
}



// ── Rotato-style present pose definitions ─────────────────────────
const PRESENT_POSES: {
  id: 'hero' | 'front' | 'side' | 'top' | 'tilt-right' | 'tilt-left' | 'low' | 'diagonal' | 'dramatic';
  label: string;
  ry: number; rx: number; rz: number;
  perspective?: number;
}[] = [
  { id: 'hero',       label: 'Hero',     ry:  25, rx: -12, rz:  0 },
  { id: 'front',      label: 'Front',    ry:   0, rx:   0, rz:  0 },
  { id: 'tilt-right', label: 'Right',    ry:  48, rx:  -8, rz:  0 },
  { id: 'tilt-left',  label: 'Left',     ry: -48, rx:  -8, rz:  0 },
  { id: 'top',        label: 'Top',      ry:  12, rx: -58, rz:  0 },
  { id: 'low',        label: 'Low',      ry:  14, rx:  42, rz:  0 },
  { id: 'side',       label: 'Side',     ry:  76, rx:   0, rz:  0 },
  { id: 'diagonal',   label: 'Diagonal', ry:  44, rx: -16, rz:  0 },
  { id: 'dramatic',   label: 'Dramatic', ry:  20, rx: -38, rz:  0 },
];

// ── Rotato pose thumbnail ──────────────────────────────────────────
function PoseThumbnail({ ry, rx, rz, active, mini }: {
  ry: number; rx: number; rz: number; active: boolean; mini?: boolean;
}) {
  const bodyColor   = active ? '#d0d0d0' : '#484848';
  const screenColor = active ? '#ffffff' : '#111111';
  const frameColor  = active ? '#b0b0b0' : '#333333';

  const s = mini ? 0.5 : 1;

  return (
    <div style={{
      width: 52 * s, height: 80 * s,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: 180 * s,
    }}>
      <div style={{
        width: 22 * s, height: 46 * s,
        transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
      }}>
        {/* Phone body */}
        <div style={{
          width: '100%', height: '100%',
          background: bodyColor,
          borderRadius: 5 * s,
          boxShadow: active
            ? `${3*s}px ${6*s}px ${20*s}px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(255,255,255,0.3)`
            : `${2*s}px ${4*s}px ${10*s}px rgba(0,0,0,0.7)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}>
          {/* Screen */}
          <div style={{
            width: '74%', height: '78%',
            background: screenColor,
            borderRadius: 2 * s,
            transition: 'background 0.3s',
          }} />
          {/* Dynamic island notch */}
          <div style={{
            position: 'absolute', top: 2 * s, left: '50%', transform: 'translateX(-50%)',
            width: 8 * s, height: 2 * s, borderRadius: 1 * s,
            background: frameColor,
            transition: 'background 0.3s',
          }} />
        </div>
        {/* Side button */}
        <div style={{
          position: 'absolute', right: -1 * s, top: '28%',
          width: 1.5 * s, height: 8 * s, borderRadius: 1 * s,
          background: frameColor,
          transition: 'background 0.3s',
        }} />
      </div>
    </div>
  );
}

// ── Mode accent helpers ────────────────────────────────────────────
function getModeAccent(mode: string) {
  if (mode === 'movie')      return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)' };
  if (mode === 'screenshot') return { color: '#0284c7', bg: 'rgba(2,132,199,0.08)', border: 'rgba(2,132,199,0.3)' };
  return { color: '#374151', bg: 'rgba(55,65,81,0.07)', border: 'rgba(55,65,81,0.25)' };
}

function getDefaultTab(mode: string): Tab {
  if (mode === 'canvas') return 'canvas';
  if (mode === 'movie') return 'canvas';
  if (mode === 'screenshot') return 'device';
  return 'device';
}

// ── Responsive popup helpers ──────────────────────────────────────
/** Return a clamped width that never exceeds viewport minus padding */
const safeW = (w: number) => `min(${w}px, calc(100vw - 16px))` as const;
/** Clamp left so the popup of given width stays inside the viewport */
const clampL = (anchorX: number, w: number, offsetX = 0) =>
  Math.max(8, Math.min(anchorX + offsetX, (typeof window !== 'undefined' ? window.innerWidth : 999) - w - 8));
/** Clamp top so the popup doesn't go above the viewport */
const clampT = (v: number) => Math.max(8, v);

// ── Main component ────────────────────────────────────────────────
export function LeftPanel({ mobile = false, mobileContentOnly }: { mobile?: boolean; mobileContentOnly?: Tab }) {
  const { state, updateState, addText } = useApp();
  const mode = state.creationMode ?? 'mockup';
  const modeAccent = getModeAccent(mode);

  const [activeTab, setActiveTab]           = useState<Tab>(getDefaultTab(mode));
  const [selectedGroup, setSelectedGroup]   = useState<DeviceGroup>('iPhone');
  const [deviceSearch, setDeviceSearch]     = useState('');
  const [mobileDeviceFilter, setMobileDeviceFilter] = useState<DeviceGroup | 'All'>('All');
  const bgFileRef                            = useRef<HTMLInputElement>(null);
  const bgVideoFileRef                       = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting]         = useState(false);
  const [annotatePopup, setAnnotatePopup]   = useState<null | 'color' | 'size' | 'shapes'>(null);
  const [annotatePopupAnchor, setAnnotatePopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const annotatePopupRef                     = useRef<HTMLDivElement>(null);
  const colorBtnRef                          = useRef<HTMLButtonElement>(null);
  const sizeBtnRef                           = useRef<HTMLButtonElement>(null);
  const shapeBtnRef                          = useRef<HTMLButtonElement>(null);

  const [overlayPopup, setOverlayPopup]     = useState<null | 'color' | 'opacity' | 'light'>(null);
  const [overlayPopupAnchor, setOverlayPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const overlayPopupRef                      = useRef<HTMLDivElement>(null);
  const overlayColorBtnRef                   = useRef<HTMLButtonElement>(null);
  const overlayOpacityBtnRef                 = useRef<HTMLButtonElement>(null);

  const [bgPopup, setBgPopup]               = useState<null | string>(null);
  const [bgPopupAnchor, setBgPopupAnchor]   = useState<{ x: number; y: number } | null>(null);
  const bgPopupRef                           = useRef<HTMLDivElement>(null);

  const [lightPopupOpen, setLightPopupOpen] = useState(false);
  const [lightPopupAnchor, setLightPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const lightPopupRef                        = useRef<HTMLDivElement>(null);
  const lightBtnRef                          = useRef<HTMLButtonElement>(null);

  const [envPopupOpen, setEnvPopupOpen]     = useState(false);
  const [envPopupAnchor, setEnvPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const envPopupRef                         = useRef<HTMLDivElement>(null);
  const envBtnRef                           = useRef<HTMLButtonElement>(null);

  const [scenePopup, setScenePopup]         = useState<null | 'canvas' | 'motion' | 'effects' | 'shadow'>(null);
  const [scenePopupAnchor, setScenePopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const scenePopupRef                        = useRef<HTMLDivElement>(null);

  const [presentsPopupOpen, setPresentsPopupOpen] = useState(false);
  const [presentsPopupAnchor, setPresentsPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const presentsPopupRef                      = useRef<HTMLDivElement>(null);
  const presentsBtnRef                        = useRef<HTMLButtonElement>(null);

  const [deviceOptPopup, setDeviceOptPopup]   = useState<null | 'color' | 'orient'>(null);
  const [deviceOptAnchor, setDeviceOptAnchor] = useState<{ x: number; y: number } | null>(null);
  const deviceOptRef                          = useRef<HTMLDivElement>(null);
  const deviceColorBtnRef                     = useRef<HTMLButtonElement>(null);
  const deviceOrientBtnRef                    = useRef<HTMLButtonElement>(null);

  const [deviceGroupPopup, setDeviceGroupPopup] = useState<DeviceGroup | null>(null);
  const [deviceGroupAnchor, setDeviceGroupAnchor] = useState<{ x: number; y: number } | null>(null);
  const deviceGroupPopupRef                     = useRef<HTMLDivElement>(null);

  // Close annotate popup when clicking outside
  useEffect(() => {
    if (!annotatePopup) return;
    const onDown = (e: MouseEvent) => {
      if (annotatePopupRef.current && !annotatePopupRef.current.contains(e.target as Node)) {
        setAnnotatePopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [annotatePopup]);

  // Close overlay popup when clicking outside
  useEffect(() => {
    if (!overlayPopup) return;
    const onDown = (e: MouseEvent) => {
      if (overlayPopupRef.current && !overlayPopupRef.current.contains(e.target as Node)) {
        setOverlayPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [overlayPopup]);

  // Close background popup when clicking outside
  useEffect(() => {
    if (!bgPopup) return;
    const onDown = (e: MouseEvent) => {
      if (bgPopupRef.current && !bgPopupRef.current.contains(e.target as Node)) {
        setBgPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [bgPopup]);

  // Close device group popup when clicking outside
  useEffect(() => {
    if (!deviceGroupPopup) return;
    const onDown = (e: MouseEvent) => {
      if (deviceGroupPopupRef.current && !deviceGroupPopupRef.current.contains(e.target as Node)) {
        setDeviceGroupPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [deviceGroupPopup]);

  // Close device options popup when clicking outside
  useEffect(() => {
    if (!deviceOptPopup) return;
    const onDown = (e: MouseEvent) => {
      const insidePopup = deviceOptRef.current?.contains(e.target as Node);
      const insideColor = deviceColorBtnRef.current?.contains(e.target as Node);
      const insideOrient = deviceOrientBtnRef.current?.contains(e.target as Node);
      if (!insidePopup && !insideColor && !insideOrient) setDeviceOptPopup(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [deviceOptPopup]);

  // Close presents popup when clicking outside
  useEffect(() => {
    if (!presentsPopupOpen) return;
    const onDown = (e: MouseEvent) => {
      if (presentsPopupRef.current && !presentsPopupRef.current.contains(e.target as Node)
        && presentsBtnRef.current && !presentsBtnRef.current.contains(e.target as Node)) {
        setPresentsPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [presentsPopupOpen]);

  // Close scene popup when clicking outside
  useEffect(() => {
    if (!scenePopup) return;
    const onDown = (e: MouseEvent) => {
      if (scenePopupRef.current && !scenePopupRef.current.contains(e.target as Node)) {
        setScenePopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [scenePopup]);

  // Close light popup when clicking outside
  useEffect(() => {
    if (!lightPopupOpen) return;
    const onDown = (e: MouseEvent) => {
      if (lightPopupRef.current && !lightPopupRef.current.contains(e.target as Node)
          && lightBtnRef.current && !lightBtnRef.current.contains(e.target as Node)) {
        setLightPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [lightPopupOpen]);

  // Close env popup when clicking outside
  useEffect(() => {
    if (!envPopupOpen) return;
    const onDown = (e: MouseEvent) => {
      if (envPopupRef.current && !envPopupRef.current.contains(e.target as Node)
          && envBtnRef.current && !envBtnRef.current.contains(e.target as Node)) {
        setEnvPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [envPopupOpen]);

  // Close any open popup on pinch (2-finger touch) or drag gesture
  useEffect(() => {
    const anyOpen =
      annotatePopup || overlayPopup || bgPopup || deviceGroupPopup ||
      deviceOptPopup || presentsPopupOpen || scenePopup || lightPopupOpen || envPopupOpen;
    if (!anyOpen) return;

    const closeAll = () => {
      setAnnotatePopup(null);
      setOverlayPopup(null);
      setBgPopup(null);
      setDeviceGroupPopup(null);
      setDeviceOptPopup(null);
      setPresentsPopupOpen(false);
      setScenePopup(null);
      setLightPopupOpen(false);
      setEnvPopupOpen(false);
    };

    const allPopupRefs = [
      annotatePopupRef, overlayPopupRef, bgPopupRef, deviceGroupPopupRef,
      deviceOptRef, presentsPopupRef, scenePopupRef, lightPopupRef, envPopupRef,
    ];

    const isInsideAnyPopup = (target: EventTarget | null): boolean =>
      allPopupRefs.some(r => r.current?.contains(target as Node));

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) closeAll();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) { closeAll(); return; }
      if (!isInsideAnyPopup(e.target)) closeAll();
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, [
    annotatePopup, overlayPopup, bgPopup, deviceGroupPopup,
    deviceOptPopup, presentsPopupOpen, scenePopup, lightPopupOpen, envPopupOpen,
  ]);

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'image', bgImage: URL.createObjectURL(file), bgVideo: null });
  };

  const handleBgVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'video', bgVideo: URL.createObjectURL(file), bgImage: null });
  };

  const handleShuffle = () => {
    const pool = [
      ...GRADIENTS.map(g => ({ bgType: 'gradient' as const, bgColor: g.id })),
      ...MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => ({ bgType: 'mesh' as const, bgColor: m.id })),
      ...WALLPAPERS.map(w => ({ bgType: 'wallpaper' as const, bgColor: w.id })),
    ];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    updateState(pick);
  };

  const handleAutoBackground = async () => {
    if (!state.screenshotUrl) return;
    setExtracting(true);
    try {
      const colors = await extractColorsFromImage(state.screenshotUrl);
      if (colors.length < 2) return;
      const [c1, c2, c3, c4] = colors;
      const meshCss = [
        `radial-gradient(at 20% 20%, ${c1} 0px, transparent 50%)`,
        `radial-gradient(at 80% 10%, ${c2} 0px, transparent 50%)`,
        c3 ? `radial-gradient(at 70% 80%, ${c3} 0px, transparent 50%)` : '',
        c4 ? `radial-gradient(at 10% 70%, ${c4} 0px, transparent 50%)` : '',
        '#0a0a14',
      ].filter(Boolean).join(', ');
      updateState({ bgType: 'mesh', bgColor: '__auto__' });
      const existing = MESH_GRADIENTS.find(m => m.id === '__auto__');
      if (existing) { existing.css = meshCss; }
      else MESH_GRADIENTS.push({ id: '__auto__', label: 'Auto', css: meshCss });
    } finally { setExtracting(false); }
  };

  // ── Device tab content ──────────────────────────────────────────
  const DeviceTab = () => {
    const activeModel  = getModelById(state.deviceModel);
    const activeGroup  = activeModel?.group;
    const hasColors    = !!activeModel?.hasColors;
    const hasOrientation = !!activeModel?.hasOrientation;
    const hasBrowserTheme = state.deviceType === 'browser';
    const hasOptions = hasColors || hasOrientation || hasBrowserTheme;

    return (
      <>
        {/* ── Group models popup ───────────────────────────── */}
        {deviceGroupPopup && deviceGroupAnchor && (() => {
          const popupModels = DEVICE_MODELS.filter(m => m.group === deviceGroupPopup);
          return (
            <div ref={deviceGroupPopupRef} style={{
              position: 'fixed',
              left: clampL(deviceGroupAnchor.x, 280, -140),
              top: Math.min(deviceGroupAnchor.y + 52, window.innerHeight - 300),
              width: safeW(280),
              maxHeight: 'min(400px, calc(100vh - 80px))',
              overflowY: 'auto',
              background: 'rgba(18,20,26,0.98)',
              borderRadius: 18, padding: '12px 12px 10px', zIndex: 9999,
              boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(22px)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{deviceGroupPopup}</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {popupModels.map(model => {
                  const isSelected = state.deviceModel === model.id;
                  return (
                    <button key={model.id}
                      onClick={() => { updateState({ deviceModel: model.id, deviceType: model.storeType }); setDeviceGroupPopup(null); }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        width: 72, padding: '10px 4px 8px', borderRadius: 14, gap: 0,
                        background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                        border: isSelected ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>
                      <div style={{ height: 52, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.25)', transformOrigin: 'center' }}>
                        <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                      </div>
                      <span style={{
                        fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                        marginTop: 6, color: isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)',
                        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{model.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── Color popup ──────────────────────────────────── */}
        {deviceOptPopup === 'color' && deviceOptAnchor && (
          <div ref={deviceOptRef} style={{
            position: 'fixed',
            left: clampL(deviceOptAnchor.x, 240, -120),
            top: Math.min(deviceOptAnchor.y + 52, window.innerHeight - 160),
            width: safeW(240),
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '14px 16px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Frame Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {IPHONE_COLORS.map(c => (
                <button key={c.id} title={c.label} onClick={() => updateState({ deviceColor: c.id })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c.bg,
                    border: state.deviceColor === c.id ? '2.5px solid rgba(255,255,255,0.80)' : `2px solid ${c.border}`,
                    boxShadow: state.deviceColor === c.id ? '0 0 0 2.5px rgba(255,255,255,0.13)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                  }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Orient / Theme popup ─────────────────────────── */}
        {deviceOptPopup === 'orient' && deviceOptAnchor && (
          <div ref={deviceOptRef} style={{
            position: 'fixed',
            left: clampL(deviceOptAnchor.x, 200, -100),
            top: Math.min(deviceOptAnchor.y + 52, window.innerHeight - 160),
            width: safeW(200),
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '14px 16px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            {hasOrientation && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Orientation</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Chip active={!state.deviceLandscape} onClick={() => updateState({ deviceLandscape: false })}>Portrait</Chip>
                  <Chip active={state.deviceLandscape}  onClick={() => updateState({ deviceLandscape: true })}>Landscape</Chip>
                </div>
              </>
            )}
            {hasBrowserTheme && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Theme</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Chip active={state.browserMode === 'dark'}  onClick={() => updateState({ browserMode: 'dark' })}>Dark</Chip>
                  <Chip active={state.browserMode === 'light'} onClick={() => updateState({ browserMode: 'light' })}>Light</Chip>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Single row: group chips + options button ─────── */}
        <Section label="Device">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              flex: 1, display: 'flex', gap: 5, overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            } as React.CSSProperties}>
              {DEVICE_GROUPS.map(group => {
                const isOpen   = deviceGroupPopup === group;
                const isActive = activeGroup === group;
                const repModel = DEVICE_MODELS.find(m => m.group === group);
                return (
                  <button key={group}
                    onClick={e => {
                      if (isOpen) { setDeviceGroupPopup(null); return; }
                      const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      setDeviceGroupAnchor({ x: r.left + r.width / 2, y: r.top });
                      setDeviceGroupPopup(group);
                      setDeviceOptPopup(null);
                    }}
                    title={group}
                    style={{
                      flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive || isOpen ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                      outline: isOpen
                        ? '1.5px solid rgba(167,139,250,0.8)'
                        : isActive
                          ? '2px solid rgba(255,255,255,0.85)'
                          : '1px solid rgba(255,255,255,0.14)',
                      color: isActive || isOpen ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.12s',
                    }}>
                    {repModel && <DeviceThumbnail modelId={repModel.id} isSelected={isActive || isOpen} />}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            {(hasColors || hasOrientation || hasBrowserTheme) && (
              <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
            )}

            {/* Color button */}
            {hasColors && (
              <button
                aria-label="Device color"
                ref={deviceColorBtnRef}
                onClick={() => {
                  const next = deviceOptPopup === 'color' ? null : 'color';
                  const r = deviceColorBtnRef.current?.getBoundingClientRect();
                  if (r) setDeviceOptAnchor({ x: r.left + r.width / 2, y: r.top });
                  setDeviceOptPopup(next);
                  setDeviceGroupPopup(null);
                }}
                style={{
                  flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  alignSelf: 'stretch', justifyContent: 'center',
                  background: deviceOptPopup === 'color' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                  outline: deviceOptPopup === 'color' ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
                  color: deviceOptPopup === 'color' ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
                  fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: IPHONE_COLORS.find(c => c.id === state.deviceColor)?.bg ?? IPHONE_COLORS[0].bg,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                }} />
              </button>
            )}

            {/* Orient / Theme button */}
            {(hasOrientation || hasBrowserTheme) && (
              <button
                aria-label={hasBrowserTheme ? 'Browser theme' : 'Device orientation'}
                ref={deviceOrientBtnRef}
                onClick={() => {
                  const next = deviceOptPopup === 'orient' ? null : 'orient';
                  const r = deviceOrientBtnRef.current?.getBoundingClientRect();
                  if (r) setDeviceOptAnchor({ x: r.left + r.width / 2, y: r.top });
                  setDeviceOptPopup(next);
                  setDeviceGroupPopup(null);
                }}
                style={{
                  flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  alignSelf: 'stretch', justifyContent: 'center',
                  background: deviceOptPopup === 'orient' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                  outline: deviceOptPopup === 'orient' ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
                  color: deviceOptPopup === 'orient' ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
                  fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {hasBrowserTheme
                    ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                    : <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 014 0v2"/></>
                  }
                </svg>
              </button>
            )}
          </div>
        </Section>
      </>
    );
  };

  // ── Background tab content ──────────────────────────────────────
  const BackgroundTab = () => {
    const THUMB: React.CSSProperties = {
      width: 44, height: 44, borderRadius: 10, marginBottom: 5,
      border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    };
    const SWATCH_BTN = (active: boolean): React.CSSProperties => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 7px 7px', borderRadius: 12, border: 'none', cursor: 'pointer',
      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
      outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.10)',
      transition: 'all 0.12s', flexShrink: 0,
    });
    const SWATCH_LABEL = (active: boolean): React.CSSProperties => ({
      fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
      color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.45)',
      whiteSpace: 'nowrap',
    });

    const NO_POPUP_TYPES = new Set(['none', 'transparent']);
    const bgTypeCards: { id: string; label: string; preview: React.CSSProperties | null; icon?: React.ReactNode }[] = [
      { id: 'none',     label: 'None',    preview: { background: '#111113' }, icon:
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5"/>
            <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>,
      },
      { id: 'solid',    label: 'Solid',    preview: { background: state.bgType === 'solid' ? state.bgColor : '#374151' } },
      { id: 'gradient', label: 'Gradient', preview: { background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)' } },
      { id: 'mesh',     label: 'Mesh',     preview: { background: 'radial-gradient(at 30% 20%, #0ea5e9 0px, transparent 55%), radial-gradient(at 80% 70%, #ec4899 0px, transparent 55%), #03111e' } },
      { id: 'wallpaper',label: 'Wallpaper',preview: { background: 'radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #60a5fa 60%, #dbeafe 100%)' } },
      { id: 'pattern',  label: 'Pattern',  preview: { backgroundColor: '#1a1c2e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
      { id: 'image',    label: 'Image',    preview: null },
      { id: 'video',    label: 'Video',    preview: null, icon: <Video size={16} color="rgba(255,255,255,0.40)" /> },
      { id: 'transparent', label: 'Alpha', preview: null, icon:
          <div style={{
            width: '100%', height: '100%', borderRadius: 10,
            backgroundImage: 'linear-gradient(45deg, #3a3a3a 25%, transparent 25%), linear-gradient(-45deg, #3a3a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3a3a3a 75%), linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            backgroundColor: '#222',
          }} />,
      },
      { id: 'animated', label: 'Animated', preview: null, icon:
          <div style={{
            width: '100%', height: '100%', borderRadius: 10,
            background: 'linear-gradient(-45deg, #7e22ce, #0ea5e9, #ec4899, #f59e0b)',
            backgroundSize: '300% 300%',
            animation: 'bgShift 4s ease infinite',
          }} />,
      },
    ];
    

    const popupStyle: React.CSSProperties = {
      position: 'fixed',
      left: bgPopupAnchor ? clampL(bgPopupAnchor.x, 262, -130) : 0,
      bottom: bgPopupAnchor ? window.innerHeight - bgPopupAnchor.y + 8 : 0,
      width: safeW(262),
      background: 'rgba(18,20,26,0.98)',
      borderRadius: 18, padding: 14, zIndex: 9999,
      boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(22px)',
      maxHeight: 'min(calc(100vh - 80px), 80vh)',
      overflowY: 'auto',
    };

    const GRID4: React.CSSProperties = {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
    };

    return (
      <>
        <style>{ANIMATED_BG_KEYFRAMES}</style>

        {/* ── Background type popup ───────────────────────────── */}
        {bgPopup && bgPopupAnchor && (
          <div ref={bgPopupRef} style={popupStyle}>

            {/* Opacity */}
            {bgPopup === 'opacity' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Opacity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <input
                    type="range" min={0} max={100} step={1}
                    value={state.bgOpacity ?? 100}
                    onChange={e => updateState({ bgOpacity: Number(e.target.value) })}
                    className="rt-slider"
                    style={{ flex: 1, accentColor: 'rgba(255,255,255,0.7)' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', minWidth: 34, textAlign: 'right' }}>
                    {state.bgOpacity ?? 100}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[20, 40, 60, 80, 100].map(v => (
                    <button key={v} onClick={() => updateState({ bgOpacity: v })}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                        background: (state.bgOpacity ?? 100) === v ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                        color: (state.bgOpacity ?? 100) === v ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        outline: (state.bgOpacity ?? 100) === v ? '1.5px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.1s',
                      }}>{v}%</button>
                  ))}
                </div>
              </>
            )}

            {/* Solid color */}
            {bgPopup === 'solid' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Color</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.12)' }} />
                    <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                  </div>
                  <input type="text" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                    className="rt-input" style={{ fontFamily: 'monospace', flex: 1 }} />
                </div>
              </>
            )}

            {/* Gradients */}
            {bgPopup === 'gradient' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gradients</div>
                <div style={GRID4}>
                  {GRADIENTS.map(g => {
                    const active = state.bgColor === g.id;
                    return (
                      <button key={g.id} onClick={() => updateState({ bgColor: g.id })} style={SWATCH_BTN(active)}>
                        <div style={{ ...THUMB, background: g.css }} />
                        <span style={SWATCH_LABEL(active)}>{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Mesh gradients */}
            {bgPopup === 'mesh' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Mesh Gradients</span>
                  {state.screenshotUrl && (
                    <button onClick={() => { handleAutoBackground(); setBgPopup(null); }} disabled={extracting}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7,
                        fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                      }}>
                      <Wand2 size={10} />{extracting ? 'Extracting…' : 'Auto'}
                    </button>
                  )}
                </div>
                <div style={GRID4}>
                  {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => {
                    const active = state.bgColor === m.id;
                    return (
                      <button key={m.id} onClick={() => updateState({ bgColor: m.id })} style={SWATCH_BTN(active)}>
                        <div style={{ ...THUMB, background: m.css }} />
                        <span style={SWATCH_LABEL(active)}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Wallpapers */}
            {bgPopup === 'wallpaper' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Wallpapers</div>
                <div style={GRID4}>
                  {WALLPAPERS.map(w => {
                    const active = state.bgColor === w.id;
                    return (
                      <button key={w.id} onClick={() => updateState({ bgColor: w.id })} style={SWATCH_BTN(active)}>
                        <div style={{ ...THUMB, background: w.css }} />
                        <span style={SWATCH_LABEL(active)}>{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Patterns */}
            {bgPopup === 'pattern' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pattern</div>
                <div style={GRID4}>
                  {PATTERNS.map(p => {
                    const active = state.bgPattern === p.id;
                    return (
                      <button key={p.id} onClick={() => updateState({ bgPattern: p.id })} style={SWATCH_BTN(active)}>
                        <div style={{ ...THUMB, ...p.bgStyle('#1a1c2e') }} />
                        <span style={SWATCH_LABEL(active)}>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pattern Color</div>
                  <div style={{ position: 'relative', width: '100%', height: 36, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                  </div>
                </div>
              </>
            )}

            {/* Animated backgrounds */}
            {bgPopup === 'animated' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Animated Backgrounds
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {ANIMATED_BACKGROUNDS.map(bg => {
                    const active = state.bgAnimated === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => updateState({ bgAnimated: bg.id })}
                        title={bg.label}
                        style={{
                          position: 'relative', border: 'none', padding: 0,
                          borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                          outline: active ? '2.5px solid rgba(167,139,250,0.9)' : '1.5px solid rgba(255,255,255,0.1)',
                          outlineOffset: active ? 1 : 0,
                          transition: 'outline 0.1s',
                        }}
                      >
                        <div style={{
                          width: '100%', aspectRatio: '16/9',
                          ...bg.thumb,
                          display: 'flex', alignItems: 'flex-end',
                        }}>
                          {bg.type === 'iframe' && (
                            <div style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,0.5)', borderRadius: 4,
                              fontSize: 8, color: 'rgba(255,255,255,0.7)', padding: '1px 4px',
                              fontWeight: 700, letterSpacing: '0.05em',
                            }}>3D</div>
                          )}
                        </div>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                          padding: '10px 7px 5px',
                          fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                          textAlign: 'left',
                        }}>
                          {bg.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Image upload */}
            {bgPopup === 'image' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background Image</div>
                {state.bgImage && (
                  <div style={{ width: '100%', height: 80, borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={state.bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
                  </div>
                )}
                <button onClick={() => bgFileRef.current?.click()}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: 'rgba(0,0,0,0.5)', border: '1px dashed rgba(255,255,255,0.28)',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                  }}>
                  {state.bgImage ? 'Change Image' : '+ Upload Image'}
                </button>
                <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleBgImage(e); setBgPopup(null); }} />
              </>
            )}

            {/* Video upload */}
            {bgPopup === 'video' && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background Video</div>
                {state.bgVideo && (
                  <div style={{ width: '100%', height: 92, borderRadius: 10, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#0f1115' }}>
                    <video src={state.bgVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted autoPlay loop playsInline />
                  </div>
                )}
                <button onClick={() => bgVideoFileRef.current?.click()}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: 'rgba(0,0,0,0.5)', border: '1px dashed rgba(255,255,255,0.28)',
                    color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
                  }}>
                  {state.bgVideo ? 'Change Video' : '+ Upload Video'}
                </button>
                <input ref={bgVideoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { handleBgVideo(e); setBgPopup(null); }} />
              </>
            )}

            {/* Effects */}
            {bgPopup === 'effects' && (() => {
              const EffectRow = ({ label, active, onToggle, children }: { label: string; active: boolean; onToggle: () => void; children?: React.ReactNode }) => (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: active ? 10 : 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>{label}</span>
                    <button onClick={onToggle} style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
                      position: 'relative', transition: 'all 0.18s', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: 2, left: active ? 18 : 2, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>
                  {active && children}
                </div>
              );

              const SliderRow = ({ value, min, max, step, onChange, unit }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string }) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(Number(e.target.value))}
                    className="rt-slider" style={{ flex: 1, accentColor: 'rgba(167,139,250,0.9)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', minWidth: 32, textAlign: 'right' }}>
                    {value}{unit ?? ''}
                  </span>
                </div>
              );

              return (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Efectos</div>

                  {/* Blur */}
                  <EffectRow label="Desenfoque" active={state.bgBlur > 0} onToggle={() => updateState({ bgBlur: state.bgBlur > 0 ? 0 : 8 })}>
                    <SliderRow value={state.bgBlur} min={1} max={24} step={1} unit="px"
                      onChange={v => updateState({ bgBlur: v })} />
                  </EffectRow>

                  {/* Noise / Grain */}
                  <EffectRow label="Ruido" active={state.grain} onToggle={() => updateState({ grain: !state.grain })}>
                    <SliderRow value={state.grainIntensity} min={5} max={100} step={1} unit="%"
                      onChange={v => updateState({ grainIntensity: v })} />
                  </EffectRow>

                  {/* Vignette */}
                  <EffectRow label="Viñeta" active={state.bgVignette} onToggle={() => updateState({ bgVignette: !state.bgVignette })}>
                    <SliderRow value={state.bgVignetteIntensity} min={10} max={100} step={1} unit="%"
                      onChange={v => updateState({ bgVignetteIntensity: v })} />
                  </EffectRow>

                  {/* Background only toggle (affects Noise/Grain which is the only effect covering the device) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 2,
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: state.grainBgOnly ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                        Background only
                      </div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        Noise doesn't cover the device
                      </div>
                    </div>
                    <button
                      onClick={() => updateState({ grainBgOnly: !state.grainBgOnly })}
                      style={{
                        width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                        background: state.grainBgOnly ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
                        position: 'relative', transition: 'all 0.18s', flexShrink: 0,
                      }}>
                      <div style={{
                        position: 'absolute', top: 3, left: state.grainBgOnly ? 19 : 3, width: 16, height: 16,
                        borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Type selector row + Shuffle */}
        <Section label="Background" action={
          <button onClick={handleShuffle} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
            fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            transition: 'all 0.12s',
          }}>
            <Shuffle size={10} /> Shuffle
          </button>
        }>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' } as React.CSSProperties}>
            {bgTypeCards.map(({ id, label, preview, icon }) => {
              const active = state.bgType === id;
              const popupOpen = bgPopup === id;
              const hasPopup = !NO_POPUP_TYPES.has(id);
              return (
                <button key={id}
                  onClick={e => {
                    updateState({ bgType: id as any });
                    if (!hasPopup) { setBgPopup(null); return; }
                    if (popupOpen) { setBgPopup(null); return; }
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    setBgPopup(id);
                  }}
                  title={label}
                  style={{
                    flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: popupOpen ? '2px solid rgba(167,139,250,0.8)' : active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.14)',
                    cursor: 'pointer', transition: 'all 0.12s',
                    ...(icon ? {} : (preview ?? { background: '#1a1c2e' })),
                  }}>
                  {icon
                    ? icon
                    : (!preview && id !== 'none' && <ImageIcon size={16} color="rgba(255,255,255,0.40)" />)}
                </button>
              );
            })}

            {/* Divider */}
            {state.bgType !== 'none' && state.bgType !== 'transparent' && (
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.10)', flexShrink: 0, alignSelf: 'center' }} />
            )}

            {/* Opacity button — same style as all other panel buttons */}
            {state.bgType !== 'none' && state.bgType !== 'transparent' && (() => {
              const opacityOpen = bgPopup === 'opacity';
              const isModified = (state.bgOpacity ?? 100) < 100;
              return (
                <button
                  title="Opacity"
                  onClick={e => {
                    if (opacityOpen) { setBgPopup(null); return; }
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    setBgPopup('opacity');
                  }}
                  style={{
                    flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                    background: opacityOpen ? 'rgba(255,255,255,0.15)' : isModified ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: opacityOpen ? '2px solid rgba(167,139,250,0.8)' : isModified ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.14)',
                    cursor: 'pointer', transition: 'all 0.12s',
                    color: opacityOpen ? 'rgba(167,139,250,1)' : isModified ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" stroke="none" opacity="0.5"/>
                  </svg>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>
                    {state.bgOpacity ?? 100}%
                  </span>
                </button>
              );
            })()}

            {/* Effects button */}
            {state.bgType !== 'none' && state.bgType !== 'transparent' && (() => {
              const effectsOpen = bgPopup === 'effects';
              const hasEffect = state.bgBlur > 0 || state.grain || state.bgVignette;
              return (
                <button
                  title="Efectos"
                  onClick={e => {
                    if (effectsOpen) { setBgPopup(null); return; }
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setBgPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    setBgPopup('effects');
                  }}
                  style={{
                    flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: effectsOpen ? 'rgba(167,139,250,0.18)' : hasEffect ? 'rgba(167,139,250,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: effectsOpen ? '2px solid rgba(167,139,250,0.8)' : hasEffect ? '2px solid rgba(167,139,250,0.6)' : '1.5px solid rgba(255,255,255,0.14)',
                    cursor: 'pointer', transition: 'all 0.12s',
                    color: effectsOpen ? 'rgba(167,139,250,1)' : hasEffect ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.4)',
                  }}>
                  <Sparkles size={14} />
                  <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1 }}>FX</span>
                </button>
              );
            })()}
          </div>
        </Section>
      </>
    );
  };

  // ── Overlay tab content ─────────────────────────────────────────
  const OVERLAY_COLOR_GRID = [
    '#ffffff', '#aaaaaa', '#666666', '#333333', '#000000',
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
    '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '__custom__',
  ];
  const OVERLAY_OPACITY_PRESETS = [5, 10, 15, 20, 30, 45, 60, 75, 90];

  const OverlayTab = () => (
    <div ref={overlayPopupRef} style={{ position: 'relative' }}>

      {/* ── Floating overlay color popup ──────────────────────── */}
      {overlayPopup === 'color' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 215),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
          maxHeight: 'min(400px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {OVERLAY_COLOR_GRID.map(col => {
              if (col === '__custom__') {
                return (
                  <div key="custom" style={{ position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                      </svg>
                    </div>
                    <input type="color" value={state.overlayColor}
                      onChange={e => updateState({ overlayColor: e.target.value })}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </div>
                );
              }
              const sel = state.overlayColor === col;
              return (
                <button key={col}
                  onClick={() => { updateState({ overlayColor: col }); setOverlayPopup(null); }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: col, flexShrink: 0,
                    outline: sel ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.08)',
                    outlineOffset: sel ? '2px' : '0px',
                    boxShadow: sel ? `0 0 14px ${col}88` : '0 1px 4px rgba(0,0,0,0.4)',
                    transform: sel ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.12s',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating overlay opacity popup ────────────────────── */}
      {overlayPopup === 'opacity' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 180),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
        }}>
          <div style={{ marginBottom: 10 }}>
            <input type="range" min={0} max={90} value={state.overlayOpacity}
              onChange={e => updateState({ overlayOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: state.overlayColor }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>0%</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{state.overlayOpacity}%</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>90%</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {OVERLAY_OPACITY_PRESETS.map(v => {
              const sel = state.overlayOpacity === v;
              return (
                <button key={v}
                  onClick={() => updateState({ overlayOpacity: v })}
                  style={{
                    padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: sel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                    outline: sel ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.1)',
                    color: sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                    fontSize: 11, fontWeight: 700, transition: 'all 0.12s',
                  }}>
                  {v}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating light overlay controls popup ──────────────── */}
      {overlayPopup === 'light' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 190),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
        }}>
          {/* Preset name */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0,
              background: '#fff',
            }}>
              {(() => {
                const p = LIGHT_OVERLAYS.find(x => x.id === state.lightOverlay);
                return p ? (
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundImage: p.background, backgroundSize: 'cover',
                    filter: p.filter,
                  }} />
                ) : null;
              })()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
              {LIGHT_OVERLAYS.find(x => x.id === state.lightOverlay)?.label ?? 'Overlay'}
            </span>
          </div>

          {/* Opacity slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Opacity</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{state.lightOverlayOpacity}%</span>
            </div>
            <input type="range" min={0} max={100} value={state.lightOverlayOpacity}
              onChange={e => updateState({ lightOverlayOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#a78bfa' }}
            />
          </div>

          {/* Blend mode — hidden when bgOnly since overlay is rendered normally behind device */}
          {!state.lightOverlayBgOnly && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Blend mode</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(['multiply', 'overlay', 'screen', 'soft-light'] as const).map(mode => {
                  const sel = state.lightOverlayBlend === mode;
                  return (
                    <button key={mode}
                      onClick={() => updateState({ lightOverlayBlend: mode })}
                      style={{
                        padding: '4px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: sel ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)',
                        outline: sel ? '1.5px solid rgba(167,139,250,0.7)' : '1px solid rgba(255,255,255,0.1)',
                        color: sel ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                        fontSize: 11, fontWeight: 600, transition: 'all 0.12s',
                      }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solo fondo toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: state.lightOverlayBgOnly ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                Background only
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                Overlay doesn't cover the device
              </div>
            </div>
            <button
              onClick={() => updateState({ lightOverlayBgOnly: !state.lightOverlayBgOnly })}
              style={{
                width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: state.lightOverlayBgOnly ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
                position: 'relative', transition: 'all 0.18s', flexShrink: 0,
              }}>
              <div style={{
                position: 'absolute', top: 3, left: state.lightOverlayBgOnly ? 19 : 3, width: 16, height: 16,
                borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>
      )}

      {/* Combined Overlay row — light presets scroll left, color overlay fixed right */}
      <Section label="Overlay">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>

          {/* Scrollable light preset thumbnails */}
          <div style={{
            flex: 1, display: 'flex', gap: 7, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {/* None */}
            <button
              onClick={() => { updateState({ lightOverlay: null }); setOverlayPopup(p => p === 'light' ? null : p); }}
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                outline: !state.lightOverlay ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Light presets */}
            {LIGHT_OVERLAYS.map(preset => {
              const active = state.lightOverlay === preset.id;
              const popupOpen = overlayPopup === 'light' && active;
              return (
                <button key={preset.id}
                  onClick={e => {
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    if (active && overlayPopup === 'light') { setOverlayPopup(null); }
                    else { updateState({ lightOverlay: preset.id }); setOverlayPopup('light'); }
                  }}
                  style={{
                    flexShrink: 0, width: 46, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer',
                    overflow: 'hidden', position: 'relative',
                    outline: active ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.1)',
                    background: '#fff',
                    boxShadow: popupOpen ? '0 0 0 3px rgba(167,139,250,0.5)' : 'none',
                    transition: 'box-shadow 0.15s',
                  }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: preset.background, backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: preset.filter,
                  }} />
                  {active && <div style={{ position: 'absolute', inset: 0, borderRadius: 11, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)' }} />}
                  {popupOpen && (
                    <div style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Vertical separator */}
          <div style={{ width: 1, height: 38, background: 'rgba(255,255,255,0.13)', flexShrink: 0 }} />

          {/* Color overlay controls — always visible, dimmed when off */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            opacity: state.overlayEnabled ? 1 : 0.45,
            transition: 'opacity 0.2s',
          }}>
            {/* Toggle pill */}
            <button
              onClick={() => updateState({ overlayEnabled: !state.overlayEnabled })}
              title={state.overlayEnabled ? 'Disable color overlay' : 'Enable color overlay'}
              style={{
                width: 32, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: state.overlayEnabled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
                position: 'relative', transition: 'background 0.2s',
              }}>
              <div style={{
                position: 'absolute', top: 2, left: state.overlayEnabled ? 13 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: state.overlayEnabled ? '#111' : 'rgba(255,255,255,0.6)',
                transition: 'left 0.2s, background 0.2s',
              }} />
            </button>

            {/* Color circle */}
            <button
              ref={overlayColorBtnRef}
              onClick={() => {
                if (!state.overlayEnabled) updateState({ overlayEnabled: true });
                if (overlayPopup === 'color') { setOverlayPopup(null); return; }
                const r = overlayColorBtnRef.current?.getBoundingClientRect();
                if (r) setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setOverlayPopup('color');
              }}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: state.overlayColor,
                outline: overlayPopup === 'color' ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.22)',
                outlineOffset: '2px',
                boxShadow: `0 0 8px ${state.overlayColor}55`,
                transition: 'all 0.14s',
              }}
            />

            {/* Opacity button */}
            <button
              ref={overlayOpacityBtnRef}
              onClick={() => {
                if (!state.overlayEnabled) updateState({ overlayEnabled: true });
                if (overlayPopup === 'opacity') { setOverlayPopup(null); return; }
                const r = overlayOpacityBtnRef.current?.getBoundingClientRect();
                if (r) setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setOverlayPopup('opacity');
              }}
              style={{
                width: 38, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: overlayPopup === 'opacity' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                outline: overlayPopup === 'opacity' ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
              }}>
              {state.overlayOpacity}%
            </button>
          </div>
        </div>

        {/* Subtle active-preset hint */}
        {state.lightOverlay && overlayPopup !== 'light' && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
              {state.lightOverlayOpacity}% · {state.lightOverlayBlend}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(167,139,250,0.45)', cursor: 'pointer' }}
              onClick={e => {
                const r = (e.currentTarget as HTMLSpanElement).getBoundingClientRect();
                setOverlayPopupAnchor({ x: r.left, y: r.top });
                setOverlayPopup('light');
              }}>Edit ›</span>
          </div>
        )}
      </Section>
    </div>
  );

  // ── Annotate tab content ────────────────────────────────────────
  const ANNOTATE_TOOLS_BAR = [
    { id: 'select' as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-7 1-4 7z"/></svg> },
    { id: 'pen'    as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg> },
    { id: 'marker' as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg> },
    { id: 'eraser' as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg> },
    { id: 'rect'   as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { id: 'text'   as const, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  ];

  // 5-column color palette (matches reference image)
  const ANNOTATE_COLOR_GRID = [
    '#ffffff', '#aaaaaa', '#666666', '#333333', '#000000',
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
    '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '__custom__',
  ];
  const ANNOTATE_SIZES: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];

  type AnnotateShapeId = 'arrow' | 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'spiral' | 'wave';
  const ANNOTATE_SHAPES: { id: AnnotateShapeId; label: string; icon: React.ReactNode }[] = [
    { id: 'arrow',    label: 'Flecha',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg> },
    { id: 'rect',     label: 'Rect',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { id: 'circle',   label: 'Círculo', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg> },
    { id: 'ellipse',  label: 'Elipse',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg> },
    { id: 'triangle', label: 'Triáng.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,22 2,22"/></svg> },
    { id: 'diamond',  label: 'Rombo',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 23,12 12,23 1,12"/></svg> },
    { id: 'star',     label: 'Estrella',icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 15.09,8.26 23,9.27 17.5,14.63 18.18,22.54 12,19.27 5.82,22.54 6.5,14.63 1,9.27 8.91,8.26"/></svg> },
    { id: 'hexagon',  label: 'Hexág.',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 21.66,6.5 21.66,17.5 12,23 2.34,17.5 2.34,6.5"/></svg> },
    { id: 'spiral',   label: 'Espiral', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12 C12 12, 18 10, 18 6 C18 2, 12 1, 8 3 C3 5, 2 11, 5 15 C8 19, 15 20, 19 17 C23 14, 22 7, 19 4"/></svg> },
    { id: 'wave',     label: 'Onda',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 Q5 6, 8 12 Q11 18, 14 12 Q17 6, 20 12 Q21.5 15, 22 12"/></svg> },
  ];

  const currentShapeItem = ANNOTATE_SHAPES.find(s =>
    state.annotateTool === 'arrow' ? s.id === 'arrow' : s.id === (state.annotateShape ?? 'rect')
  ) ?? ANNOTATE_SHAPES[0];

  const AnnotateTab = () => (
    <div ref={annotatePopupRef} style={{ position: 'relative' }}>

      {/* ── Floating color popup ───────────────────────────────── */}
      {annotatePopup === 'color' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 220, -110),
          top: clampT(annotatePopupAnchor.y - 290),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 12,
          width: safeW(220),
          maxHeight: 'min(400px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          {/* Color grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {ANNOTATE_COLOR_GRID.map(col => {
              if (col === '__custom__') {
                return (
                  <div key="custom" style={{ position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                      </svg>
                    </div>
                    <input type="color" value={state.annotateColor}
                      onChange={e => { updateState({ annotateColor: e.target.value }); }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </div>
                );
              }
              const sel = state.annotateColor === col;
              return (
                <button key={col}
                  onClick={() => { updateState({ annotateColor: col }); setAnnotatePopup(null); }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: col, flexShrink: 0,
                    outline: sel ? `3px solid rgba(255,255,255,0.9)` : '2px solid rgba(255,255,255,0.08)',
                    outlineOffset: sel ? '2px' : '0px',
                    boxShadow: sel ? `0 0 14px ${col}88` : '0 1px 4px rgba(0,0,0,0.4)',
                    transform: sel ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.12s',
                  }}
                />
              );
            })}
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', margin: '0 -2px' }} />

          {/* Opacity slider */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Opacidad
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={5} max={100} step={1}
                value={Math.round((state.annotateOpacity ?? 1) * 100)}
                onChange={e => updateState({ annotateOpacity: Number(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', minWidth: 34, textAlign: 'right' }}>
                {Math.round((state.annotateOpacity ?? 1) * 100)}%
              </span>
            </div>
          </div>

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', margin: '0 -2px' }} />

          {/* Grosor slider */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Grosor
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={1} max={40} step={1}
                value={state.annotateLineWidth ?? 5}
                onChange={e => updateState({ annotateLineWidth: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', minWidth: 34, textAlign: 'right' }}>
                {state.annotateLineWidth ?? 5}px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating size popup ───────────────────────────────── */}
      {annotatePopup === 'size' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 260, -130),
          top: clampT(annotatePopupAnchor.y - 90),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '12px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          width: safeW(260),
        }}>
          {ANNOTATE_SIZES.map(sz => {
            const sel = state.annotateSize === sz;
            const dotPx = sz === 'S' ? 5 : sz === 'M' ? 10 : sz === 'L' ? 17 : 26;
            return (
              <button key={sz}
                onClick={() => { updateState({ annotateSize: sz, annotateLineWidth: { S: 2, M: 5, L: 10, XL: 18 }[sz] }); setAnnotatePopup(null); }}
                style={{
                  width: 52, height: 52, borderRadius: 13, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: sel ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                  outline: sel ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.12s',
                }}>
                <div style={{
                  width: dotPx, height: dotPx, borderRadius: '50%',
                  background: sel ? state.annotateColor : 'rgba(255,255,255,0.5)',
                  boxShadow: sel ? `0 0 10px ${state.annotateColor}88` : 'none',
                  transition: 'all 0.12s',
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                  color: sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                }}>{sz}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Floating shapes popup ──────────────────────────────── */}
      {annotatePopup === 'shapes' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 230, -115),
          top: clampT(annotatePopupAnchor.y - 230),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 8,
          width: safeW(230),
          maxHeight: 'min(350px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 }}>Forma</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {ANNOTATE_SHAPES.map(sh => {
              const sel = currentShapeItem.id === sh.id;
              return (
                <button key={sh.id}
                  onClick={() => {
                    updateState({
                      annotateShape: sh.id,
                      annotateTool: sh.id === 'arrow' ? 'arrow' : 'rect',
                      annotateMode: true,
                    });
                    setAnnotatePopup(null);
                  }}
                  style={{
                    width: 64, height: 64, borderRadius: 14, border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: sel ? `${state.annotateColor}22` : 'rgba(255,255,255,0.07)',
                    outline: sel ? `2px solid ${state.annotateColor}` : '1px solid rgba(255,255,255,0.1)',
                    color: sel ? state.annotateColor : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.12s',
                  }}>
                  {sh.icon}
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: sel ? state.annotateColor : 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{sh.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Single toolbar row ────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 4, padding: '10px 6px',
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {/* Tool buttons */}
        {ANNOTATE_TOOLS_BAR.map(t => {
          const active = state.annotateTool === t.id;
          if (t.id === 'rect') {
            const shapeActive = state.annotateTool === 'rect' || state.annotateTool === 'arrow';
            return (
              <button key={t.id} ref={shapeBtnRef}
                onClick={() => {
                  if (annotatePopup === 'shapes') { setAnnotatePopup(null); return; }
                  const r = shapeBtnRef.current?.getBoundingClientRect();
                  if (r) setAnnotatePopupAnchor({ x: r.left + r.width / 2, y: r.top });
                  setAnnotatePopup('shapes');
                }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 38, borderRadius: 11, border: 'none', cursor: 'pointer', gap: 1,
                  background: shapeActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  outline: annotatePopup === 'shapes' ? '1.5px solid rgba(255,255,255,0.7)' : shapeActive ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
                  color: shapeActive ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.14s', position: 'relative',
                }}>
                {currentShapeItem.icon}
                <svg width="7" height="5" viewBox="0 0 7 5" style={{ opacity: 0.5, position: 'absolute', bottom: 3, right: 4 }}>
                  <path d="M0.5 0.5L3.5 3.5L6.5 0.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
            );
          }
          return (
            <button key={t.id}
              onClick={() => { updateState({ annotateTool: t.id, annotateMode: true }); setAnnotatePopup(null); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 38, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                outline: active ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
                color: active ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.55)',
                transition: 'all 0.14s',
              }}>
              {t.icon}
            </button>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 2px' }} />

        {/* Color button */}
        <button
          ref={colorBtnRef}
          onClick={() => {
            if (annotatePopup === 'color') { setAnnotatePopup(null); return; }
            const r = colorBtnRef.current?.getBoundingClientRect();
            if (r) setAnnotatePopupAnchor({ x: r.left + r.width / 2, y: r.top });
            setAnnotatePopup('color');
          }}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: state.annotateColor,
            outline: annotatePopup === 'color' ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.25)',
            outlineOffset: '2px',
            boxShadow: `0 0 12px ${state.annotateColor}66`,
            transition: 'all 0.14s',
          }}
        />

        {/* Size button */}
        <button
          ref={sizeBtnRef}
          onClick={() => {
            if (annotatePopup === 'size') { setAnnotatePopup(null); return; }
            const r = sizeBtnRef.current?.getBoundingClientRect();
            if (r) setAnnotatePopupAnchor({ x: r.left + r.width / 2, y: r.top });
            setAnnotatePopup('size');
          }}
          style={{
            width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: annotatePopup === 'size' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            outline: annotatePopup === 'size' ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.85)',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.04em',
            transition: 'all 0.14s',
          }}>
          {state.annotateSize}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 2px' }} />

        {/* Clear */}
        <button
          onClick={() => updateState({ annotateClearKey: (state.annotateClearKey ?? 0) + 1, annotateStrokes: [] })}
          style={{
            padding: '0 8px', height: 34, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: 'transparent', color: 'rgba(239,100,100,0.9)',
            fontSize: 11, fontWeight: 700, transition: 'all 0.14s',
          }}>
          Clear
        </button>
      </div>
    </div>
  );

  // ── Scene tab content ───────────────────────────────────────────
  const SceneTab = () => {
    const openScene = (id: 'canvas' | 'motion' | 'effects' | 'shadow', e: React.MouseEvent) => {
      if (scenePopup === id) { setScenePopup(null); return; }
      const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
      setScenePopupAnchor({ x: r.left + r.width / 2, y: r.top });
      setScenePopup(id);
    };

    const POPUP_BASE: React.CSSProperties = {
      position: 'fixed',
      left: scenePopupAnchor ? clampL(scenePopupAnchor.x, 262, -130) : 0,
      bottom: scenePopupAnchor ? window.innerHeight - scenePopupAnchor.y + 8 : 0,
      width: safeW(262),
      maxHeight: 'min(500px, calc(100vh - 80px))',
      overflowY: 'auto',
      background: 'rgba(18,20,26,0.98)',
      borderRadius: 18, padding: '14px 16px', zIndex: 9999,
      boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(22px)',
    };

    const POP_LABEL: React.CSSProperties = {
      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
    };

    const ROW: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 0',
    };

    const ROW_LABEL: React.CSSProperties = {
      fontSize: 11, color: 'rgba(255,255,255,0.55)',
    };

    const DIVIDER: React.CSSProperties = {
      borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0',
    };

    // Summary helpers for button sub-labels
    const canvasSub = state.canvasRatio === 'free' ? 'Free' : state.canvasRatio;
    const motionOn  = state.autoRotate || state.animation === 'float';
    const effectsOn = (state.reflection ?? false) || (state.grain ?? false);
    const shadowPct = state.contactShadowOpacity;

    const SceneBtn = ({ id, icon, label, active, accent }: {
      id: 'canvas' | 'motion' | 'effects' | 'shadow';
      icon: React.ReactNode; label: string; sub?: string; active?: boolean; accent: string;
    }) => (
      <button
        title={label}
        onClick={e => openScene(id, e)}
        style={{
          flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: scenePopup === id ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.5)',
          outline: scenePopup === id
            ? '2px solid rgba(167,139,250,0.8)'
            : active ? '2px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.13)',
          color: scenePopup === id ? 'rgba(167,139,250,1)' : active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.12s',
        }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: scenePopup === id
            ? 'rgba(167,139,250,0.18)'
            : active
              ? accent
              : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          boxShadow: active
            ? 'inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 12px rgba(0,0,0,0.18)'
            : 'inset 0 1px 0 rgba(255,255,255,0.08)',
          transition: 'all 0.12s',
        }}>
          {icon}
        </div>
      </button>
    );

    return (
      <>
        {/* ── Scene popup ─────────────────────────────────────── */}
        {scenePopup && scenePopupAnchor && (
          <div ref={scenePopupRef} style={POPUP_BASE}>

            {/* Canvas */}
            {scenePopup === 'canvas' && (
              <>
                <div style={POP_LABEL}>Canvas</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                  {CANVAS_RATIOS.map(r => (
                    <Chip key={r.id} active={state.canvasRatio === r.id}
                      onClick={() => updateState({ canvasRatio: r.id })}>{r.label}</Chip>
                  ))}
                </div>
                <Slider label="Corner Radius" value={state.canvasRadius ?? 0} min={0} max={80} step={2}
                  onChange={v => updateState({ canvasRadius: v })} unit="px" />
              </>
            )}

            {/* Motion */}
            {scenePopup === 'motion' && (
              <>
                <div style={POP_LABEL}>Device & Motion</div>
                <div style={ROW}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <RefreshCw size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span style={ROW_LABEL}>Auto Rotate</span>
                  </div>
                  <Toggle enabled={state.autoRotate} onToggle={() => updateState({ autoRotate: !state.autoRotate })} />
                </div>
                {state.autoRotate && (
                  <div style={{ marginTop: 6 }}>
                    <Slider label="Speed" value={Math.round(state.autoRotateSpeed * 10) / 10}
                      min={0.5} max={8} step={0.5} onChange={v => updateState({ autoRotateSpeed: v })} />
                  </div>
                )}
                <div style={DIVIDER} />
                <div style={ROW}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <RotateCcw size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                    <span style={ROW_LABEL}>Float</span>
                  </div>
                  <Toggle enabled={state.animation === 'float'}
                    onToggle={() => updateState({ animation: state.animation === 'float' ? 'none' : 'float' })} />
                </div>
              </>
            )}

            {/* Effects */}
            {scenePopup === 'effects' && (
              <>
                <div style={POP_LABEL}>Effects</div>
                <div style={ROW}>
                  <span style={ROW_LABEL}>Floor Reflection</span>
                  <Toggle enabled={state.reflection ?? false}
                    onToggle={() => updateState({ reflection: !(state.reflection ?? false) })} />
                </div>
                {(state.reflection ?? false) && (
                  <div style={{ marginTop: 6 }}>
                    <Slider label="Strength" value={state.reflectionOpacity ?? 50} min={0} max={100}
                      onChange={v => updateState({ reflectionOpacity: v })} unit="%" />
                  </div>
                )}
                <div style={DIVIDER} />
                <div style={ROW}>
                  <span style={ROW_LABEL}>Film Grain</span>
                  <Toggle enabled={state.grain ?? false}
                    onToggle={() => updateState({ grain: !(state.grain ?? false) })} />
                </div>
                {(state.grain ?? false) && (
                  <div style={{ marginTop: 6 }}>
                    <Slider label="Intensity" value={state.grainIntensity ?? 35} min={5} max={100}
                      onChange={v => updateState({ grainIntensity: v })} unit="%" />
                  </div>
                )}
              </>
            )}

            {/* Shadow */}
            {scenePopup === 'shadow' && (
              <>
                <div style={POP_LABEL}>Shadow</div>
                <Slider label="Intensity" value={state.contactShadowOpacity} min={0} max={100}
                  onChange={v => updateState({ contactShadowOpacity: v })} unit="%" />
              </>
            )}
          </div>
        )}

        {/* ── Combined row: Scene buttons + Lighting presets ──── */}
        <Section label="Scene">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Scene buttons (fixed) */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <SceneBtn id="canvas" label="Canvas" active={state.canvasRatio !== 'free' || (state.canvasRadius ?? 0) > 0} accent="linear-gradient(135deg, rgba(59,130,246,0.32), rgba(14,165,233,0.22))"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M8 9h8M8 13h4" opacity="0.9"/></svg>}
              />
              <SceneBtn id="motion" label="Motion" active={motionOn} accent="linear-gradient(135deg, rgba(16,185,129,0.3), rgba(34,197,94,0.2))"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15c2.5-4 5.5-6 9-6 2.8 0 5 .9 7 2.6"/><path d="M14.5 6.5 20 11l-5.5 4.5"/></svg>}
              />
              <SceneBtn id="effects" label="Effects" active={effectsOn} accent="linear-gradient(135deg, rgba(244,114,182,0.3), rgba(168,85,247,0.2))"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5 14.1 9l5.9 2.1-5.9 2.1L12 18.5l-2.1-5.3L4 11.1 9.9 9 12 3.5Z"/><circle cx="18.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/></svg>}
              />
              <SceneBtn id="shadow" label="Shadow" active={(shadowPct ?? 0) > 0} accent="linear-gradient(135deg, rgba(99,102,241,0.3), rgba(71,85,105,0.22))"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11.5c0-2.8 2.2-5 5-5 1.9 0 3.6 1 4.5 2.6"/><path d="M6 16.5c1.8-1.2 3.9-1.8 6-1.8 2.4 0 4.5.6 6.4 1.8" opacity="0.95"/><ellipse cx="12" cy="18.3" rx="7" ry="2.2" opacity="0.7"/></svg>}
              />
            </div>

            {/* Divider */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

            {/* ENV preset thumbnail — single button, opens popup */}
            {(() => {
              const activeEnv = ENV_PRESETS.find(e => e.id === state.envPreset) ?? ENV_PRESETS[0];
              const envOn = state.envEnabled !== false;
              return (
                <button
                  ref={envBtnRef}
                  title={`Entorno: ${activeEnv.label}`}
                  onClick={() => {
                    if (envPopupOpen) { setEnvPopupOpen(false); return; }
                    const r = envBtnRef.current?.getBoundingClientRect();
                    if (r) setEnvPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    setEnvPopupOpen(true);
                  }}
                  style={{
                    flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: envPopupOpen ? 'rgba(255,255,255,0.18)' : envOn ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                    outline: envPopupOpen
                      ? '2px solid rgba(167,139,250,0.85)'
                      : envOn ? '2px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.14)',
                    color: envPopupOpen ? 'rgba(167,139,250,1)' : envOn ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.3)',
                    opacity: envOn ? 1 : 0.5,
                    transition: 'all 0.12s',
                  }}>
                  {ENV_ICON[activeEnv.id]}
                  <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1, color: 'inherit' }}>
                    {activeEnv.label.toUpperCase()}
                  </span>
                </button>
              );
            })()}

            {/* Divider */}
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

            {/* Light controls button */}
            <button
              ref={lightBtnRef}
              onClick={() => {
                if (lightPopupOpen) { setLightPopupOpen(false); return; }
                const r = lightBtnRef.current?.getBoundingClientRect();
                if (r) setLightPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setLightPopupOpen(true);
              }}
              title="Light controls"
              style={{
                flexShrink: 0, width: 46, height: 46, padding: 0, borderRadius: 11, border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                background: lightPopupOpen ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                outline: lightPopupOpen ? '2px solid rgba(167,139,250,0.85)' : '1px solid rgba(255,255,255,0.14)',
                color: lightPopupOpen ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.14s',
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1, color: 'inherit' }}>LIGHT</span>
            </button>

          </div>
        </Section>

        {/* Floating light-controls popup */}
        {lightPopupOpen && lightPopupAnchor && (
          <div ref={lightPopupRef} style={{
            position: 'fixed',
            left: clampL(lightPopupAnchor.x, 262, -130),
            bottom: window.innerHeight - lightPopupAnchor.y + 8,
            width: safeW(262),
            maxHeight: 'min(500px, calc(100vh - 80px))',
            overflowY: 'auto',
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '14px 16px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Light Controls</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
              <MiniSlider label="Brightness" value={state.lightBrightness ?? 40} min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightBrightness: v })} />
              <MiniSlider label="Ambient"    value={state.lightAmbient ?? 45}    min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightAmbient: v })} />
              <MiniSlider label="Warmth"     value={state.lightWarmth ?? 0}      min={-50} max={50} step={1}      onChange={v => updateState({ lightWarmth: v })} />
              <MiniSlider label="Reflections" value={state.lightIBL ?? 40}       min={0} max={100} step={1} unit="%" onChange={v => updateState({ lightIBL: v })} />
              <MiniSlider label="Exposure"   value={Math.round((state.lightExposure ?? 1.0) * 100) / 100} min={0.4} max={2.0} step={0.05} onChange={v => updateState({ lightExposure: v })} />
              <MiniSlider label="Bloom"      value={state.bloomIntensity ?? 22}  min={0} max={100} step={1} unit="%" onChange={v => updateState({ bloomIntensity: v })} />
            </div>

            {/* DSLR Camera Lens Controls */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>DSLR Lens</span>
                <button
                  onClick={() => updateState({ dofEnabled: !(state.dofEnabled ?? false) })}
                  style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: (state.dofEnabled ?? false) ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)',
                    color: (state.dofEnabled ?? false) ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                  }}
                >{(state.dofEnabled ?? false) ? 'ON' : 'OFF'}</button>
              </div>
              {(state.dofEnabled ?? false) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
                  <MiniSlider label="Focus" value={Math.round((state.dofFocusDistance ?? 0.02) * 100)} min={0} max={30} step={1} unit="%" onChange={v => updateState({ dofFocusDistance: v / 100 })} />
                  <MiniSlider label="Aperture" value={Math.round((state.dofFocalLength ?? 0.05) * 100)} min={1} max={20} step={1} onChange={v => updateState({ dofFocalLength: v / 100 })} />
                  <MiniSlider label="Bokeh" value={state.dofBokehScale ?? 6} min={0} max={20} step={1} onChange={v => updateState({ dofBokehScale: v })} />
                </div>
              )}
            </div>

            {/* Clay Mode Controls */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Clay Mode</span>
                <button
                  onClick={() => updateState({ clayMode: !(state.clayMode ?? false) })}
                  style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: (state.clayMode ?? false) ? 'rgba(232,221,211,0.25)' : 'rgba(255,255,255,0.06)',
                    color: (state.clayMode ?? false) ? '#e8ddd3' : 'rgba(255,255,255,0.35)',
                  }}
                >{(state.clayMode ?? false) ? 'ON' : 'OFF'}</button>
              </div>
              {(state.clayMode ?? false) && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['#e8ddd3', '#ffffff', '#2d2d2d', '#d4a574', '#c1b8ae', '#8b7355', '#f5e6d3', '#1a1a2e'].map(c => (
                    <button key={c}
                      onClick={() => updateState({ clayColor: c })}
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer',
                        background: c,
                        outline: (state.clayColor ?? '#e8ddd3') === c ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.15)',
                        outlineOffset: 1,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ENV preset picker popup */}
        {envPopupOpen && envPopupAnchor && (
          <div ref={envPopupRef} style={{
            position: 'fixed',
            left: clampL(envPopupAnchor.x, 228, -110),
            bottom: window.innerHeight - envPopupAnchor.y + 8,
            width: safeW(228),
            maxHeight: 'min(400px, calc(100vh - 80px))',
            overflowY: 'auto',
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '14px 14px 16px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80), 0 2px 12px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
              Entorno
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {ENV_PRESETS.map(env => {
                const active = state.envPreset === env.id && state.envEnabled !== false;
                return (
                  <button key={env.id}
                    onClick={() => { updateState({ envPreset: env.id, envEnabled: true }); setEnvPopupOpen(false); }}
                    style={{
                      padding: '10px 4px 8px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)',
                      outline: active ? '2px solid rgba(255,255,255,0.75)' : '1px solid rgba(255,255,255,0.09)',
                      color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.12s',
                    }}>
                    {ENV_ICON[env.id]}
                    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.03em', lineHeight: 1 }}>
                      {env.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Env on/off toggle row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Entorno activo</span>
              <button
                onClick={() => updateState({ envEnabled: !(state.envEnabled !== false) })}
                style={{
                  width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: state.envEnabled !== false ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: 1, left: state.envEnabled !== false ? 13 : 1,
                  width: 16, height: 16, borderRadius: '50%',
                  background: state.envEnabled !== false ? '#111' : 'rgba(255,255,255,0.6)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
          </div>
        )}
    </>
  );
  };

  // ── Presets tab ─────────────────────────────────────────────────
  const PresetsTab = () => {
    const activePose = PRESENT_POSES.find(p => p.id === state.cameraAngle) ?? PRESENT_POSES[0];
    const scalePct   = state.deviceScale ?? 100;

    return (
      <>
        {/* ── Scale popup ─────────────────────────────────── */}
        {presentsPopupOpen && presentsPopupAnchor && (
          <div ref={presentsPopupRef} style={{
            position: 'fixed',
            left: clampL(presentsPopupAnchor.x, 262, -130),
            bottom: window.innerHeight - presentsPopupAnchor.y + 8,
            width: safeW(262),
            maxHeight: 'min(400px, calc(100vh - 80px))',
            overflowY: 'auto',
            background: 'rgba(18,20,26,0.98)',
            borderRadius: 18, padding: '14px 16px', zIndex: 9999,
            boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(22px)',
          }}>
            {/* Active pose preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <PoseThumbnail ry={activePose.ry} rx={activePose.rx} rz={activePose.rz} active={true} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Scale</div>
            <Slider label="Scale" value={scalePct} min={40} max={160} step={5}
              onChange={v => updateState({ deviceScale: v })} unit="%" />
          </div>
        )}

        {/* ── Compact row: poses chips + scale button ──────── */}
        <Section label="Presents">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>

            {/* Scrollable pose chips */}
            <div style={{
              flex: 1, display: 'flex', gap: 5, overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            } as React.CSSProperties}>
              {PRESENT_POSES.map(pose => {
                const active = state.cameraAngle === pose.id;
                return (
                  <button key={pose.id}
                    onClick={() => updateState({ cameraAngle: pose.id, cameraResetKey: (state.cameraResetKey ?? 0) + 1 })}
                    style={{
                      flexShrink: 0, padding: '5px 14px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                      outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.14)',
                      color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.12s',
                    }}>
                    <PoseThumbnail ry={pose.ry} rx={pose.rx} rz={pose.rz} active={active} mini />
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {pose.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

            {/* Scale indicator button */}
            <button
              ref={presentsBtnRef}
              onClick={() => {
                if (presentsPopupOpen) { setPresentsPopupOpen(false); return; }
                const r = presentsBtnRef.current?.getBoundingClientRect();
                if (r) setPresentsPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setPresentsPopupOpen(true);
              }}
              style={{
                flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: presentsPopupOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                outline: presentsPopupOpen ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
                color: presentsPopupOpen ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
                fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 21l-6-6m6 6v-4m0 4h-4M3 3l6 6M3 3v4m0-4h4"/>
              </svg>
              {scalePct}%
            </button>
          </div>
        </Section>
      </>
    );
  };

  // ── Template tab ─────────────────────────────────────────────────
  const TemplateTab = () => {
    type Fmt = { id: CanvasRatio; label: string; name: string; platforms: string; value: number; accent: string };

    const SOCIAL: Fmt[] = [
      { id: '1:1',  label: '1:1',  name: 'Square',   platforms: 'Instagram · Facebook', value: 1,      accent: '#E1306C' },
      { id: '4:5',  label: '4:5',  name: 'Portrait', platforms: 'Instagram Post',        value: 4/5,    accent: '#C13584' },
      { id: '9:16', label: '9:16', name: 'Story',    platforms: 'Instagram · TikTok',   value: 9/16,   accent: '#FF0050' },
      { id: '16:9', label: '16:9', name: 'Video',    platforms: 'YouTube · Twitter',    value: 16/9,   accent: '#FF0000' },
      { id: '2:3',  label: '2:3',  name: 'Pin',      platforms: 'Pinterest',             value: 2/3,    accent: '#E60023' },
      { id: '3:1',  label: '3:1',  name: 'Banner',   platforms: 'Twitter · LinkedIn',   value: 3,      accent: '#0A66C2' },
    ];

    const SLIDES: Fmt[] = [
      { id: '16:9', label: '16:9', name: 'Widescreen', platforms: 'Google Slides · PowerPoint', value: 16/9, accent: '#4285F4' },
      { id: '4:3',  label: '4:3',  name: 'Standard',   platforms: 'PowerPoint · Keynote',       value: 4/3,  accent: '#D24726' },
      { id: '3:2',  label: '3:2',  name: 'Classic',    platforms: 'Keynote · Photography',      value: 3/2,  accent: '#9B9B9B' },
      { id: '5:4',  label: '5:4',  name: 'Photo',      platforms: 'Print · Presentation',       value: 5/4,  accent: '#FBBC05' },
    ];

    const MAX_W = 40, MAX_H = 30;

    const RatioTile = ({ fmt }: { fmt: Fmt }) => {
      const isActive = state.canvasRatio === fmt.id;
      const rw = Math.min(MAX_W, MAX_H * fmt.value);
      const rh = Math.min(MAX_H, MAX_W / fmt.value);
      return (
        <button
          onClick={() => updateState({ canvasRatio: fmt.id })}
          style={{
            flexShrink: 0, width: 72, height: 86, borderRadius: 11,
            background: isActive ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
            border: 'none', cursor: 'pointer', padding: 0,
            outline: isActive ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.13)',
            transition: 'all 0.12s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
          <div style={{
            width: rw, height: rh, flexShrink: 0, marginBottom: 8,
            border: `1.5px solid ${isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)'}`,
            borderRadius: 2,
            background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            transition: 'all 0.12s',
          }} />
          <span style={{
            fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
            color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
          }}>
            {fmt.label}
          </span>
          <span style={{
            fontSize: 7.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
            marginTop: 3, lineHeight: 1,
          }}>
            {fmt.name}
          </span>
        </button>
      );
    };

    const Divider = () => (
      <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)', flexShrink: 0, alignSelf: 'center' }} />
    );

    return (
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as React.CSSProperties}>
        {SOCIAL.map(fmt => <RatioTile key={fmt.id + fmt.name} fmt={fmt} />)}
        <Divider />
        {SLIDES.map(fmt => <RatioTile key={fmt.id + fmt.name} fmt={fmt} />)}
      </div>
    );
  };

  // ── Mobile content-only mode (rendered by App.tsx inside a floating sheet) ──
  if (mobile && mobileContentOnly !== undefined) {
    return (
      <div className="panel-text-contrast" style={{ padding: '12px 0 16px' }}>
        {mobileContentOnly === 'presets'    && <PresetsTab />}
        {mobileContentOnly === 'template'   && <TemplateTab />}
        {mobileContentOnly === 'device'     && <DeviceTab />}
        {mobileContentOnly === 'background' && <BackgroundTab />}
        {mobileContentOnly === 'overlay'    && <OverlayTab />}
        {mobileContentOnly === 'annotate'   && <AnnotateTab />}
        {mobileContentOnly === 'canvas'     && <SceneTab />}
      </div>
    );
  }

  // ── Mobile shell — content top, pill nav bottom (like reference image) ──
  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Active tab content — scrollable, fills space above the pill bar */}
        <div className="styled-scroll panel-text-contrast" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px 8px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
        </div>

        {/* Pill tab bar — fixed at the bottom of the panel */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          padding: '8px 14px 12px', flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          scrollbarWidth: 'none',
        } as React.CSSProperties}>
          {TAB_ICONS.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 22, fontSize: 12, fontWeight: 600,
                  background: active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)',
                  border: '1px solid transparent',
                  color: active ? '#0d0e0f' : 'rgba(255,255,255,0.48)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}>
                <Icon size={13} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Desktop shell (icon rail + content panel) ─────────────────
  return (
    <div style={{ display: 'flex', height: '100%', flexShrink: 0, overflow: 'hidden' }}>

      {/* Icon rail */}
      <div style={{
        width: 54, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 4px', gap: 2, flexShrink: 0,
        background: 'var(--rt-panel)',
        borderRight: '1px solid var(--rt-border)',
      }}>
        {/* Brand logo */}
        <div style={{
          width: 30, height: 30, borderRadius: 8, marginBottom: 10,
          background: 'rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0d0e0f', fontWeight: 900, fontSize: 13, flexShrink: 0,
          fontStyle: 'italic',
        }}>M</div>

        {TAB_ICONS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} title={label}
            style={{
              width: 44, height: 46, borderRadius: 8, border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              background: activeTab === id ? 'rgba(255,255,255,0.09)' : 'transparent',
              outline: 'none',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
            <Icon size={15} strokeWidth={activeTab === id ? 2 : 1.5}
              style={{ color: activeTab === id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.33)' }} />
            <span style={{ fontSize: 8, fontWeight: 600, color: activeTab === id ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div style={{
        width: 240, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
        background: 'var(--rt-panel-2)',
        borderRight: '1px solid var(--rt-border)',
      }}>
        {/* Tab header */}
        <div style={{ padding: '11px 14px 9px', borderBottom: '1px solid var(--rt-border)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
            {TAB_ICONS.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="styled-scroll panel-text-contrast" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
        </div>
      </div>
    </div>
  );
}

