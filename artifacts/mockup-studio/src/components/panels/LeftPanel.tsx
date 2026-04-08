import { useState, useRef } from 'react';
import {
  Smartphone, Shuffle, Wand2, Image as ImageIcon, Sliders, Type,
  LayoutGrid, Link2, Video, X, RefreshCw, Sun, RotateCcw,
} from 'lucide-react';
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

type Tab = 'presets' | 'device' | 'background' | 'canvas' | 'text';

const TAB_ICONS: { id: Tab; icon: React.ComponentType<IconProps>; label: string }[] = [
  { id: 'presets',    icon: LayoutGrid, label: 'Presets'    },
  { id: 'device',     icon: Smartphone, label: 'Device'     },
  { id: 'background', icon: ImageIcon,  label: 'Background' },
  { id: 'canvas',     icon: Sliders,    label: 'Scene'      },
  { id: 'text',       icon: Type,       label: 'Text'       },
];

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
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#374151' }}>
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
      flexShrink: 0, padding: '5px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
      border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
      color: active ? '#c4b5fd' : '#6b7280',
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
      background: enabled ? '#7c3aed' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
    }}>
    <div style={{
      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.18s',
      left: enabled ? 18 : 2,
    }} />
  </button>
);

// ── Slider ────────────────────────────────────────────────────────
const Slider = ({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>{label}</span>
      <span style={{ fontSize: 11, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))} className="ms-range w-full" />
  </div>
);

// ── Device thumbnail ──────────────────────────────────────────────
function DeviceThumbnail({ modelId, isSelected }: { modelId: string; isSelected: boolean }) {
  const def = getModelById(modelId);
  const isPhone   = def.storeType === 'iphone' || def.storeType === 'android';
  const isTablet  = def.storeType === 'ipad';
  const isWatch   = def.storeType === 'watch';
  const isMac     = def.storeType === 'macbook';
  const isBrowser = def.storeType === 'browser';

  const accent = isSelected ? '#7c3aed' : def.accent;
  const body   = isSelected ? '#2d1b69' : 'rgba(255,255,255,0.06)';

  if (isPhone) {
    const r = def.storeType === 'android' ? 6 : 8;
    return (
      <svg width="24" height="40" viewBox="0 0 28 46" fill="none">
        <rect x="1" y="1" width="26" height="44" rx={r} fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        {def.camera === 'dynamic-island' ? <rect x="9" y="4" width="10" height="3" rx="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'punch-hole' ? <circle cx="14" cy="5.5" r="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'notch' ? <rect x="7" y="0" width="14" height="4" rx="2" fill={body} stroke={accent} strokeWidth="1" />
          : null}
        <rect x="4" y="9" width="20" height="30" rx="2" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
        <rect x="27" y="14" width="2" height="8" rx="1" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isTablet) {
    return (
      <svg width="30" height="40" viewBox="0 0 36 46" fill="none">
        <rect x="1" y="1" width="34" height="44" rx="4" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="7" width="28" height="32" rx="2" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
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
        <rect x="4" y="9" width="20" height="20" rx="6" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
      </svg>
    );
  }
  if (isMac) {
    return (
      <svg width="40" height="30" viewBox="0 0 44 36" fill="none">
        <rect x="4" y="1" width="36" height="24" rx="2" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="7" y="4" width="30" height="18" rx="1" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
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
        <rect x="4" y="11" width="36" height="16" rx="1" fill={isSelected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)'} />
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

function getApiBase() {
  const { protocol, hostname, port } = window.location;
  const base = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
  return `${base}/api-server/api`;
}

// ── Mode accent helpers ────────────────────────────────────────────
function getModeAccent(mode: string) {
  if (mode === 'movie')      return { color: '#f87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' };
  if (mode === 'screenshot') return { color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.4)' };
  return { color: '#a78bfa', bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.4)' };
}

function getDefaultTab(mode: string): Tab {
  if (mode === 'canvas') return 'canvas';
  if (mode === 'movie') return 'canvas';
  if (mode === 'screenshot') return 'device';
  return 'device';
}

// ── Main component ────────────────────────────────────────────────
export function LeftPanel({ mobile = false }: { mobile?: boolean }) {
  const { state, updateState, addText } = useApp();
  const mode = state.creationMode ?? 'mockup';
  const modeAccent = getModeAccent(mode);

  const [activeTab, setActiveTab]           = useState<Tab>(getDefaultTab(mode));
  const [selectedGroup, setSelectedGroup]   = useState<DeviceGroup>('iPhone');
  const bgFileRef                            = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting]         = useState(false);
  const [urlInput, setUrlInput]             = useState('');
  const [capturing, setCapturing]           = useState(false);
  const [captureError, setCaptureError]     = useState('');

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

  const handleUrlCapture = async () => {
    if (!urlInput.trim()) return;
    setCaptureError('');
    setCapturing(true);
    try {
      let url = urlInput.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      const res = await fetch(`${getApiBase()}/screenshot?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Screenshot failed');
      const blob = await res.blob();
      updateState({ screenshotUrl: URL.createObjectURL(blob), videoUrl: null, contentType: 'image' });
    } catch {
      setCaptureError('Could not capture. Check the URL.');
    } finally { setCapturing(false); }
  };

  // ── Device tab content ──────────────────────────────────────────
  const DeviceTab = () => (
    <>
      {/* Mode-specific context hint */}
      {mode === 'screenshot' && (
        <div style={{
          marginBottom: 14, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📸</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', marginBottom: 2 }}>Screenshot Mode</p>
            <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>Enter a URL below to capture any website and display it inside a device frame.</p>
          </div>
        </div>
      )}
      {mode === 'movie' && (
        <div style={{
          marginBottom: 14, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🎬</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#f87171', marginBottom: 2 }}>Movie Mode</p>
            <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>Load your media here, then use the Timeline at the bottom to animate and export your video.</p>
          </div>
        </div>
      )}
      {mode === 'mockup' && (
        <div style={{
          marginBottom: 14, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>📱</span>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>Mockup Mode</p>
            <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.4 }}>Upload an image or video, choose your device, then export a professional-quality mockup.</p>
          </div>
        </div>
      )}

      {/* URL capture */}
      <Section label="Capture from URL">
        <div style={{ borderRadius: 12, border: mode === 'screenshot' ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.08)', background: mode === 'screenshot' ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
            <Link2 size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
            <input
              type="url" value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setCaptureError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleUrlCapture()}
              placeholder="https://example.com"
              style={{ flex: 1, background: 'transparent', fontSize: 11, outline: 'none', color: '#e2e8f0', border: 'none' }}
            />
            {urlInput && (
              <button onClick={() => { setUrlInput(''); setCaptureError(''); }} style={{ color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={11} />
              </button>
            )}
          </div>
          <button onClick={handleUrlCapture} disabled={capturing || !urlInput.trim()}
            style={{
              width: '100%', padding: '7px 0', fontSize: 11, fontWeight: 600,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: capturing ? 'rgba(124,58,237,0.1)' : urlInput ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: urlInput ? '#a78bfa' : '#4b5563', border: 'none',
              cursor: capturing || !urlInput.trim() ? 'not-allowed' : 'pointer',
            }}>
            {capturing ? '⏳ Capturing…' : '📸 Capture Screenshot'}
          </button>
        </div>
        {captureError && <p style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>{captureError}</p>}
      </Section>

      {/* Upload */}
      <Section label="Upload Media">
        <HScroll gap={8}>
          <UploadTile icon={<ImageIcon size={13} />} label="Image" accept="image/*" color="#a78bfa"
            onFile={f => updateState({ screenshotUrl: URL.createObjectURL(f), videoUrl: null, contentType: 'image' })} />
          <UploadTile icon={<Video size={13} />} label="Video" accept="video/*" color="#4ade80"
            onFile={f => updateState({ videoUrl: URL.createObjectURL(f), screenshotUrl: null, contentType: 'video' })} />
          {(state.screenshotUrl || state.videoUrl) && (
            <button
              onClick={() => updateState({ screenshotUrl: null, videoUrl: null, contentType: null })}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
                cursor: 'pointer',
              }}>
              <X size={11} /> Clear
            </button>
          )}
        </HScroll>
        {(state.screenshotUrl || state.videoUrl) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 8px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            {state.contentType === 'video' ? <Video size={11} style={{ color: '#4ade80' }} /> : <ImageIcon size={11} style={{ color: '#4ade80' }} />}
            <span style={{ fontSize: 10, color: '#4ade80' }}>
              {state.contentType === 'video' ? 'Video loaded' : 'Image loaded'}
            </span>
          </div>
        )}
      </Section>

      {/* Device category */}
      <Section label="Device">
        <HScroll gap={6}>
          {DEVICE_GROUPS.map(group => (
            <button key={group} onClick={() => setSelectedGroup(group)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: selectedGroup === group ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                border: selectedGroup === group ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                color: selectedGroup === group ? '#c4b5fd' : '#4b5563', cursor: 'pointer',
              }}>
              <span>{GROUP_ICONS[group]}</span>
              <span>{group}</span>
            </button>
          ))}
        </HScroll>
      </Section>

      {/* Device model — horizontal scroll cards */}
      <Section label="Model">
        <HScroll gap={7}>
          {DEVICE_MODELS.filter(m => m.group === selectedGroup).map(model => {
            const isSelected = state.deviceModel === model.id;
            return (
              <button key={model.id}
                onClick={() => updateState({ deviceModel: model.id, deviceType: model.storeType })}
                style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                  gap: 5, padding: '10px 8px 8px', borderRadius: 14, width: 64,
                  background: isSelected ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1.5px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, color: isSelected ? '#c4b5fd' : '#6b7280' }}>
                  {model.label}
                </span>
              </button>
            );
          })}
        </HScroll>
      </Section>

      {/* Frame color */}
      {state.deviceType === 'iphone' && (
        <Section label="Frame Color">
          <HScroll gap={8}>
            {IPHONE_COLORS.map(c => (
              <button key={c.id} title={c.label} onClick={() => updateState({ deviceColor: c.id })}
                style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: c.bg,
                  border: state.deviceColor === c.id ? '2px solid #a78bfa' : `2px solid ${c.border}`,
                  boxShadow: state.deviceColor === c.id ? '0 0 0 2.5px rgba(167,139,250,0.35)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                }} />
            ))}
            <span style={{ fontSize: 10, color: '#4b5563', display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
              {IPHONE_COLORS.find(c => c.id === state.deviceColor)?.label}
            </span>
          </HScroll>
        </Section>
      )}

      {/* Browser theme */}
      {state.deviceType === 'browser' && (
        <Section label="Browser Theme">
          <HScroll gap={6}>
            <Chip active={state.browserMode === 'dark'} onClick={() => updateState({ browserMode: 'dark' })}>Dark</Chip>
            <Chip active={state.browserMode === 'light'} onClick={() => updateState({ browserMode: 'light' })}>Light</Chip>
          </HScroll>
        </Section>
      )}

      {/* Orientation */}
      {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
        <Section label="Orientation">
          <HScroll gap={6}>
            <Chip active={!state.deviceLandscape} onClick={() => updateState({ deviceLandscape: false })}>Portrait</Chip>
            <Chip active={state.deviceLandscape}  onClick={() => updateState({ deviceLandscape: true })}>Landscape</Chip>
          </HScroll>
        </Section>
      )}
    </>
  );

  // ── Background tab content ──────────────────────────────────────
  const BackgroundTab = () => {
    const bgTypes = ['solid', 'gradient', 'mesh', 'wallpaper', 'pattern', 'image'] as const;
    return (
      <>
        <Section label="Type" action={
          <button onClick={handleShuffle} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
            fontSize: 10, fontWeight: 700, background: 'rgba(124,58,237,0.14)',
            border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd', cursor: 'pointer',
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: state.bgColor, border: '1px solid rgba(255,255,255,0.12)' }} />
                <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </div>
              <input type="text" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 11, fontFamily: 'monospace', outline: 'none', color: '#9ca3af',
                }} />
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
                    flexShrink: 0, width: 56, height: 56, borderRadius: 14, background: g.css,
                    border: state.bgColor === g.id ? '2.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
                    boxShadow: state.bgColor === g.id ? '0 0 0 2px rgba(167,139,250,0.3)' : 'none',
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
                  fontSize: 10, fontWeight: 600, background: 'rgba(124,58,237,0.14)',
                  border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd', cursor: 'pointer',
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
                    flexShrink: 0, width: 60, height: 60, borderRadius: 14, background: m.css,
                    border: state.bgColor === m.id ? '2.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
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
                    flexShrink: 0, width: 60, height: 60, borderRadius: 14, background: w.css, position: 'relative', overflow: 'hidden',
                    border: state.bgColor === w.id ? '2.5px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
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
                      flexShrink: 0, width: 64, height: 48, borderRadius: 12, cursor: 'pointer',
                      border: state.bgPattern === p.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      ...p.bgStyle('#1a1a2e'),
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
              <div style={{ width: '100%', height: 72, borderRadius: 12, overflow: 'hidden', marginBottom: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={state.bgImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="bg" />
              </div>
            )}
            <button onClick={() => bgFileRef.current?.click()}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)',
                color: '#6b7280', cursor: 'pointer',
              }}>
              {state.bgImage ? 'Change Image' : '+ Upload Image'}
            </button>
            <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgImage} />
          </Section>
        )}

        {/* Overlay */}
        <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#374151' }}>
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
                {['#000000', '#ffffff', '#7c3aed', '#0ea5e9', '#ec4899'].map(col => (
                  <button key={col} onClick={() => updateState({ overlayColor: col })}
                    style={{
                      flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: col,
                      border: state.overlayColor === col ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
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
      {/* Canvas ratio */}
      <Section label="Canvas Ratio">
        <HScroll gap={6}>
          {CANVAS_RATIOS.map(r => (
            <Chip key={r.id} active={state.canvasRatio === r.id} onClick={() => updateState({ canvasRatio: r.id })}>{r.label}</Chip>
          ))}
        </HScroll>
      </Section>

      {/* Motion */}
      <Section label="Motion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={12} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Auto Rotate</span>
            </div>
            <Toggle enabled={state.autoRotate} onToggle={() => updateState({ autoRotate: !state.autoRotate })} />
          </div>
          {state.autoRotate && (
            <Slider label="Rotation Speed"
              value={Math.round(state.autoRotateSpeed * 10) / 10}
              min={0.5} max={8} step={0.5}
              onChange={v => updateState({ autoRotateSpeed: v })} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={12} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Float Effect</span>
            </div>
            <Toggle
              enabled={state.animation === 'float'}
              onToggle={() => updateState({ animation: state.animation === 'float' ? 'none' : 'float' })} />
          </div>
        </div>
      </Section>

      {/* Lighting controls */}
      <Section label="Lighting">
        <Slider
          label="Brillo"
          value={state.lightBrightness ?? 40}
          min={0} max={100} step={1} unit="%"
          onChange={v => updateState({ lightBrightness: v })}
        />
        <Slider
          label="Ambiente"
          value={state.lightAmbient ?? 45}
          min={0} max={100} step={1} unit="%"
          onChange={v => updateState({ lightAmbient: v })}
        />
        <Slider
          label="Temperatura"
          value={state.lightWarmth ?? 0}
          min={-50} max={50} step={1}
          onChange={v => updateState({ lightWarmth: v })}
        />
        <Slider
          label="Reflejos"
          value={state.lightIBL ?? 40}
          min={0} max={100} step={1} unit="%"
          onChange={v => updateState({ lightIBL: v })}
        />
        <Slider
          label="Exposición"
          value={Math.round((state.lightExposure ?? 1.0) * 100) / 100}
          min={0.4} max={2.0} step={0.05}
          onChange={v => updateState({ lightExposure: v })}
        />
      </Section>

      {/* Environment */}
      <Section label="Environment" action={
        <Toggle
          enabled={state.envEnabled !== false}
          onToggle={() => updateState({ envEnabled: !(state.envEnabled !== false) })}
        />
      }>
        <HScroll gap={7}>
          {ENV_PRESETS.map(env => (
            <button key={env.id} onClick={() => updateState({ envPreset: env.id, envEnabled: true })}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 12,
                background: state.envPreset === env.id && state.envEnabled !== false ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.03)',
                border: state.envPreset === env.id && state.envEnabled !== false ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                color: state.envPreset === env.id && state.envEnabled !== false ? '#c4b5fd' : '#6b7280',
                cursor: 'pointer', transition: 'all 0.12s',
                opacity: state.envEnabled !== false ? 1 : 0.45,
              }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>{env.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600 }}>{env.label}</span>
            </button>
          ))}
        </HScroll>
      </Section>

      {/* Camera */}
      <Section label="Camera">
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
                padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                background: state.cameraAngle === cam.id ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.03)',
                border: state.cameraAngle === cam.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                color: state.cameraAngle === cam.id ? '#c4b5fd' : '#6b7280', cursor: 'pointer', transition: 'all 0.12s',
              }}>
              <span>{cam.icon}</span>
              <span>{cam.label}</span>
            </button>
          ))}
        </HScroll>
      </Section>

      {/* Shadow */}
      <Section label="Shadow">
        <Slider label="Intensity" value={state.contactShadowOpacity} min={0} max={100}
          onChange={v => updateState({ contactShadowOpacity: v })} unit="%" />
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
          width: '100%', padding: '12px 0', borderRadius: 14, fontSize: 12, fontWeight: 700,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.35))',
          border: '1px solid rgba(124,58,237,0.45)', color: '#c4b5fd', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
        <Type size={14} /> Add Text Overlay
      </button>
      <p style={{ fontSize: 10, textAlign: 'center', color: '#374151', marginTop: 10, lineHeight: 1.6 }}>
        Drag text overlays on the canvas to reposition.
      </p>
    </>
  );

  // ── Mobile shell (full-width, no sidebar rail) ───────────────────
  if (mobile) {
    return (
      <div>
        {/* Horizontal tab chips */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 14px 12px',
          scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
        } as React.CSSProperties}>
          {TAB_ICONS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: activeTab === id ? modeAccent.bg : 'rgba(255,255,255,0.05)',
                border: activeTab === id ? `1px solid ${modeAccent.border}` : '1px solid rgba(255,255,255,0.08)',
                color: activeTab === id ? modeAccent.color : '#6b7280', cursor: 'pointer',
              }}>
              <Icon size={13} strokeWidth={activeTab === id ? 2 : 1.5} />
              {label}
            </button>
          ))}
        </div>

        {/* Full-width content — no internal scroll, parent handles it */}
        <div style={{ padding: '12px 14px 20px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'text'       && <TextTab />}
        </div>
      </div>
    );
  }

  // ── Desktop shell (icon rail + content panel) ─────────────────
  return (
    <div style={{ display: 'flex', height: '100%', flexShrink: 0, overflow: 'hidden' }}>

      {/* Icon rail */}
      <div style={{
        width: 52, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 0', gap: 2, flexShrink: 0,
        background: 'rgba(7,9,20,0.98)', borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, marginBottom: 8,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0,
        }}>M</div>

        {TAB_ICONS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} title={label}
            style={{
              width: 38, height: 38, borderRadius: 10, border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              background: activeTab === id ? modeAccent.bg : 'transparent',
              outline: activeTab === id ? `1px solid ${modeAccent.border}` : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.12s',
            }}>
            <Icon size={17} strokeWidth={activeTab === id ? 2 : 1.5}
              style={{ color: activeTab === id ? modeAccent.color : '#4b5563' }} />
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div style={{
        width: 240, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
        background: 'rgba(10,12,24,0.96)', borderRight: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Tab header */}
        <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
              {TAB_ICONS.find(t => t.id === activeTab)?.label}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' as const,
              padding: '2px 7px', borderRadius: 6,
              background: modeAccent.bg, color: modeAccent.color, border: `1px solid ${modeAccent.border}`,
            }}>
              {mode}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="styled-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>
          {activeTab === 'presets'    && <PresetsTab />}
          {activeTab === 'device'     && <DeviceTab />}
          {activeTab === 'background' && <BackgroundTab />}
          {activeTab === 'canvas'     && <SceneTab />}
          {activeTab === 'text'       && <TextTab />}
        </div>
      </div>
    </div>
  );
}

// ── Upload tile ───────────────────────────────────────────────────
function UploadTile({ icon, label, accept, color, onFile }: {
  icon: React.ReactNode; label: string; accept: string; color: string; onFile: (f: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button onClick={() => ref.current?.click()}
      style={{
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '8px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280' }}>{label}</span>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </button>
  );
}
