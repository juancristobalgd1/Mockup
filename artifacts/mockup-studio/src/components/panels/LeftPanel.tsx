import { useState, useRef } from 'react';
import { Smartphone, Tablet, Laptop, Globe, Watch } from 'lucide-react';
import { useApp } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, PRESETS } from '../../data/backgrounds';
import type { DeviceType } from '../../store';

const DEVICES: { id: DeviceType; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'iphone', label: 'iPhone 15 Pro', icon: Smartphone },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'ipad', label: 'iPad', icon: Tablet },
  { id: 'macbook', label: 'MacBook', icon: Laptop },
  { id: 'browser', label: 'Browser', icon: Globe },
  { id: 'watch', label: 'Apple Watch', icon: Watch },
];

type Tab = 'device' | 'background' | 'canvas' | 'text' | 'animation' | 'presets';

export function LeftPanel() {
  const { state, updateState, addText } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('device');
  const bgFileRef = useRef<HTMLInputElement>(null);

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
        data-testid={`slider-${label.toLowerCase().replace(/\s/g, '-')}`}
      />
    </div>
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
            data-testid={`tab-${tab.id}`}
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

        {/* PRESETS */}
        {activeTab === 'presets' && (
          <div>
            <SectionLabel>Templates</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(preset => {
                const gradient = GRADIENTS.find(g => g.id === preset.thumb) || MESH_GRADIENTS.find(m => m.id === preset.thumb);
                const gradientCss = gradient ? ('css' in gradient ? gradient.css : '') : '';
                return (
                  <button
                    key={preset.id}
                    data-testid={`preset-${preset.id}`}
                    onClick={() => {
                      const s = preset.state;
                      updateState({
                        deviceType: s.deviceType,
                        deviceLandscape: s.deviceLandscape,
                        bgType: s.bgType,
                        bgColor: s.bgColor,
                        scale: s.scale,
                        rotation: s.rotation,
                        shadowIntensity: s.shadowIntensity,
                        is3D: s.is3D,
                        tiltX: s.tiltX,
                        tiltY: s.tiltY,
                        animation: s.animation,
                      });
                    }}
                    className="rounded-xl overflow-hidden transition-transform hover:scale-105 relative"
                    style={{
                      height: 80,
                      background: gradientCss || '#1a1a2e',
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

        {/* DEVICE */}
        {activeTab === 'device' && (
          <div>
            <SectionLabel>Device Type</SectionLabel>
            <div className="flex flex-col gap-1.5 mb-4">
              {DEVICES.map(dev => {
                const Icon = dev.icon;
                return (
                  <button
                    key={dev.id}
                    data-testid={`device-${dev.id}`}
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

            {state.deviceType !== 'browser' && state.deviceType !== 'watch' && (
              <>
                <SectionLabel>Orientation</SectionLabel>
                <div className="flex gap-2 mb-4">
                  {(['portrait', 'landscape'] as const).map(o => (
                    <button
                      key={o}
                      data-testid={`orientation-${o}`}
                      onClick={() => updateState({ deviceLandscape: o === 'landscape' })}
                      className="flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all"
                      style={{
                        background: (o === 'landscape') === state.deviceLandscape ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                        border: (o === 'landscape') === state.deviceLandscape ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
                        color: (o === 'landscape') === state.deviceLandscape ? '#c4b5fd' : '#9ca3af',
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* BACKGROUND */}
        {activeTab === 'background' && (
          <div>
            <SectionLabel>Type</SectionLabel>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(['solid', 'gradient', 'mesh', 'pattern', 'image'] as const).map(t => (
                <button
                  key={t}
                  data-testid={`bg-type-${t}`}
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

            {state.bgType === 'solid' && (
              <>
                <SectionLabel>Color</SectionLabel>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl border"
                    style={{ background: state.bgColor, borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <input
                    type="color"
                    value={state.bgColor}
                    onChange={e => updateState({ bgColor: e.target.value })}
                    className="opacity-0 absolute"
                    data-testid="bg-color-picker"
                  />
                  <input
                    type="text"
                    value={state.bgColor}
                    onChange={e => updateState({ bgColor: e.target.value })}
                    className="flex-1 bg-transparent border rounded-lg px-3 py-1.5 text-xs font-mono"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}
                    data-testid="bg-color-hex"
                  />
                </div>
              </>
            )}

            {state.bgType === 'gradient' && (
              <>
                <SectionLabel>Gradient Presets</SectionLabel>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {GRADIENTS.map(g => (
                    <button
                      key={g.id}
                      data-testid={`gradient-${g.id}`}
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

            {state.bgType === 'mesh' && (
              <>
                <SectionLabel>Mesh Gradients</SectionLabel>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {MESH_GRADIENTS.map(m => (
                    <button
                      key={m.id}
                      data-testid={`mesh-${m.id}`}
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
              </>
            )}

            {state.bgType === 'pattern' && (
              <>
                <SectionLabel>Pattern</SectionLabel>
                <div className="flex flex-col gap-2 mb-4">
                  {PATTERNS.map(p => (
                    <button
                      key={p.id}
                      data-testid={`pattern-${p.id}`}
                      onClick={() => updateState({ bgPattern: p.id })}
                      className="h-12 rounded-xl transition-all"
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
                <input
                  type="color"
                  value={state.bgColor}
                  onChange={e => updateState({ bgColor: e.target.value })}
                  className="w-full h-10 rounded-xl border cursor-pointer"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
                />
              </>
            )}

            {state.bgType === 'image' && (
              <>
                <SectionLabel>Background Image</SectionLabel>
                <button
                  data-testid="upload-bg-image"
                  onClick={() => bgFileRef.current?.click()}
                  className="w-full py-3 rounded-xl text-xs transition-all"
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
          </div>
        )}

        {/* CANVAS TRANSFORM */}
        {activeTab === 'canvas' && (
          <div>
            <SliderControl
              label="Scale"
              value={Math.round(state.scale * 100)}
              min={30}
              max={120}
              onChange={v => updateState({ scale: v / 100 })}
              unit="%"
            />
            <SliderControl
              label="Rotation"
              value={state.rotation}
              min={-45}
              max={45}
              onChange={v => updateState({ rotation: v })}
              unit="°"
            />
            <SliderControl
              label="Shadow"
              value={state.shadowIntensity}
              min={0}
              max={100}
              onChange={v => updateState({ shadowIntensity: v })}
            />

            <div className="mt-4 mb-2">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>3D Perspective</SectionLabel>
                <button
                  data-testid="toggle-3d"
                  onClick={() => updateState({ is3D: !state.is3D })}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{
                    background: state.is3D ? 'rgba(124,58,237,0.8)' : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: state.is3D ? '1.25rem' : '2px' }}
                  />
                </button>
              </div>

              {state.is3D && (
                <>
                  <SliderControl
                    label="Tilt X"
                    value={state.tiltX}
                    min={-30}
                    max={30}
                    onChange={v => updateState({ tiltX: v })}
                    unit="°"
                  />
                  <SliderControl
                    label="Tilt Y"
                    value={state.tiltY}
                    min={-30}
                    max={30}
                    onChange={v => updateState({ tiltY: v })}
                    unit="°"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* TEXT */}
        {activeTab === 'text' && (
          <div>
            <button
              data-testid="add-text"
              onClick={addText}
              className="w-full py-2.5 rounded-xl text-xs font-semibold mb-4 transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.4))',
                border: '1px solid rgba(124,58,237,0.5)',
                color: '#c4b5fd',
              }}
            >
              + Add Text
            </button>
            <p className="text-xs text-center" style={{ color: '#4b5563' }}>
              Drag text overlays on the canvas to reposition them.
            </p>
          </div>
        )}

        {/* ANIMATION */}
        {activeTab === 'animation' && (
          <div>
            <SectionLabel>Entrance & Loop</SectionLabel>
            <div className="flex flex-col gap-2">
              {(['none', 'float', 'pulse', 'spin', 'slide-in'] as const).map(anim => (
                <button
                  key={anim}
                  data-testid={`animation-${anim}`}
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
