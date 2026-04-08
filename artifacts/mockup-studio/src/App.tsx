import { useRef, useState } from 'react';
import { AppProvider, useApp } from './store';
import type { CreationMode } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';
import { MovieTimeline } from './components/timeline/MovieTimeline';
import { Download, Layers, X, Film, Smartphone, Camera, ChevronDown } from 'lucide-react';
import { getModelById } from './data/devices';
import type { Device3DViewerHandle } from './components/devices3d/Device3DViewer';

const CREATION_MODES: {
  id: CreationMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    id: 'mockup',
    label: 'Mockup',
    icon: <Smartphone size={12} />,
    desc: 'Device mockup with image or video',
    accent: '#374151',
    bg: 'rgba(55,65,81,0.08)',
    border: 'rgba(55,65,81,0.25)',
  },
  {
    id: 'movie',
    label: 'Movie',
    icon: <Film size={12} />,
    desc: 'Animated cinematic video export',
    accent: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.3)',
  },
  {
    id: 'screenshot',
    label: 'Screenshot',
    icon: <Camera size={12} />,
    desc: 'Capture any website into a device',
    accent: '#0284c7',
    bg: 'rgba(2,132,199,0.08)',
    border: 'rgba(2,132,199,0.3)',
  },
];

function Editor() {
  const { state, updateState, updateText, removeText } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Device3DViewerHandle>(null);
  const movieTimeRef = useRef<number>(0);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'controls' | 'export' | null>(null);

  const currentModel = getModelById(state.deviceModel);
  const deviceLabel = state.deviceType === 'iphone'
    ? `${currentModel.label}`
    : state.deviceType === 'browser'
    ? `${currentModel.label}`
    : currentModel.label;

  const activeMode = CREATION_MODES.find(m => m.id === state.creationMode) ?? CREATION_MODES[0];

  const handleModeChange = (mode: CreationMode) => {
    const isMovie = mode === 'movie';
    updateState({ creationMode: mode, movieMode: isMovie });
    if (!isMovie) setMoviePlaying(false);
  };

  return (
    <div className="app-root" style={{ background: '#f1f3f5' }}>

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────── */}
      <div className="desktop-layout">
        <LeftPanel />

        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', height: 48, flexShrink: 0,
            background: '#ffffff', borderBottom: '1px solid #e5e7eb',
            gap: 12,
          }}>

            {/* Mode selector — centered */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: '3px', borderRadius: 10,
              background: '#f3f4f6', border: '1px solid #e5e7eb',
            }}>
              {CREATION_MODES.map(mode => {
                const isActive = state.creationMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    title={mode.desc}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 11px', borderRadius: 7, cursor: 'pointer',
                      fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                      background: isActive ? '#ffffff' : 'transparent',
                      border: isActive ? `1px solid ${mode.border}` : '1px solid transparent',
                      color: isActive ? mode.accent : '#9ca3af',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                    }}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Device info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                {deviceLabel}
                {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
                  <span> · {state.deviceLandscape ? 'Landscape' : 'Portrait'}</span>
                )}
              </span>
              {state.contentType && (
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                  background: state.contentType === 'video' ? 'rgba(22,163,74,0.08)' : 'rgba(55,65,81,0.07)',
                  color: state.contentType === 'video' ? '#16a34a' : '#374151',
                  border: state.contentType === 'video' ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(55,65,81,0.15)',
                }}>
                  {state.contentType === 'video' ? '▶ Video' : '⬛ Image'}
                </span>
              )}
            </div>

            {/* Mode indicator pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8,
              background: activeMode.bg, border: `1px solid ${activeMode.border}`,
            }}>
              <span style={{ color: activeMode.accent }}>{activeMode.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: activeMode.accent, letterSpacing: '0.03em' }}>
                {activeMode.label.toUpperCase()} MODE
              </span>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative canvas-bg">
            <Canvas
              ref={canvasRef}
              viewerRef={viewerRef}
              textOverlays={state.texts}
              onUpdateText={updateText}
              moviePlaying={moviePlaying}
              movieTimeRef={movieTimeRef}
            />
          </div>

          {/* Movie Timeline */}
          {state.movieMode && (
            <MovieTimeline
              viewerRef={viewerRef}
              movieTimeRef={movieTimeRef}
              canvasRef={canvasRef}
              onPlayingChange={setMoviePlaying}
              onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); }}
            />
          )}
        </div>

        <RightPanel
          canvasRef={canvasRef}
          viewerRef={viewerRef}
          textOverlays={state.texts}
          onUpdateText={updateText}
          onRemoveText={removeText}
        />
      </div>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────── */}
      <div className="mobile-layout">

        {/* Mobile topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 52, flexShrink: 0,
          background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0,
            }}>M</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>MockupStudio</div>
              <div style={{ fontSize: 9, color: activeMode.accent, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {activeMode.label} Mode
              </div>
            </div>
          </div>

          {/* Right: content badge + export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {state.contentType && (
              <span style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                background: state.contentType === 'video' ? 'rgba(22,163,74,0.1)' : 'rgba(55,65,81,0.07)',
                color: state.contentType === 'video' ? '#16a34a' : '#6b7280',
                border: state.contentType === 'video' ? '1px solid rgba(22,163,74,0.2)' : '1px solid #e5e7eb',
              }}>
                {state.contentType === 'video' ? '▶ Video' : 'Image'}
              </span>
            )}
            <button
              onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: '#111827', color: '#fff',
                border: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}>
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Mobile canvas */}
        <div className="flex-1 overflow-hidden relative canvas-bg">
          <Canvas
            ref={canvasRef}
            viewerRef={viewerRef}
            textOverlays={state.texts}
            onUpdateText={updateText}
            moviePlaying={moviePlaying}
            movieTimeRef={movieTimeRef}
          />
        </div>

        {/* Movie Timeline (mobile) */}
        {state.movieMode && (
          <MovieTimeline
            viewerRef={viewerRef}
            movieTimeRef={movieTimeRef}
            canvasRef={canvasRef}
            onPlayingChange={setMoviePlaying}
            onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); setMobileSheet(null); }}
          />
        )}

        {/* Mobile mode tabs */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 16px 6px',
          background: '#ffffff', borderTop: '1px solid #e5e7eb',
        }}>
          {CREATION_MODES.map(mode => {
            const isActive = state.creationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 4px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                  background: isActive ? mode.bg : 'transparent',
                  border: isActive ? `1.5px solid ${mode.border}` : '1.5px solid #e5e7eb',
                  color: isActive ? mode.accent : '#9ca3af',
                }}>
                {mode.icon}
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Mobile bottom actions */}
        <div style={{
          display: 'flex', gap: 8, padding: '8px 16px 12px',
          background: '#ffffff',
        }}>
          <button
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 8px', borderRadius: 14, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
              background: mobileSheet === 'controls' ? activeMode.bg : '#f3f4f6',
              border: mobileSheet === 'controls' ? `1.5px solid ${activeMode.border}` : '1.5px solid #e5e7eb',
              color: mobileSheet === 'controls' ? activeMode.accent : '#374151',
            }}>
            <Layers size={16} />
            Controls
          </button>

          <button
            onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 8px', borderRadius: 14, cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: '#111827', color: '#ffffff',
              border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Mobile bottom sheet */}
        {mobileSheet && (
          <>
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.2)' }}
              onClick={() => setMobileSheet(null)} />
            <div className="mobile-sheet fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
              style={{
                maxHeight: '72vh',
                background: '#ffffff',
                borderRadius: '20px 20px 0 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
              }}>
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1d5db' }} />
              </div>
              {/* Sheet header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 20px 12px',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {mobileSheet === 'controls' ? 'Controls' : 'Export'}
                  </div>
                  {mobileSheet === 'controls' && (
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                      {activeMode.desc}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setMobileSheet(null)}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    background: '#f3f4f6', color: '#6b7280', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={14} />
                </button>
              </div>
              {/* Scrollable content */}
              <div className="overflow-y-auto styled-scroll" style={{ maxHeight: 'calc(72vh - 80px)' }}>
                {mobileSheet === 'controls' && <LeftPanel mobile />}
                {mobileSheet === 'export' && (
                  <RightPanel canvasRef={canvasRef} viewerRef={viewerRef} textOverlays={state.texts} onUpdateText={updateText} onRemoveText={removeText} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Editor />
    </AppProvider>
  );
}
