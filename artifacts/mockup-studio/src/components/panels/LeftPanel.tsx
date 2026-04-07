import { useState, useRef } from 'react';
import {
  Smartphone, Shuffle, Wand2, Image as ImageIcon, Sliders, Type, Play,
  LayoutGrid, Link2, Video, X
} from 'lucide-react';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, PRESETS } from '../../data/backgrounds';
import { DEVICE_MODELS, DEVICE_GROUPS, GROUP_ICONS, getModelById } from '../../data/devices';
import type { DeviceGroup } from '../../data/devices';
import type { DeviceColor } from '../../store';

type IconProps = { size?: number; strokeWidth?: number; style?: React.CSSProperties; className?: string };

const IPHONE_COLORS: { id: DeviceColor; label: string; bg: string; border: string }[] = [
  { id: 'titanium', label: 'Titanium', bg: 'linear-gradient(135deg, #3a3a3a, #1e1e1e)', border: '#555' },
  { id: 'black', label: 'Black', bg: 'linear-gradient(135deg, #1a1a1a, #050505)', border: '#333' },
  { id: 'white', label: 'White', bg: 'linear-gradient(135deg, #d8d8d8, #b0b0b0)', border: '#aaa' },
  { id: 'blue', label: 'Blue', bg: 'linear-gradient(135deg, #2a3f6f, #0f1e40)', border: '#3a5080' },
];

const SHADOW_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'spread', label: 'Spread' },
  { id: 'hug', label: 'Hug' },
] as const;

const CANVAS_RATIOS = [
  { id: 'free', label: 'Free' },
  { id: '1:1', label: '1:1' },
  { id: '4:5', label: '4:5' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
] as const;

type Tab = 'presets' | 'device' | 'background' | 'canvas' | 'text' | 'animation';

const TAB_ICONS: { id: Tab; icon: React.ComponentType<IconProps>; label: string }[] = [
  { id: 'presets', icon: LayoutGrid, label: 'Presets' },
  { id: 'device', icon: Smartphone, label: 'Device' },
  { id: 'background', icon: ImageIcon, label: 'Background' },
  { id: 'canvas', icon: Sliders, label: 'Transform' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'animation', icon: Play, label: 'Animate' },
];

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

// Mini device thumbnail SVGs for the picker
function DeviceThumbnail({ modelId, isSelected }: { modelId: string; isSelected: boolean }) {
  const def = getModelById(modelId);
  const isPhone = def.storeType === 'iphone' || def.storeType === 'android';
  const isTablet = def.storeType === 'ipad';
  const isWatch = def.storeType === 'watch';
  const isMac = def.storeType === 'macbook';
  const isBrowser = def.storeType === 'browser';

  const accent = isSelected ? '#7c3aed' : def.accent;
  const body = isSelected ? '#2d1b69' : 'rgba(255,255,255,0.06)';

  if (isPhone) {
    const r = def.storeType === 'android' ? 6 : 8;
    return (
      <svg width="28" height="46" viewBox="0 0 28 46" fill="none">
        <rect x="1" y="1" width="26" height="44" rx={r} fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        {/* Camera */}
        {def.camera === 'dynamic-island'
          ? <rect x="9" y="4" width="10" height="3" rx="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'punch-hole'
          ? <circle cx="14" cy="5.5" r="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'notch'
          ? <rect x="7" y="0" width="14" height="4" rx="2" fill={body} stroke={accent} strokeWidth="1" />
          : null}
        {/* Screen */}
        <rect x="4" y="9" width="20" height="30" rx="2" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
        {/* Button */}
        <rect x="27" y="14" width="2" height="8" rx="1" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isTablet) {
    return (
      <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
        <rect x="1" y="1" width="34" height="44" rx="4" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="7" width="28" height="32" rx="2" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
        <circle cx="18" cy="42" r="2" fill={accent} opacity="0.6" />
        <circle cx="18" cy="3.5" r="1.5" fill={accent} opacity="0.5" />
      </svg>
    );
  }
  if (isWatch) {
    return (
      <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
        <rect x="8" y="0" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="8" y="33" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="1" y="6" width="26" height="26" rx="8" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="9" width="20" height="20" rx="6" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
      </svg>
    );
  }
  if (isMac) {
    return (
      <svg width="44" height="36" viewBox="0 0 44 36" fill="none">
        <rect x="4" y="1" width="36" height="24" rx="2" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="7" y="4" width="30" height="18" rx="1" fill={isSelected ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)'} />
        <rect x="1" y="25" width="42" height="5" rx="1.5" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="14" y="27" width="16" height="2" rx="1" fill={accent} opacity="0.4" />
      </svg>
    );
  }
  if (isBrowser) {
    return (
      <svg width="44" height="30" viewBox="0 0 44 30" fill="none">
        <rect x="1" y="1" width="42" height="28" rx="3" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="1" y="1" width="42" height="8" rx="3" fill={accent} opacity="0.18" />
        <rect x="4" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.5" />
        <rect x="10" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.3" />
        <rect x="16" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.2" />
        <rect x="4" y="11" width="36" height="16" rx="1" fill={isSelected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)'} />
      </svg>
    );
  }
  return null;
}

export function LeftPanel() {
  const { state, updateState, addText } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('device');
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup>('iPhone');
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState('');

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ bgType: 'image', bgImage: URL.createObjectURL(file) });
  };

  const handleShuffle = () => {
    if (state.bgType === 'gradient') {
      const idx = Math.floor(Math.random() * GRADIENTS.length);
      updateState({ bgColor: GRADIENTS[idx].id });
    } else if (state.bgType === 'mesh') {
      const idx = Math.floor(Math.random() * MESH_GRADIENTS.length);
      updateState({ bgColor: MESH_GRADIENTS[idx].id });
    } else if (state.bgType === 'wallpaper') {
      const idx = Math.floor(Math.random() * WALLPAPERS.length);
      updateState({ bgColor: WALLPAPERS[idx].id });
    } else {
      const idx = Math.floor(Math.random() * GRADIENTS.length);
      updateState({ bgType: 'gradient', bgColor: GRADIENTS[idx].id });
    }
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
      const apiBase = getApiBase();
      const proxyUrl = `${apiBase}/screenshot?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error('Screenshot failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      updateState({ screenshotUrl: blobUrl, videoUrl: null, contentType: 'image' });
    } catch {
      setCaptureError('Could not capture. Check the URL and try again.');
    } finally { setCapturing(false); }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#4b5563', letterSpacing: '0.08em' }}>
      {children}
    </div>
  );

  const SliderControl = ({ label, value, min, max, step = 1, onChange, unit = '' }: {
    label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
        <span className="text-xs font-mono tabular-nums" style={{ color: '#6b7280' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="ms-range w-full" />
    </div>
  );

  const ToggleButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
      style={{
        background: active ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.07)',
        color: active ? '#c4b5fd' : '#6b7280',
      }}>
      {children}
    </button>
  );

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="relative w-9 h-5 rounded-full transition-all flex-shrink-0"
      style={{ background: enabled ? '#7c3aed' : 'rgba(255,255,255,0.12)' }}>
      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: enabled ? '1.1rem' : '2px' }} />
    </button>
  );

  return (
    <div className="left-panel flex h-full overflow-hidden" style={{ flexShrink: 0 }}>
      {/* Icon rail */}
      <div
        className="flex flex-col items-center py-3 gap-1"
        style={{
          width: 56,
          background: 'rgba(7,9,20,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      >
        {/* Logo mark */}
        <div className="mb-3 w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', flexShrink: 0 }}>
          M
        </div>
        {/* Tab icons */}
        {TAB_ICONS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            title={label}
            className="w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all group"
            style={{
              background: activeTab === id ? 'rgba(124,58,237,0.2)' : 'transparent',
              border: activeTab === id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
            }}
          >
            <Icon size={18} strokeWidth={activeTab === id ? 2 : 1.5}
              style={{ color: activeTab === id ? '#a78bfa' : '#4b5563', transition: 'color 0.15s' }} />
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex flex-col h-full" style={{ width: 248, background: 'rgba(10,12,24,0.96)', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        {/* Panel header */}
        <div className="px-4 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
            {TAB_ICONS.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 styled-scroll">

          {/* ── PRESETS ── */}
          {activeTab === 'presets' && (
            <div>
              <SectionLabel>Templates</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(preset => {
                  const allBgs = [...GRADIENTS, ...MESH_GRADIENTS, ...WALLPAPERS];
                  const bg = allBgs.find(g => g.id === preset.thumb);
                  const bgCss = bg ? ('css' in bg ? bg.css : '') : '';
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        const s = preset.state;
                        const defaultModel = DEVICE_MODELS.find(m => m.storeType === s.deviceType);
                        updateState({
                          deviceType: s.deviceType,
                          deviceModel: defaultModel?.id ?? 'iphone-17-pro',
                          deviceLandscape: s.deviceLandscape ?? false,
                          bgType: s.bgType, bgColor: s.bgColor, scale: s.scale,
                          rotation: s.rotation, shadowIntensity: s.shadowIntensity,
                          shadowStyle: s.shadowStyle ?? 'spread', is3D: s.is3D,
                          tiltX: s.tiltX, tiltY: s.tiltY, animation: s.animation,
                          canvasPadding: s.canvasPadding ?? 0,
                          ...(s.borderRadius ? { borderRadius: s.borderRadius } : {}),
                        });
                      }}
                      className="rounded-xl overflow-hidden transition-all hover:scale-105 hover:brightness-110 relative"
                      style={{ height: 76, background: bgCss || '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="absolute inset-0 flex items-end p-2">
                        <span className="text-[10px] font-bold text-white/90 text-left leading-tight"
                          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                          {preset.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DEVICE ── */}
          {activeTab === 'device' && (
            <div>
              {/* URL Capture */}
              <SectionLabel>Capture from URL</SectionLabel>
              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 p-2.5">
                  <Link2 size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setCaptureError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleUrlCapture()}
                    placeholder="https://example.com"
                    className="flex-1 bg-transparent text-xs outline-none"
                    style={{ color: '#e2e8f0' }}
                  />
                  {urlInput && (
                    <button onClick={() => { setUrlInput(''); setCaptureError(''); }} style={{ color: '#4b5563' }}>
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleUrlCapture}
                  disabled={capturing || !urlInput.trim()}
                  className="w-full py-2 text-xs font-semibold transition-all"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: capturing ? 'rgba(124,58,237,0.1)' : urlInput ? 'rgba(124,58,237,0.15)' : 'transparent',
                    color: urlInput ? '#a78bfa' : '#4b5563',
                    cursor: capturing || !urlInput.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  {capturing ? '⏳ Capturing...' : '📸 Capture Screenshot'}
                </button>
              </div>
              {captureError && (
                <p className="text-[11px] mb-3 px-1" style={{ color: '#f87171' }}>{captureError}</p>
              )}

              {/* Upload media */}
              <SectionLabel>Upload Media</SectionLabel>
              <div className="flex gap-2 mb-4">
                <UploadTile icon={<ImageIcon size={14} />} label="Image" accept="image/*" color="#a78bfa"
                  onFile={(file) => {
                    const url = URL.createObjectURL(file);
                    updateState({ screenshotUrl: url, videoUrl: null, contentType: 'image' });
                  }}
                />
                <UploadTile icon={<Video size={14} />} label="Video" accept="video/*" color="#4ade80"
                  onFile={(file) => {
                    const url = URL.createObjectURL(file);
                    updateState({ videoUrl: url, screenshotUrl: null, contentType: 'video' });
                  }}
                />
              </div>

              {/* Current content indicator */}
              {(state.screenshotUrl || state.videoUrl) && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {state.contentType === 'video' ? <Video size={12} style={{ color: '#4ade80' }} /> : <ImageIcon size={12} style={{ color: '#4ade80' }} />}
                  <span className="text-xs" style={{ color: '#4ade80' }}>
                    {state.contentType === 'video' ? 'Video loaded' : 'Image loaded'}
                  </span>
                  <button
                    className="ml-auto text-xs"
                    style={{ color: '#374151' }}
                    onClick={() => updateState({ screenshotUrl: null, videoUrl: null, contentType: null })}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Device picker — grouped */}
              <SectionLabel>Device</SectionLabel>

              {/* Group tabs */}
              <div className="flex gap-1 mb-3 flex-wrap">
                {DEVICE_GROUPS.map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: selectedGroup === group ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                      border: selectedGroup === group ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      color: selectedGroup === group ? '#c4b5fd' : '#4b5563',
                    }}
                  >
                    <span>{GROUP_ICONS[group]}</span>
                    <span>{group}</span>
                  </button>
                ))}
              </div>

              {/* Model grid */}
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {DEVICE_MODELS.filter(m => m.group === selectedGroup).map(model => {
                  const isSelected = state.deviceModel === model.id;
                  return (
                    <button
                      key={model.id}
                      onClick={() => updateState({ deviceModel: model.id, deviceType: model.storeType })}
                      className="flex flex-col items-center justify-end gap-1.5 p-2.5 rounded-xl transition-all"
                      style={{
                        background: isSelected ? 'rgba(124,58,237,0.16)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1.5px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                        minHeight: 80,
                      }}
                    >
                      <div className="flex items-center justify-center flex-1">
                        <DeviceThumbnail modelId={model.id} isSelected={isSelected} />
                      </div>
                      <span className="text-[9.5px] font-medium leading-tight text-center"
                        style={{ color: isSelected ? '#c4b5fd' : '#6b7280' }}>
                        {model.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* iPhone color variants */}
              {state.deviceType === 'iphone' && (
                <>
                  <SectionLabel>Frame Color</SectionLabel>
                  <div className="flex gap-2 mb-4 items-center">
                    {IPHONE_COLORS.map(c => (
                      <button key={c.id} title={c.label} onClick={() => updateState({ deviceColor: c.id })}
                        style={{
                          width: 26, height: 26, borderRadius: '50%', background: c.bg,
                          border: state.deviceColor === c.id ? `2px solid #a78bfa` : `2px solid ${c.border}`,
                          boxShadow: state.deviceColor === c.id ? '0 0 0 2px rgba(167,139,250,0.35)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                    <span className="text-[10px] ml-1" style={{ color: '#4b5563' }}>
                      {IPHONE_COLORS.find(c => c.id === state.deviceColor)?.label}
                    </span>
                  </div>
                </>
              )}

              {/* Browser dark/light mode */}
              {state.deviceType === 'browser' && (
                <>
                  <SectionLabel>Browser Theme</SectionLabel>
                  <div className="flex gap-2 mb-4">
                    <ToggleButton active={state.browserMode === 'dark'} onClick={() => updateState({ browserMode: 'dark' })}>Dark</ToggleButton>
                    <ToggleButton active={state.browserMode === 'light'} onClick={() => updateState({ browserMode: 'light' })}>Light</ToggleButton>
                  </div>
                </>
              )}

              {/* Orientation */}
              {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
                <>
                  <SectionLabel>Orientation</SectionLabel>
                  <div className="flex gap-2 mb-4">
                    <ToggleButton active={!state.deviceLandscape} onClick={() => updateState({ deviceLandscape: false })}>Portrait</ToggleButton>
                    <ToggleButton active={state.deviceLandscape} onClick={() => updateState({ deviceLandscape: true })}>Landscape</ToggleButton>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BACKGROUND ── */}
          {activeTab === 'background' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Type</SectionLabel>
                <button onClick={handleShuffle} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280' }}>
                  <Shuffle size={11} /> Shuffle
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {(['solid', 'gradient', 'mesh', 'wallpaper', 'pattern', 'image'] as const).map(t => (
                  <button key={t} onClick={() => updateState({ bgType: t })}
                    className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
                    style={{
                      background: state.bgType === t ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                      border: state.bgType === t ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      color: state.bgType === t ? '#c4b5fd' : '#6b7280',
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              {state.bgType === 'solid' && (
                <>
                  <SectionLabel>Color</SectionLabel>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl border cursor-pointer"
                        style={{ background: state.bgColor, borderColor: 'rgba(255,255,255,0.12)' }} />
                      <input type="color" value={state.bgColor}
                        onChange={e => updateState({ bgColor: e.target.value })}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                    <input type="text" value={state.bgColor}
                      onChange={e => updateState({ bgColor: e.target.value })}
                      className="flex-1 bg-transparent border rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }} />
                  </div>
                </>
              )}

              {state.bgType === 'gradient' && (
                <>
                  <SectionLabel>Gradients</SectionLabel>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {GRADIENTS.map(g => (
                      <button key={g.id} onClick={() => updateState({ bgColor: g.id })}
                        className="rounded-xl transition-all hover:scale-110" title={g.label}
                        style={{
                          height: 42, background: g.css,
                          border: state.bgColor === g.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
                          boxShadow: state.bgColor === g.id ? '0 0 0 2px rgba(167,139,250,0.3)' : 'none',
                        }} />
                    ))}
                  </div>
                </>
              )}

              {state.bgType === 'mesh' && (
                <>
                  <SectionLabel>Mesh Gradients</SectionLabel>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => (
                      <button key={m.id} onClick={() => updateState({ bgColor: m.id })}
                        className="rounded-xl transition-all hover:scale-105" title={m.label}
                        style={{
                          height: 50, background: m.css,
                          border: state.bgColor === m.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
                        }} />
                    ))}
                  </div>
                  {state.screenshotUrl && (
                    <button onClick={handleAutoBackground} disabled={extracting}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mb-4 transition-all"
                      style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                      <Wand2 size={13} />
                      {extracting ? 'Extracting...' : 'Auto from Screenshot'}
                    </button>
                  )}
                </>
              )}

              {state.bgType === 'wallpaper' && (
                <>
                  <SectionLabel>Wallpapers</SectionLabel>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {WALLPAPERS.map(w => (
                      <button key={w.id} onClick={() => updateState({ bgColor: w.id })}
                        className="rounded-xl transition-all hover:scale-105 relative overflow-hidden" title={w.label}
                        style={{
                          height: 50, background: w.css,
                          border: state.bgColor === w.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.07)',
                        }}>
                        <div className="absolute inset-x-0 bottom-0 px-1 py-0.5" style={{ background: 'rgba(0,0,0,0.55)' }}>
                          <span className="text-[9px] text-white/80 leading-none">{w.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {state.bgType === 'pattern' && (
                <>
                  <SectionLabel>Pattern</SectionLabel>
                  <div className="flex flex-col gap-2 mb-4">
                    {PATTERNS.map(p => (
                      <button key={p.id} onClick={() => updateState({ bgPattern: p.id })}
                        className="h-12 rounded-xl transition-all flex items-center justify-center"
                        style={{ ...p.bgStyle('#1a1a2e'), border: state.bgPattern === p.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-xs text-white/50">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <SectionLabel>Pattern Color</SectionLabel>
                  <div className="relative mb-4">
                    <div className="w-full h-10 rounded-xl border cursor-pointer" style={{ background: state.bgColor, borderColor: 'rgba(255,255,255,0.1)' }} />
                    <input type="color" value={state.bgColor} onChange={e => updateState({ bgColor: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                  </div>
                </>
              )}

              {state.bgType === 'image' && (
                <>
                  <SectionLabel>Background Image</SectionLabel>
                  {state.bgImage && (
                    <div className="w-full h-24 rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={state.bgImage} className="w-full h-full object-cover" alt="bg" />
                    </div>
                  )}
                  <button onClick={() => bgFileRef.current?.click()}
                    className="w-full py-3 rounded-xl text-xs transition-all mb-4"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)', color: '#6b7280' }}>
                    {state.bgImage ? 'Change Image' : '+ Upload Image'}
                  </button>
                  <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
                </>
              )}

              {/* Overlay */}
              <div className="pt-4 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Color Overlay</SectionLabel>
                  <Toggle enabled={state.overlayEnabled} onToggle={() => updateState({ overlayEnabled: !state.overlayEnabled })} />
                </div>
                {state.overlayEnabled && (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs" style={{ color: '#9ca3af' }}>Color</span>
                      <div className="relative">
                        <div className="w-7 h-7 rounded-lg border cursor-pointer" style={{ background: state.overlayColor, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <input type="color" value={state.overlayColor} onChange={e => updateState({ overlayColor: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </div>
                      <div className="flex gap-1 flex-1">
                        {['#000000', '#ffffff', '#7c3aed', '#0ea5e9', '#ec4899'].map(col => (
                          <button key={col} onClick={() => updateState({ overlayColor: col })}
                            style={{ width: 18, height: 18, borderRadius: '50%', background: col, border: state.overlayColor === col ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        ))}
                      </div>
                    </div>
                    <SliderControl label="Opacity" value={state.overlayOpacity} min={0} max={90} onChange={v => updateState({ overlayOpacity: v })} unit="%" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TRANSFORM ── */}
          {activeTab === 'canvas' && (
            <div>
              <SectionLabel>Canvas Ratio</SectionLabel>
              <div className="flex gap-1.5 flex-wrap mb-5">
                {CANVAS_RATIOS.map(r => (
                  <button key={r.id} onClick={() => updateState({ canvasRatio: r.id })}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: state.canvasRatio === r.id ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.04)',
                      border: state.canvasRatio === r.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                      color: state.canvasRatio === r.id ? '#c4b5fd' : '#6b7280',
                    }}>
                    {r.label}
                  </button>
                ))}
              </div>

              <SliderControl label="Scale" value={Math.round(state.scale * 100)} min={30} max={120} onChange={v => updateState({ scale: v / 100 })} unit="%" />
              <SliderControl label="Rotation" value={state.rotation} min={-45} max={45} onChange={v => updateState({ rotation: v })} unit="°" />
              <SliderControl label="Padding" value={state.canvasPadding} min={0} max={80} onChange={v => updateState({ canvasPadding: v })} unit="px" />

              <div className="mt-1 mb-4" style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <SectionLabel>Shadow</SectionLabel>
                <div className="flex gap-1.5 mb-3">
                  {SHADOW_STYLES.map(s => (
                    <button key={s.id} onClick={() => updateState({ shadowStyle: s.id })}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: state.shadowStyle === s.id ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                        border: state.shadowStyle === s.id ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.06)',
                        color: state.shadowStyle === s.id ? '#c4b5fd' : '#9ca3af',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {state.shadowStyle !== 'none' && (
                  <>
                    <SliderControl label="Intensity" value={state.shadowIntensity} min={0} max={100} onChange={v => updateState({ shadowIntensity: v })} />
                    <SliderControl label="Direction" value={state.shadowDirection} min={0} max={360} onChange={v => updateState({ shadowDirection: v })} unit="°" />
                  </>
                )}
              </div>

              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>3D Perspective</SectionLabel>
                  <Toggle enabled={state.is3D} onToggle={() => updateState({ is3D: !state.is3D })} />
                </div>
                {state.is3D && (
                  <>
                    <SliderControl label="Tilt X" value={state.tiltX} min={-30} max={30} onChange={v => updateState({ tiltX: v })} unit="°" />
                    <SliderControl label="Tilt Y" value={state.tiltY} min={-30} max={30} onChange={v => updateState({ tiltY: v })} unit="°" />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TEXT ── */}
          {activeTab === 'text' && (
            <div>
              <button onClick={addText}
                className="w-full py-3 rounded-xl text-xs font-semibold mb-4 transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.35))', border: '1px solid rgba(124,58,237,0.45)', color: '#c4b5fd' }}>
                <Type size={13} /> Add Text Overlay
              </button>
              <p className="text-xs text-center" style={{ color: '#374151' }}>
                Drag text overlays on the canvas to reposition. Edit content in the Export panel.
              </p>
            </div>
          )}

          {/* ── ANIMATION ── */}
          {activeTab === 'animation' && (
            <div>
              <SectionLabel>Entrance & Loop</SectionLabel>
              <div className="flex flex-col gap-2">
                {(['none', 'float', 'pulse', 'spin', 'slide-in'] as const).map(anim => (
                  <button key={anim} onClick={() => updateState({ animation: anim })}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium capitalize text-left transition-all flex items-center gap-2.5"
                    style={{
                      background: state.animation === anim ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.025)',
                      border: state.animation === anim ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.06)',
                      color: state.animation === anim ? '#c4b5fd' : '#6b7280',
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: state.animation === anim ? '#a78bfa' : '#374151', flexShrink: 0 }} />
                    {anim === 'none' ? 'No Animation' : anim === 'slide-in' ? 'Slide In' : anim.charAt(0).toUpperCase() + anim.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function UploadTile({ icon, label, accept, color, onFile }: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  color: string;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      onClick={() => ref.current?.click()}
      className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all hover:scale-105"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-[11px] font-medium" style={{ color: '#6b7280' }}>{label}</span>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </button>
  );
}
