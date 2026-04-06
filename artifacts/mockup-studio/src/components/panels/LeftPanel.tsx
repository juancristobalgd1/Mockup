import { useState, useRef } from 'react';
import { Smartphone, Tablet, Laptop, Globe, Watch, Monitor, Shuffle, Wand2 } from 'lucide-react';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, PRESETS } from '../../data/backgrounds';
import type { DeviceType, DeviceColor } from '../../store';

const DEVICES: { id: DeviceType; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'iphone', label: 'iPhone 15 Pro', icon: Smartphone },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'ipad', label: 'iPad', icon: Tablet },
  { id: 'macbook', label: 'MacBook', icon: Laptop },
  { id: 'imac', label: 'iMac', icon: Monitor },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'watch', label: 'Apple Watch', icon: Watch },
];

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

type Tab = 'device' | 'background' | 'canvas' | 'text' | 'animation' | 'presets';

function extractColorsFromImage(imgSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 20;
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
      const colors = sorted.slice(0, 4).map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return `rgb(${r},${g},${b})`;
      });
      resolve(colors);
    };
    img.onerror = () => resolve([]);
    img.src = imgSrc;
  });
}

export function LeftPanel() {
  const { state, updateState, addText } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('device');
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'presets', label: 'Presets' },
    { id: 'device', label: 'Device' },
    { id: 'background', label: 'Background' },
    { id: 'canvas', label: 'Transform' },
    { id: 'text', label: 'Text' },
    { id: 'animation', label: 'Animation' },
  ];

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateState({ bgType: 'image', bgImage: URL.createObjectURL(file) });
    }
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
      MESH_GRADIENTS.push({ id: '__auto__', label: 'Auto', css: meshCss });
    } finally {
      setExtracting(false);
    }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
      {children}
    </div>
  );

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
    unit = '',
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (v: number) => void;
    unit?: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: '#6b7280' }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );

  const ToggleButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
      style={{
        background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
        color: active ? '#c4b5fd' : '#9ca3af',
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 280,
        background: 'rgba(10,12,22,0.92)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            M
          </div>
          <span className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>MockupStudio</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 flex flex-wrap gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(124,58,237,0.25)' : 'transparent',
              color: activeTab === tab.id ? '#a78bfa' : '#6b7280',
              border: activeTab === tab.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

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
                      updateState({
                        deviceType: s.deviceType,
                        deviceLandscape: s.deviceLandscape ?? false,
                        bgType: s.bgType,
                        bgColor: s.bgColor,
                        scale: s.scale,
                        rotation: s.rotation,
                        shadowIntensity: s.shadowIntensity,
                        shadowStyle: s.shadowStyle ?? 'spread',
                        is3D: s.is3D,
                        tiltX: s.tiltX,
                        tiltY: s.tiltY,
                        animation: s.animation,
                        canvasPadding: s.canvasPadding ?? 0,
                        ...(s.borderRadius ? { borderRadius: s.borderRadius } : {}),
                      });
                    }}
                    className="rounded-xl overflow-hidden transition-transform hover:scale-105 relative"
                    style={{
                      height: 80,
                      background: bgCss || '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="absolute inset-0 flex items-end p-2">
                      <span className="text-[10px] font-semibold text-white/90 text-left leading-tight"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
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
            <SectionLabel>Device Type</SectionLabel>
            <div className="flex flex-col gap-1.5 mb-4">
              {DEVICES.map(dev => {
                const Icon = dev.icon;
                return (
                  <button
                    key={dev.id}
                    onClick={() => updateState({ deviceType: dev.id })}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: state.deviceType === dev.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      border: state.deviceType === dev.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      color: state.deviceType === dev.id ? '#c4b5fd' : '#9ca3af',
                    }}
                  >
                    <Icon size={15} />
                    <span className="text-xs font-medium">{dev.label}</span>
                  </button>
                );
              })}
            </div>

            {/* iPhone color variants */}
            {state.deviceType === 'iphone' && (
              <>
                <SectionLabel>Color</SectionLabel>
                <div className="flex gap-2 mb-4">
                  {IPHONE_COLORS.map(c => (
                    <button
                      key={c.id}
                      title={c.label}
                      onClick={() => updateState({ deviceColor: c.id })}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: c.bg,
                        border: state.deviceColor === c.id ? `2px solid #a78bfa` : `2px solid ${c.border}`,
                        boxShadow: state.deviceColor === c.id ? '0 0 0 2px rgba(167,139,250,0.4)' : 'none',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>
                <p className="text-[10px] mb-4" style={{ color: '#4b5563' }}>
                  {IPHONE_COLORS.find(c => c.id === state.deviceColor)?.label ?? 'Titanium'}
                </p>
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

            {/* Orientation (not for watch/browser/iMac) */}
            {state.deviceType !== 'browser' && state.deviceType !== 'watch' && state.deviceType !== 'imac' && state.deviceType !== 'macbook' && (
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
            {/* Type + Shuffle row */}
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Type</SectionLabel>
              <button
                onClick={handleShuffle}
                title="Shuffle background"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#6b7280',
                }}
              >
                <Shuffle size={11} />
                Shuffle
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(['solid', 'gradient', 'mesh', 'wallpaper', 'pattern', 'image'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => updateState({ bgType: t })}
                  className="px-3 py-1.5 rounded-lg text-xs capitalize transition-all"
                  style={{
                    background: state.bgType === t ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                    border: state.bgType === t ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    color: state.bgType === t ? '#c4b5fd' : '#6b7280',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Solid */}
            {state.bgType === 'solid' && (
              <>
                <SectionLabel>Color</SectionLabel>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl border cursor-pointer"
                      style={{ background: state.bgColor, borderColor: 'rgba(255,255,255,0.1)' }}
                    />
                    <input
                      type="color"
                      value={state.bgColor}
                      onChange={e => updateState({ bgColor: e.target.value })}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={state.bgColor}
                    onChange={e => updateState({ bgColor: e.target.value })}
                    className="flex-1 bg-transparent border rounded-lg px-3 py-1.5 text-xs font-mono"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                  />
                </div>
              </>
            )}

            {/* Gradient */}
            {state.bgType === 'gradient' && (
              <>
                <SectionLabel>Gradient Presets</SectionLabel>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => updateState({ bgColor: g.id })}
                      className="rounded-xl transition-transform hover:scale-110"
                      title={g.label}
                      style={{
                        height: 44,
                        background: g.css,
                        border: state.bgColor === g.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
                        boxShadow: state.bgColor === g.id ? '0 0 0 2px rgba(167,139,250,0.3)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Mesh */}
            {state.bgType === 'mesh' && (
              <>
                <SectionLabel>Mesh Gradients</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {MESH_GRADIENTS.filter(m => m.id !== '__auto__').map(m => (
                    <button
                      key={m.id}
                      onClick={() => updateState({ bgColor: m.id })}
                      className="rounded-xl transition-transform hover:scale-105"
                      title={m.label}
                      style={{
                        height: 52,
                        background: m.css,
                        border: state.bgColor === m.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </div>

                {/* Auto background from screenshot */}
                {state.screenshotUrl && (
                  <button
                    onClick={handleAutoBackground}
                    disabled={extracting}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mb-4 transition-all"
                    style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      color: '#c4b5fd',
                    }}
                  >
                    <Wand2 size={13} />
                    {extracting ? 'Extracting...' : 'Auto from Screenshot'}
                  </button>
                )}
              </>
            )}

            {/* Wallpaper */}
            {state.bgType === 'wallpaper' && (
              <>
                <SectionLabel>Wallpapers</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {WALLPAPERS.map(w => (
                    <button
                      key={w.id}
                      onClick={() => updateState({ bgColor: w.id })}
                      className="rounded-xl transition-transform hover:scale-105 relative overflow-hidden"
                      title={w.label}
                      style={{
                        height: 52,
                        background: w.css,
                        border: state.bgColor === w.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="absolute inset-x-0 bottom-0 px-1 py-0.5"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <span className="text-[9px] text-white/80 leading-none">{w.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Pattern */}
            {state.bgType === 'pattern' && (
              <>
                <SectionLabel>Pattern</SectionLabel>
                <div className="flex flex-col gap-2 mb-4">
                  {PATTERNS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => updateState({ bgPattern: p.id })}
                      className="h-12 rounded-xl transition-all flex items-center justify-center"
                      style={{
                        ...p.bgStyle('#1a1a2e'),
                        border: state.bgPattern === p.id ? '2px solid #a78bfa' : '1.5px solid rgba(255,255,255,0.08)',
                      }}
                    >
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

            {/* Image upload */}
            {state.bgType === 'image' && (
              <>
                <SectionLabel>Background Image</SectionLabel>
                {state.bgImage && (
                  <div className="w-full h-24 rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={state.bgImage} className="w-full h-full object-cover" alt="bg" />
                  </div>
                )}
                <button
                  onClick={() => bgFileRef.current?.click()}
                  className="w-full py-3 rounded-xl text-xs transition-all mb-4"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    color: '#6b7280',
                  }}
                >
                  {state.bgImage ? 'Change Image' : 'Upload Image'}
                </button>
                <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgImage} />
              </>
            )}

            {/* Overlay section */}
            <div className="border-t pt-4 mt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Overlay</SectionLabel>
                <button
                  onClick={() => updateState({ overlayEnabled: !state.overlayEnabled })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: state.overlayEnabled ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: state.overlayEnabled ? '1.25rem' : '2px' }}
                  />
                </button>
              </div>

              {state.overlayEnabled && (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs" style={{ color: '#9ca3af' }}>Color</span>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg border cursor-pointer" style={{ background: state.overlayColor, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <input type="color" value={state.overlayColor} onChange={e => updateState({ overlayColor: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    </div>
                    <div className="flex-1 flex gap-1">
                      {['#000000', '#ffffff', '#7c3aed', '#0ea5e9', '#ec4899'].map(col => (
                        <button
                          key={col}
                          onClick={() => updateState({ overlayColor: col })}
                          style={{ width: 20, height: 20, borderRadius: '50%', background: col, border: state.overlayColor === col ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
                        />
                      ))}
                    </div>
                  </div>
                  <SliderControl
                    label="Opacity"
                    value={state.overlayOpacity}
                    min={0}
                    max={90}
                    onChange={v => updateState({ overlayOpacity: v })}
                    unit="%"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSFORM ── */}
        {activeTab === 'canvas' && (
          <div>
            {/* Canvas Ratio */}
            <SectionLabel>Canvas Ratio</SectionLabel>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {CANVAS_RATIOS.map(r => (
                <button
                  key={r.id}
                  onClick={() => updateState({ canvasRatio: r.id })}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: state.canvasRatio === r.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                    border: state.canvasRatio === r.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    color: state.canvasRatio === r.id ? '#c4b5fd' : '#6b7280',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <SliderControl label="Scale" value={Math.round(state.scale * 100)} min={30} max={120} onChange={v => updateState({ scale: v / 100 })} unit="%" />
            <SliderControl label="Rotation" value={state.rotation} min={-45} max={45} onChange={v => updateState({ rotation: v })} unit="°" />
            <SliderControl label="Padding" value={state.canvasPadding} min={0} max={80} onChange={v => updateState({ canvasPadding: v })} unit="px" />

            {/* Shadow */}
            <div className="mt-2 mb-4">
              <SectionLabel>Shadow Style</SectionLabel>
              <div className="flex gap-1.5 mb-3">
                {SHADOW_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => updateState({ shadowStyle: s.id })}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: state.shadowStyle === s.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      border: state.shadowStyle === s.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      color: state.shadowStyle === s.id ? '#c4b5fd' : '#9ca3af',
                    }}
                  >
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

            {/* 3D Perspective */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>3D Perspective</SectionLabel>
                <button
                  onClick={() => updateState({ is3D: !state.is3D })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: state.is3D ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: state.is3D ? '1.25rem' : '2px' }} />
                </button>
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
            <button
              onClick={addText}
              className="w-full py-2.5 rounded-xl text-xs font-semibold mb-4 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.4))',
                border: '1px solid rgba(124,58,237,0.5)',
                color: '#c4b5fd',
              }}
            >
              + Add Text Overlay
            </button>
            <p className="text-xs text-center" style={{ color: '#4b5563' }}>
              Drag text overlays on the canvas to reposition. Edit text content in the export panel.
            </p>
          </div>
        )}

        {/* ── ANIMATION ── */}
        {activeTab === 'animation' && (
          <div>
            <SectionLabel>Entrance & Loop</SectionLabel>
            <div className="flex flex-col gap-2">
              {(['none', 'float', 'pulse', 'spin', 'slide-in'] as const).map(anim => (
                <button
                  key={anim}
                  onClick={() => updateState({ animation: anim })}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium capitalize text-left transition-all"
                  style={{
                    background: state.animation === anim ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
                    border: state.animation === anim ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                    color: state.animation === anim ? '#c4b5fd' : '#9ca3af',
                  }}
                >
                  {anim === 'none' ? 'No Animation' : anim === 'slide-in' ? 'Slide In' : anim.charAt(0).toUpperCase() + anim.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
