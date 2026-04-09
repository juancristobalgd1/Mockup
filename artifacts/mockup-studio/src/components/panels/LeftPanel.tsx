import { useState, useRef, useEffect, memo } from 'react';
import {
  Smartphone, Shuffle, Wand2, Image as ImageIcon, Sliders, Type,
  LayoutGrid, X, RefreshCw, Sun, RotateCcw, Search,
} from 'lucide-react';
import type { Tab } from './tabs';
import { TAB_ICONS } from './tabs';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, PRESETS } from '../../data/backgrounds';
import { LIGHT_OVERLAYS } from '../../data/lightOverlays';
import { DEVICE_MODELS, DEVICE_GROUPS, GROUP_ICONS, getModelById } from '../../data/devices';
import type { DeviceGroup } from '../../data/devices';
import type { DeviceColor, EnvPreset } from '../../store';

type IconProps = { size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string };

const IPHONE_COLORS: { id: DeviceColor; label: string; bg: string; border: string }[] = [
  { id: 'titanium',     label: 'Titanium',    bg: 'linear-gradient(135deg, #3a3a3a, #1e1e1e)', border: '#555'    },
  { id: 'black',        label: 'Black',       bg: 'linear-gradient(135deg, #1a1a1a, #050505)', border: '#333'    },
  { id: 'white',        label: 'White',       bg: 'linear-gradient(135deg, #d8d8d8, #b0b0b0)', border: '#aaa'    },
  { id: 'blue',         label: 'Blue',        bg: 'linear-gradient(135deg, #2a3f6f, #0f1e40)', border: '#3a5080' },
  { id: 'naturallight', label: 'Natural',     bg: 'linear-gradient(135deg, #c2b8a3, #a8a090)', border: '#a89c8a' },
  { id: 'desert',       label: 'Desert',      bg: 'linear-gradient(135deg, #9c8878, #7a6858)', border: '#8a7868' },
  { id: 'sierra',       label: 'Sierra',      bg: 'linear-gradient(135deg, #6b8ca3, #4a6e8a)', border: '#5a7a90' },
  { id: 'clay',         label: 'Clay',        bg: 'linear-gradient(135deg, #e4dfd5, #cec9bf)', border: '#c0bab0' },
];

const ENV_PRESETS: { id: 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night'; label: string; icon: string }[] = [
  { id: 'studio',    label: 'Studio',    icon: '🎬' },
  { id: 'warehouse', label: 'Warehouse', icon: '🏭' },
  { id: 'city',      label: 'City',      icon: '🌆' },
  { id: 'sunset',    label: 'Sunset',    icon: '🌅' },
  { id: 'forest',    label: 'Forest',    icon: '🌲' },
  { id: 'night',     label: 'Night',     icon: '🌙' },
];

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
const Section = ({ label, children, action }: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
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
function PoseThumbnail({ ry, rx, rz, active }: {
  ry: number; rx: number; rz: number; active: boolean;
}) {
  const bodyColor   = active ? '#d0d0d0' : '#484848';
  const screenColor = active ? '#ffffff' : '#111111';
  const frameColor  = active ? '#b0b0b0' : '#333333';

  return (
    <div style={{
      width: 52, height: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: 180,
    }}>
      <div style={{
        width: 22, height: 46,
        transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
      }}>
        {/* Phone body */}
        <div style={{
          width: '100%', height: '100%',
          background: bodyColor,
          borderRadius: 5,
          boxShadow: active
            ? '3px 6px 20px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(255,255,255,0.3)'
            : '2px 4px 10px rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}>
          {/* Screen */}
          <div style={{
            width: '74%', height: '78%',
            background: screenColor,
            borderRadius: 2,
            transition: 'background 0.3s',
          }} />
          {/* Dynamic island notch */}
          <div style={{
            position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
            width: 8, height: 2, borderRadius: 1,
            background: frameColor,
            transition: 'background 0.3s',
          }} />
        </div>
        {/* Side button */}
        <div style={{
          position: 'absolute', right: -1, top: '28%',
          width: 1.5, height: 8, borderRadius: 1,
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
  const [extracting, setExtracting]         = useState(false);

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'image', bgImage: URL.createObjectURL(file) });
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

  // ── Device tab content — searchable 3-column grid ───────────────
  // Auto-derived from DEVICE_MODELS: no manual update needed when adding new groups.
  const GROUP_TO_STORETYPE = Object.fromEntries(
    DEVICE_MODELS.map(m => [m.group, m.storeType])
  ) as Record<DeviceGroup, string>;

  const DeviceTab = () => {
    const q = deviceSearch.trim().toLowerCase();
    const baseModels = q
      ? DEVICE_MODELS.filter(m => m.label.toLowerCase().includes(q))
      : DEVICE_MODELS;

    const models = (mobile && mobileDeviceFilter !== 'All')
      ? baseModels.filter(m => m.storeType === GROUP_TO_STORETYPE[mobileDeviceFilter as DeviceGroup])
      : baseModels;

    const filterGroups: (DeviceGroup | 'All')[] = ['All', ...DEVICE_GROUPS];

    return (
      <>
        {/* Mobile filter strip */}
        {mobile && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12, paddingBottom: 2,
            scrollbarWidth: 'none',
          } as React.CSSProperties}>
            {filterGroups.map(group => {
              const active = mobileDeviceFilter === group;
              const icon = group === 'All' ? '✦' : GROUP_ICONS[group as DeviceGroup];
              return (
                <button key={group}
                  onClick={() => setMobileDeviceFilter(group)}
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 13px', borderRadius: 20,
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: active ? '1px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.07)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                  }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {group}
                </button>
              );
            })}
          </div>
        )}

        {/* Desktop search bar */}
        {!mobile && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={12} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.28)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search..."
            value={deviceSearch}
            onChange={e => setDeviceSearch(e.target.value)}
            className="rt-input"
            style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        )}

        {/* Device list — horizontal slider on mobile, 3-col grid on desktop */}
        {mobile ? (
          <div style={{
            display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            marginBottom: 14,
          } as React.CSSProperties}>
            {models.map(model => {
              const isSelected = state.deviceModel === model.id;
              return (
                <button key={model.id}
                  onClick={() => updateState({ deviceModel: model.id, deviceType: model.storeType })}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    width: 80, padding: '14px 6px 10px', borderRadius: 18, gap: 0,
                    background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                    border: isSelected ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  <div style={{
                    height: 68, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'scale(1.5)', transformOrigin: 'center',
                  }}>
                    <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                    marginTop: 8, color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.58)',
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {model.label}
                  </span>
                </button>
              );
            })}
            {models.length === 0 && (
              <div style={{ padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                No devices found
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 14 }}>
            {models.map(model => {
              const isSelected = state.deviceModel === model.id;
              return (
                <button key={model.id}
                  onClick={() => updateState({ deviceModel: model.id, deviceType: model.storeType })}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '12px 4px 9px', borderRadius: 14, gap: 0,
                    background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                    border: isSelected ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  <div style={{
                    height: 60, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'scale(1.4)', transformOrigin: 'center',
                  }}>
                    <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                    marginTop: 6, color: isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.60)',
                  }}>
                    {model.label}
                  </span>
                  <span style={{
                    fontSize: 8, marginTop: 3,
                    color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {model.w}×{model.h}
                  </span>
                </button>
              );
            })}
            {models.length === 0 && (
              <div style={{
                gridColumn: '1 / -1', textAlign: 'center', padding: '24px 0',
                color: 'rgba(255,255,255,0.25)', fontSize: 11,
              }}>
                No devices found
              </div>
            )}
          </div>
        )}

        {/* Frame color dots */}
        {state.deviceType === 'iphone' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
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
        )}

        {/* Orientation */}
        {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active={!state.deviceLandscape} onClick={() => updateState({ deviceLandscape: false })}>Portrait</Chip>
            <Chip active={state.deviceLandscape}  onClick={() => updateState({ deviceLandscape: true })}>Landscape</Chip>
          </div>
        )}

        {/* Browser theme */}
        {state.deviceType === 'browser' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active={state.browserMode === 'dark'}  onClick={() => updateState({ browserMode: 'dark' })}>Dark</Chip>
            <Chip active={state.browserMode === 'light'} onClick={() => updateState({ browserMode: 'light' })}>Light</Chip>
          </div>
        )}
      </>
    );
  };

  // ── Background tab content ──────────────────────────────────────
  const BackgroundTab = () => {
    const bgTypeCards = [
      { id: 'solid',    label: 'Solid',    preview: { background: state.bgType === 'solid' ? state.bgColor : '#374151' } },
      { id: 'gradient', label: 'Gradient', preview: { background: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)' } },
      { id: 'mesh',     label: 'Mesh',     preview: { background: 'radial-gradient(at 30% 20%, #0ea5e9 0px, transparent 55%), radial-gradient(at 80% 70%, #ec4899 0px, transparent 55%), #03111e' } },
      { id: 'wallpaper',label: 'Wallpaper',preview: { background: 'radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #60a5fa 60%, #dbeafe 100%)' } },
      { id: 'pattern',  label: 'Pattern',  preview: { backgroundColor: '#1a1c2e', backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '10px 10px' } },
      { id: 'image',    label: 'Image',    preview: null },
    ] as const;

    return (
      <>
        {/* Type grid */}
        <Section label="Type" action={
          <button onClick={handleShuffle} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
            fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
            transition: 'all 0.12s',
          }}>
            <Shuffle size={10} /> Shuffle
          </button>
        }>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' } as React.CSSProperties}>
            {bgTypeCards.map(({ id, label, preview }) => {
              const active = state.bgType === id;
              return (
                <button key={id} onClick={() => updateState({ bgType: id })}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '10px 8px 8px', borderRadius: 14, gap: 0, border: 'none',
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, marginBottom: 6, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.08)',
                    ...(preview ?? { background: '#1a1c2e' }),
                  }}>
                    {!preview && <ImageIcon size={16} color="rgba(255,255,255,0.40)" />}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                    color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)',
                  }}>{label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Solid color */}
        {state.bgType === 'solid' && (
          <Section label="Color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.1)' }} />
                <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
              <input type="text" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                className="rt-input" style={{ fontFamily: 'monospace' }} />
            </div>
          </Section>
        )}

        {/* Gradients */}
        {state.bgType === 'gradient' && (
          <Section label="Gradients">
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' } as React.CSSProperties}>
              {GRADIENTS.map(g => {
                const active = state.bgColor === g.id;
                return (
                  <button key={g.id} onClick={() => updateState({ bgColor: g.id })}
                    style={{
                      flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 8px 8px', borderRadius: 14, gap: 0, border: 'none',
                      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                      outline: active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 6,
                      background: g.css, border: '1px solid rgba(255,255,255,0.08)',
                    }} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                      color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                      whiteSpace: 'nowrap',
                    }}>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Mesh gradients */}
        {state.bgType === 'mesh' && (
          <Section label="Mesh Gradients" action={
            state.screenshotUrl ? (
              <button onClick={handleAutoBackground} disabled={extracting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7,
                  fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                }}>
                <Wand2 size={10} />
                {extracting ? 'Extracting…' : 'Auto'}
              </button>
            ) : undefined
          }>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' } as React.CSSProperties}>
              {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => {
                const active = state.bgColor === m.id;
                return (
                  <button key={m.id} onClick={() => updateState({ bgColor: m.id })}
                    style={{
                      flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 8px 8px', borderRadius: 14, gap: 0, border: 'none',
                      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                      outline: active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 6,
                      background: m.css, border: '1px solid rgba(255,255,255,0.08)',
                    }} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                      color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                      whiteSpace: 'nowrap',
                    }}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Wallpapers */}
        {state.bgType === 'wallpaper' && (
          <Section label="Wallpapers">
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' } as React.CSSProperties}>
              {WALLPAPERS.map(w => {
                const active = state.bgColor === w.id;
                return (
                  <button key={w.id} onClick={() => updateState({ bgColor: w.id })}
                    style={{
                      flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '10px 8px 8px', borderRadius: 14, gap: 0, border: 'none',
                      background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                      outline: active ? '2px solid rgba(255,255,255,0.85)' : '1.5px solid rgba(255,255,255,0.16)',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 6,
                      background: w.css, border: '1px solid rgba(255,255,255,0.08)',
                    }} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                      color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                      whiteSpace: 'nowrap',
                    }}>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Patterns */}
        {state.bgType === 'pattern' && (
          <>
            <Section label="Pattern">
              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' } as React.CSSProperties}>
                {PATTERNS.map(p => {
                  const active = state.bgPattern === p.id;
                  return (
                    <button key={p.id} onClick={() => updateState({ bgPattern: p.id })}
                      style={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '10px 8px 8px', borderRadius: 14, gap: 0, border: 'none',
                        background: active ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.13)',
                        outline: active ? '2px solid rgba(255,255,255,0.42)' : '1.5px solid rgba(255,255,255,0.16)',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, marginBottom: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        ...p.bgStyle('#1a1c2e'),
                      }} />
                      <span style={{
                        fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                        color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)',
                        whiteSpace: 'nowrap',
                      }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </Section>
            <Section label="Pattern Color">
              <div style={{ position: 'relative', width: '100%', height: 36, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
            </Section>
          </>
        )}

        {/* Image */}
        {state.bgType === 'image' && (
          <Section label="Background Image">
            {state.bgImage && (
              <div style={{ width: '100%', height: 72, borderRadius: 10, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
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
            <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgImage} />
          </Section>
        )}

      </>
    );
  };

  // ── Overlay tab content ─────────────────────────────────────────
  const OverlayTab = () => (
    <>
      {/* Light / Shadow Overlay */}
      <Section label="Light Overlay">
        <HScroll gap={7}>
          {/* None button */}
          <button
            onClick={() => updateState({ lightOverlay: null })}
            style={{
              flexShrink: 0, width: 56, height: 56, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              outline: !state.lightOverlay ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          {/* Preset thumbnails */}
          {LIGHT_OVERLAYS.map(preset => {
            const active = state.lightOverlay === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => updateState({ lightOverlay: preset.id })}
                style={{
                  flexShrink: 0, width: 56, height: 56, borderRadius: 12, border: 'none', cursor: 'pointer',
                  overflow: 'hidden', position: 'relative',
                  outline: active ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.1)',
                  background: '#fff',
                }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: preset.background,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: preset.filter,
                }} />
                {active && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)',
                    borderRadius: 12,
                  }} />
                )}
              </button>
            );
          })}
        </HScroll>

        {/* Controls when a light overlay is selected */}
        {state.lightOverlay && (
          <div style={{ marginTop: 12 }}>
            <Slider label="Opacity" value={state.lightOverlayOpacity} min={0} max={100}
              onChange={v => updateState({ lightOverlayOpacity: v })} unit="%" />
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', display: 'block', marginBottom: 6 }}>Blend Mode</span>
              <HScroll gap={5}>
                {(['multiply', 'overlay', 'screen', 'soft-light'] as const).map(mode => (
                  <Chip key={mode} active={state.lightOverlayBlend === mode}
                    onClick={() => updateState({ lightOverlayBlend: mode })}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                  </Chip>
                ))}
              </HScroll>
            </div>
          </div>
        )}
      </Section>

      {/* Color Overlay */}
      <Section label="Color Overlay" action={
        <Toggle enabled={state.overlayEnabled} onToggle={() => updateState({ overlayEnabled: !state.overlayEnabled })} />
      }>
        {state.overlayEnabled && (
          <>
            <HScroll gap={7}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: state.overlayColor, border: '1px solid rgba(255,255,255,0.1)' }} />
                <input type="color" value={state.overlayColor} onChange={e => updateState({ overlayColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
              {['#000000', '#ffffff', '#374151', '#0ea5e9', '#ec4899'].map(col => (
                <button key={col} onClick={() => updateState({ overlayColor: col })}
                  style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: col,
                    border: state.overlayColor === col ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                  }} />
              ))}
            </HScroll>
            <div style={{ marginTop: 10 }}>
              <Slider label="Opacity" value={state.overlayOpacity} min={0} max={90} onChange={v => updateState({ overlayOpacity: v })} unit="%" />
            </div>
          </>
        )}
        {!state.overlayEnabled && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>Toggle on to add a solid color tint.</p>
        )}
      </Section>
    </>
  );

  // ── Annotate tab content ────────────────────────────────────────
  const ANNOTATE_TOOLS: { id: 'pen' | 'marker' | 'eraser' | 'arrow' | 'rect' | 'text'; icon: React.ReactNode; label: string }[] = [
    { id: 'pen',    label: 'Pen',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg> },
    { id: 'marker', label: 'Marker',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg> },
    { id: 'eraser', label: 'Eraser',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg> },
    { id: 'arrow',  label: 'Arrow',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg> },
    { id: 'rect',   label: 'Rect',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
    { id: 'text',   label: 'Text',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  ];

  const ANNOTATE_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ffffff','#000000'];
  const ANNOTATE_SIZES: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];

  const AnnotateTab = () => (
    <>
      {/* Tool strip — horizontal slider */}
      <Section label="Tool">
        <HScroll gap={10}>
          {ANNOTATE_TOOLS.map(t => {
            const active = state.annotateTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => updateState({ annotateTool: t.id, annotateMode: true })}
                style={{
                  flexShrink: 0, width: 68,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 7, padding: '14px 4px 11px', borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                  outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.14)',
                  boxShadow: active ? '0 4px 18px rgba(0,0,0,0.45)' : 'none',
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                  transition: 'all 0.16s ease',
                  position: 'relative', overflow: 'hidden',
                }}>
                {/* color bar on active */}
                {active && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: state.annotateColor, borderRadius: '13px 13px 0 0',
                    opacity: 0.9,
                  }} />
                )}
                <span style={{
                  color: active ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.72)',
                  display: 'flex', transition: 'color 0.16s',
                }}>
                  {/* re-render icons at 20px */}
                  {t.id === 'pen'    && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>}
                  {t.id === 'marker' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>}
                  {t.id === 'eraser' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>}
                  {t.id === 'arrow'  && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>}
                  {t.id === 'rect'   && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
                  {t.id === 'text'   && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  color: active ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase', transition: 'color 0.16s',
                }}>{t.label}</span>
              </button>
            );
          })}
        </HScroll>
      </Section>

      {/* Color picker */}
      <Section label="Color">
        {/* Swatch row: custom picker + presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Custom color — square swatch */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: state.annotateColor,
              border: '2px solid rgba(255,255,255,0.22)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <input type="color" value={state.annotateColor}
              onChange={e => updateState({ annotateColor: e.target.value })}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
          </div>
          {/* Preset circles */}
          {ANNOTATE_COLORS.map(col => {
            const sel = state.annotateColor === col;
            return (
              <button key={col} onClick={() => updateState({ annotateColor: col })}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: col, flexShrink: 0, cursor: 'pointer', border: 'none',
                  outline: sel ? `3px solid ${col}` : '1.5px solid rgba(255,255,255,0.12)',
                  outlineOffset: sel ? '2px' : '0px',
                  boxShadow: sel ? `0 0 12px ${col}66, 0 2px 6px rgba(0,0,0,0.4)` : '0 1px 4px rgba(0,0,0,0.3)',
                  transform: sel ? 'scale(1.18)' : 'scale(1)',
                  transition: 'all 0.13s',
                }}
              />
            );
          })}
        </div>
        {/* Current color label */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 16, height: 3, borderRadius: 2, background: state.annotateColor,
            boxShadow: `0 0 8px ${state.annotateColor}99`,
          }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
            {state.annotateColor.toUpperCase()}
          </span>
        </div>
      </Section>

      {/* Size — visual dot buttons */}
      <Section label="Stroke Size">
        <div style={{ display: 'flex', gap: 7 }}>
          {ANNOTATE_SIZES.map(sz => {
            const sel = state.annotateSize === sz;
            const dotSize = sz === 'S' ? 4 : sz === 'M' ? 9 : sz === 'L' ? 16 : 24;
            return (
              <button key={sz} onClick={() => updateState({ annotateSize: sz })}
                style={{
                  flex: 1, height: 52, borderRadius: 11, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: sel ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.45)',
                  outline: sel ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.13)',
                  transition: 'all 0.13s',
                }}>
                {/* dot preview */}
                <div style={{
                  width: dotSize, height: dotSize, borderRadius: '50%',
                  background: sel ? state.annotateColor : 'rgba(255,255,255,0.45)',
                  boxShadow: sel ? `0 0 8px ${state.annotateColor}88` : 'none',
                  transition: 'all 0.13s',
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                  color: sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                }}>{sz}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* Actions */}
      <Section label="Actions">
        <button
          onClick={() => updateState({ annotateClearKey: (state.annotateClearKey ?? 0) + 1 })}
          style={{
            width: '100%', padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'rgba(239,68,68,0.13)', color: 'rgba(239,68,68,0.92)',
            outline: '1px solid rgba(239,68,68,0.28)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.12s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Clear All Annotations
        </button>
      </Section>
    </>
  );

  // ── Scene tab content ───────────────────────────────────────────
  const SceneTab = () => (
    <>
      {/* Canvas — ratio chips + corner radius */}
      <Section label="Canvas">
        <HScroll gap={6}>
          {CANVAS_RATIOS.map(r => (
            <Chip key={r.id} active={state.canvasRatio === r.id} onClick={() => updateState({ canvasRatio: r.id })}>{r.label}</Chip>
          ))}
        </HScroll>
        <div style={{ marginTop: 10 }}>
          <Slider label="Corner Radius" value={state.canvasRadius ?? 0} min={0} max={80} step={2}
            onChange={v => updateState({ canvasRadius: v })} unit="px" />
        </div>
      </Section>

      {/* Device & Motion — rotate + float */}
      <Section label="Device & Motion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={11} style={{ color: 'rgba(255,255,255,0.30)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Auto Rotate</span>
            </div>
            <Toggle enabled={state.autoRotate} onToggle={() => updateState({ autoRotate: !state.autoRotate })} />
          </div>
          {state.autoRotate && (
            <Slider label="Speed" value={Math.round(state.autoRotateSpeed * 10) / 10}
              min={0.5} max={8} step={0.5} onChange={v => updateState({ autoRotateSpeed: v })} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={11} style={{ color: 'rgba(255,255,255,0.30)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Float</span>
            </div>
            <Toggle enabled={state.animation === 'float'}
              onToggle={() => updateState({ animation: state.animation === 'float' ? 'none' : 'float' })} />
          </div>
        </div>
      </Section>

      {/* Effects — reflection + grain as toggle rows */}
      <Section label="Effects">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Floor Reflection</span>
            <Toggle enabled={state.reflection ?? false} onToggle={() => updateState({ reflection: !(state.reflection ?? false) })} />
          </div>
          {(state.reflection ?? false) && (
            <Slider label="Strength" value={state.reflectionOpacity ?? 50} min={0} max={100}
              onChange={v => updateState({ reflectionOpacity: v })} unit="%" />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Film Grain</span>
            <Toggle enabled={state.grain ?? false} onToggle={() => updateState({ grain: !(state.grain ?? false) })} />
          </div>
          {(state.grain ?? false) && (
            <Slider label="Intensity" value={state.grainIntensity ?? 35} min={5} max={100}
              onChange={v => updateState({ grainIntensity: v })} unit="%" />
          )}
        </div>
      </Section>

      {/* Camera Shadow */}
      <Section label="Shadow">
        <Slider label="Intensity" value={state.contactShadowOpacity} min={0} max={100}
          onChange={v => updateState({ contactShadowOpacity: v })} unit="%" />
      </Section>
    </>
  );

  // ── Lighting tab ────────────────────────────────────────────────
  const LightingTab = () => (
    <>
      {/* Compact 2-column lighting grid */}
      <Section label="Lighting">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
          <MiniSlider label="Brightness" value={state.lightBrightness ?? 40} min={0} max={100} step={1} unit="%"
            onChange={v => updateState({ lightBrightness: v })} />
          <MiniSlider label="Ambient" value={state.lightAmbient ?? 45} min={0} max={100} step={1} unit="%"
            onChange={v => updateState({ lightAmbient: v })} />
          <MiniSlider label="Warmth" value={state.lightWarmth ?? 0} min={-50} max={50} step={1}
            onChange={v => updateState({ lightWarmth: v })} />
          <MiniSlider label="Reflections" value={state.lightIBL ?? 40} min={0} max={100} step={1} unit="%"
            onChange={v => updateState({ lightIBL: v })} />
          <MiniSlider label="Exposure" value={Math.round((state.lightExposure ?? 1.0) * 100) / 100}
            min={0.4} max={2.0} step={0.05} onChange={v => updateState({ lightExposure: v })} />
          <MiniSlider label="Bloom" value={state.bloomIntensity ?? 22} min={0} max={100} step={1} unit="%"
            onChange={v => updateState({ bloomIntensity: v })} />
        </div>
      </Section>

      {/* Environment */}
      <Section label="Environment" action={
        <Toggle enabled={state.envEnabled !== false}
          onToggle={() => updateState({ envEnabled: !(state.envEnabled !== false) })} />
      }>
        <HScroll gap={7}>
          {ENV_PRESETS.map(env => (
            <button key={env.id} onClick={() => updateState({ envPreset: env.id, envEnabled: true })}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '7px 9px', borderRadius: 10,
                background: state.envPreset === env.id && state.envEnabled !== false ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                border: state.envPreset === env.id && state.envEnabled !== false ? '1px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.18)',
                color: state.envPreset === env.id && state.envEnabled !== false ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
                cursor: 'pointer', transition: 'all 0.12s',
                opacity: state.envEnabled !== false ? 1 : 0.35,
              }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{env.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{env.label}</span>
            </button>
          ))}
        </HScroll>
      </Section>
    </>
  );

  // ── Presets tab ─────────────────────────────────────────────────
  const PresetsTab = () => {
    const allBgs = [...GRADIENTS, ...MESH_GRADIENTS, ...WALLPAPERS];
    return (
      <>
        {/* Present Type — Rotato-style horizontal slider */}
        <Section label="Present Type">
          <HScroll gap={6}>
            {PRESENT_POSES.map(pose => {
              const active = state.cameraAngle === pose.id;
              return (
                <button
                  key={pose.id}
                  onClick={() => updateState({ cameraAngle: pose.id, cameraResetKey: (state.cameraResetKey ?? 0) + 1 })}
                  style={{
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 6px 6px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: active
                      ? '1.5px solid rgba(255,255,255,0.85)'
                      : '1px solid rgba(255,255,255,0.18)',
                    transition: 'all 0.18s ease',
                    boxShadow: active ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
                    transform: active ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  <PoseThumbnail ry={pose.ry} rx={pose.rx} rz={pose.rz} active={active} />
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
                    color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.38)',
                    textTransform: 'uppercase', marginTop: 2,
                    transition: 'color 0.2s', whiteSpace: 'nowrap',
                  }}>{pose.label}</span>
                </button>
              );
            })}
          </HScroll>
        </Section>

        {/* Scale */}
        <Section label="Scale">
          <Slider label="Scale" value={state.deviceScale ?? 100} min={40} max={160} step={5}
            onChange={v => updateState({ deviceScale: v })} unit="%" />
        </Section>

      </>
    );
  };

  // ── Template tab ─────────────────────────────────────────────────
  const TemplateTab = () => {
    const allBgs = [...GRADIENTS, ...MESH_GRADIENTS, ...WALLPAPERS];
    return (
      <>
        <HScroll gap={8}>
          {PRESETS.map(preset => {
            const bg = allBgs.find(g => g.id === preset.thumb);
            const bgCss = bg ? ('css' in bg ? bg.css : '') : '';
            return (
              <button key={preset.id}
                onClick={() => {
                  const s = preset.state;
                  const defaultModel = DEVICE_MODELS.find(m => m.storeType === s.deviceType);
                  updateState({
                    deviceType: s.deviceType,
                    deviceModel: defaultModel?.id ?? 'iphone-17-pro',
                    deviceLandscape: s.deviceLandscape ?? false,
                    bgType: s.bgType, bgColor: s.bgColor,
                    animation: s.animation,
                    autoRotate: s.autoRotate ?? false,
                    envPreset: (s.envPreset ?? 'studio') as EnvPreset,
                    contactShadowOpacity: s.contactShadowOpacity ?? 65,
                  });
                }}
                style={{
                  flexShrink: 0, width: 88, height: 88, borderRadius: 16, overflow: 'hidden', position: 'relative',
                  background: bgCss || '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textAlign: 'left', lineHeight: 1.2, textShadow: '0 1px 8px rgba(0,0,0,0.9)', whiteSpace: 'nowrap' }}>
                    {preset.label}
                  </span>
                </div>
              </button>
            );
          })}
        </HScroll>
      </>
    );
  };

  // ── Text tab ────────────────────────────────────────────────────
  const TextTab = () => (
    <>
      <button onClick={addText}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 12, fontWeight: 700,
          background: 'rgba(255,255,255,0.9)',
          border: 'none', color: '#0d0e0f', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
        <Type size={14} /> Add Text Overlay
      </button>
      <p style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.30)', marginTop: 10, lineHeight: 1.6 }}>
        Drag text overlays on the canvas to reposition.
      </p>
    </>
  );

  // ── Mobile content-only mode (rendered by App.tsx inside a floating sheet) ──
  if (mobile && mobileContentOnly !== undefined) {
    return (
      <div style={{ padding: '12px 0 16px' }}>
        {mobileContentOnly === 'presets'    && <PresetsTab />}
        {mobileContentOnly === 'template'   && <TemplateTab />}
        {mobileContentOnly === 'device'     && <DeviceTab />}
        {mobileContentOnly === 'background' && <BackgroundTab />}
        {mobileContentOnly === 'overlay'    && <OverlayTab />}
        {mobileContentOnly === 'annotate'   && <AnnotateTab />}
        {mobileContentOnly === 'canvas'     && <SceneTab />}
        {mobileContentOnly === 'lighting'   && <LightingTab />}
        {mobileContentOnly === 'text'       && <TextTab />}
      </div>
    );
  }

  // ── Mobile shell — content top, pill nav bottom (like reference image) ──
  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Active tab content — scrollable, fills space above the pill bar */}
        <div className="styled-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px 8px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'lighting'   && <LightingTab />}
          {activeTab === 'text'       && <TextTab />}
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
        <div className="styled-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'template'   && <TemplateTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'overlay'    && <OverlayTab />}
          {activeTab === 'annotate'   && <AnnotateTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'lighting'   && <LightingTab />}
          {activeTab === 'text'       && <TextTab />}
        </div>
      </div>
    </div>
  );
}

