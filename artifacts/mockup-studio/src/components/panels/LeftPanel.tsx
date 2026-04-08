import { useState, useRef, useEffect, memo } from 'react';
import {
  Smartphone, Shuffle, Wand2, Image as ImageIcon, Sliders, Type,
  LayoutGrid, X, RefreshCw, Sun, RotateCcw, Search,
} from 'lucide-react';
import type { Tab } from './tabs';
import { TAB_ICONS } from './tabs';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, PRESETS } from '../../data/backgrounds';
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
      background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
      color: active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.42)',
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
  const DeviceTab = () => {
    const q = deviceSearch.trim().toLowerCase();
    const models = q
      ? DEVICE_MODELS.filter(m => m.label.toLowerCase().includes(q))
      : DEVICE_MODELS;

    return (
      <>
        {/* Search bar */}
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

        {/* 3-column device grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 14 }}>
          {models.map(model => {
            const isSelected = state.deviceModel === model.id;
            return (
              <button key={model.id}
                onClick={() => updateState({ deviceModel: model.id, deviceType: model.storeType })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 4px 9px', borderRadius: 14, gap: 0,
                  background: isSelected ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '2px solid rgba(255,255,255,0.30)' : '1.5px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                {/* Thumbnail — scaled up for the grid */}
                <div style={{
                  height: 60, width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: 'scale(1.4)', transformOrigin: 'center',
                }}>
                  <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                </div>
                {/* Name */}
                <span style={{
                  fontSize: 10, fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
                  marginTop: 6,
                  color: isSelected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.60)',
                }}>
                  {model.label}
                </span>
                {/* Resolution */}
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
    const bgTypes = ['solid', 'gradient', 'mesh', 'wallpaper', 'pattern', 'image'] as const;
    return (
      <>
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
          <HScroll gap={6}>
            {bgTypes.map(t => (
              <Chip key={t} active={state.bgType === t} onClick={() => updateState({ bgType: t })}>
                {t}
              </Chip>
            ))}
          </HScroll>
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
            <HScroll gap={8}>
              {GRADIENTS.map(g => (
                <button key={g.id} title={g.label} onClick={() => updateState({ bgColor: g.id })}
                  style={{
                    flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: g.css,
                    border: state.bgColor === g.id ? '2.5px solid rgba(255,255,255,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                    boxShadow: state.bgColor === g.id ? '0 0 0 2px rgba(255,255,255,0.12)' : 'none',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }} />
              ))}
            </HScroll>
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
            <HScroll gap={8}>
              {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => (
                <button key={m.id} title={m.label} onClick={() => updateState({ bgColor: m.id })}
                  style={{
                    flexShrink: 0, width: 60, height: 60, borderRadius: 12, background: m.css,
                    border: state.bgColor === m.id ? '2.5px solid rgba(255,255,255,0.65)' : '1.5px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }} />
              ))}
            </HScroll>
          </Section>
        )}

        {/* Wallpapers */}
        {state.bgType === 'wallpaper' && (
          <Section label="Wallpapers">
            <HScroll gap={8}>
              {WALLPAPERS.map(w => (
                <button key={w.id} title={w.label} onClick={() => updateState({ bgColor: w.id })}
                  style={{
                    flexShrink: 0, width: 60, height: 60, borderRadius: 12, background: w.css, position: 'relative', overflow: 'hidden',
                    border: state.bgColor === w.id ? '2.5px solid rgba(255,255,255,0.65)' : '1.5px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px', background: 'rgba(0,0,0,0.55)' }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', display: 'block', lineHeight: 1.2 }}>{w.label}</span>
                  </div>
                </button>
              ))}
            </HScroll>
          </Section>
        )}

        {/* Patterns */}
        {state.bgType === 'pattern' && (
          <>
            <Section label="Pattern">
              <HScroll gap={8}>
                {PATTERNS.map(p => (
                  <button key={p.id} onClick={() => updateState({ bgPattern: p.id })}
                    style={{
                      flexShrink: 0, width: 64, height: 48, borderRadius: 10, cursor: 'pointer',
                      border: state.bgPattern === p.id ? '2px solid rgba(255,255,255,0.5)' : '1.5px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...p.bgStyle('#1a1c1e'),
                    }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{p.label}</span>
                  </button>
                ))}
              </HScroll>
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
                background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              }}>
              {state.bgImage ? 'Change Image' : '+ Upload Image'}
            </button>
            <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgImage} />
          </Section>
        )}

        {/* Overlay */}
        <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
              Color Overlay
            </span>
            <Toggle enabled={state.overlayEnabled} onToggle={() => updateState({ overlayEnabled: !state.overlayEnabled })} />
          </div>
          {state.overlayEnabled && (
            <>
              <HScroll gap={7}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: state.overlayColor, border: '1px solid rgba(255,255,255,0.1)' }} />
                  <input type="color" value={state.overlayColor} onChange={e => updateState({ overlayColor: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
                {['#000000', '#ffffff', '#374151', '#0ea5e9', '#ec4899'].map(col => (
                  <button key={col} onClick={() => updateState({ overlayColor: col })}
                    style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: col,
                      border: state.overlayColor === col ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                    }} />
                ))}
              </HScroll>
              <div style={{ marginTop: 10 }}>
                <Slider label="Opacity" value={state.overlayOpacity} min={0} max={90} onChange={v => updateState({ overlayOpacity: v })} unit="%" />
              </div>
            </>
          )}
        </div>
      </>
    );
  };

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

      {/* Device & Motion — scale + rotate + float */}
      <Section label="Device & Motion">
        <Slider label="Scale" value={state.deviceScale ?? 100} min={40} max={160} step={5}
          onChange={v => updateState({ deviceScale: v })} unit="%" />
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

      {/* Camera & Shadow — presets + shadow intensity */}
      <Section label="Camera & Shadow">
        <HScroll gap={6}>
          {([
            { id: 'hero',  label: 'Hero',  icon: '🎬' },
            { id: 'front', label: 'Front', icon: '👁' },
            { id: 'side',  label: 'Side',  icon: '↔' },
            { id: 'top',   label: 'Top',   icon: '⬆' },
          ] as const).map(cam => (
            <button key={cam.id}
              onClick={() => updateState({ cameraAngle: cam.id, cameraResetKey: (state.cameraResetKey ?? 0) + 1 })}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: state.cameraAngle === cam.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: state.cameraAngle === cam.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                color: state.cameraAngle === cam.id ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.40)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}>
              <span>{cam.icon}</span><span>{cam.label}</span>
            </button>
          ))}
        </HScroll>
        <div style={{ marginTop: 10 }}>
          <Slider label="Shadow" value={state.contactShadowOpacity} min={0} max={100}
            onChange={v => updateState({ contactShadowOpacity: v })} unit="%" />
        </div>
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
                background: state.envPreset === env.id && state.envEnabled !== false ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: state.envPreset === env.id && state.envEnabled !== false ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                color: state.envPreset === env.id && state.envEnabled !== false ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)',
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
      <Section label="Templates">
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
                  flexShrink: 0, width: 80, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative',
                  background: bgCss || '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                  transition: 'all 0.12s',
                }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textAlign: 'left', lineHeight: 1.2, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                    {preset.label}
                  </span>
                </div>
              </button>
            );
          })}
        </HScroll>
      </Section>
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
      <div style={{ padding: '12px 14px 16px' }}>
        {mobileContentOnly === 'presets'    && <PresetsTab />}
        {mobileContentOnly === 'device'     && <DeviceTab />}
        {mobileContentOnly === 'background' && <BackgroundTab />}
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
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
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
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'lighting'   && <LightingTab />}
          {activeTab === 'text'       && <TextTab />}
        </div>
      </div>
    </div>
  );
}

