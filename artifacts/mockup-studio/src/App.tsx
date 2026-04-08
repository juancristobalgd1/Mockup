import { useRef, useState } from 'react';
import { AppProvider, useApp } from './store';
import type { CreationMode } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';
import { MovieTimeline } from './components/timeline/MovieTimeline';
import { Download, Layers, X, Film, Smartphone, Camera } from 'lucide-react';
import { getModelById } from './data/devices';
import type { Device3DViewerHandle } from './components/devices3d/Device3DViewer';

const CREATION_MODES: { id: CreationMode; label: string; icon: React.ReactNode; desc: string; accent: string; glow: string; border: string }[] = [
  {
    id: 'mockup',
    label: 'Mockup',
    icon: <Smartphone size={13} />,
    desc: 'Device mockup with image or video',
    accent: '#374151',
    glow: 'rgba(55,65,81,0.15)',
    border: 'rgba(55,65,81,0.35)',
  },
  {
    id: 'movie',
    label: 'Movie',
    icon: <Film size={13} />,
    desc: 'Animated cinematic video export',
    accent: '#dc2626',
    glow: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.35)',
  },
  {
    id: 'screenshot',
    label: 'Screenshot',
    icon: <Camera size={13} />,
    desc: 'Capture any website into a device',
    accent: '#0284c7',
    glow: 'rgba(2,132,199,0.15)',
    border: 'rgba(2,132,199,0.35)',
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
    ? `${currentModel.label} · ${state.deviceColor}`
    : state.deviceType === 'browser'
    ? `${currentModel.label} · ${state.browserMode}`
    : currentModel.label;

  const activeMode = CREATION_MODES.find(m => m.id === state.creationMode) ?? CREATION_MODES[0];

  const handleModeChange = (mode: CreationMode) => {
    const isMovie = mode === 'movie';
    updateState({
      creationMode: mode,
      movieMode: isMovie,
    });
    if (!isMovie) setMoviePlaying(false);
  };

  return (
    <div className="app-root" style={{ background: '#f9fafb' }}>
      {/* Desktop layout */}
      <div className="desktop-layout">
        <LeftPanel />

        {/* Center */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top bar */}
          <div className="topbar flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{
              background: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
            }}>

            {/* Mode selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px', borderRadius: 12, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
              {CREATION_MODES.map(mode => {
                const isActive = state.creationMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    title={mode.desc}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 9, cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'all 0.18s',
                      background: isActive ? '#ffffff' : 'transparent',
                      border: isActive ? `1px solid ${mode.border}` : '1px solid transparent',
                      color: isActive ? mode.accent : '#9ca3af',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Right side info */}
            <div className="flex items-center gap-2">
              {state.contentType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: state.contentType === 'video' ? 'rgba(22,163,74,0.08)' : 'rgba(55,65,81,0.07)',
                    color: state.contentType === 'video' ? '#16a34a' : '#374151',
                    border: state.contentType === 'video' ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(55,65,81,0.15)',
                  }}>
                  {state.contentType === 'video' ? '▶ Video' : '⬛ Image'}
                </span>
              )}
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{deviceLabel}</span>
              {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  · {state.deviceLandscape ? 'Landscape' : 'Portrait'}
                </span>
              )}
              {state.canvasRatio !== 'free' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                  {state.canvasRatio}
                </span>
              )}
            </div>
          </div>

          {/* Mode hint bar */}
          <div style={{
            padding: '6px 20px',
            background: `linear-gradient(90deg, ${activeMode.id === 'mockup' ? 'rgba(55,65,81,0.05)' : activeMode.id === 'movie' ? 'rgba(220,38,38,0.05)' : 'rgba(2,132,199,0.05)'}, transparent)`,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.3s',
          }}>
            <span style={{ color: activeMode.accent, opacity: 0.9 }}>{activeMode.icon}</span>
            <span style={{ fontSize: 10, color: activeMode.accent, opacity: 0.7, fontWeight: 600, letterSpacing: '0.04em' }}>
              {activeMode.desc}
            </span>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative">
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

      {/* Mobile layout */}
      <div className="mobile-layout">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs text-white"
              style={{ background: '#374151' }}>M</div>
            <span className="text-sm font-bold" style={{ color: '#111827' }}>MockupStudio</span>
          </div>
          <div className="flex items-center gap-2">
            {state.contentType && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(55,65,81,0.08)', color: '#374151', border: '1px solid rgba(55,65,81,0.18)' }}>
                {state.contentType}
              </span>
            )}
          </div>
        </div>

        {/* Mobile canvas */}
        <div className="flex-1 overflow-hidden relative">
          <Canvas
            ref={canvasRef}
            viewerRef={viewerRef}
            textOverlays={state.texts}
            onUpdateText={updateText}
            moviePlaying={moviePlaying}
            movieTimeRef={movieTimeRef}
          />
        </div>

        {/* Movie Timeline (mobile — shown above bottom bar) */}
        {state.movieMode && (
          <MovieTimeline
            viewerRef={viewerRef}
            movieTimeRef={movieTimeRef}
            canvasRef={canvasRef}
            onPlayingChange={setMoviePlaying}
            onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); setMobileSheet(null); }}
          />
        )}

        {/* Mobile mode selector */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px 0', background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
          {CREATION_MODES.map(mode => {
            const isActive = state.creationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: isActive ? '#f3f4f6' : 'transparent',
                  border: isActive ? `1px solid ${mode.border}` : '1px solid #e5e7eb',
                  color: isActive ? mode.accent : '#9ca3af',
                }}>
                {mode.icon}
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Mobile bottom bar */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: mobileSheet === 'controls' ? '#f3f4f6' : '#f9fafb',
              border: mobileSheet === 'controls' ? `1px solid ${activeMode.border}` : '1px solid #e5e7eb',
              color: mobileSheet === 'controls' ? activeMode.accent : '#6b7280',
            }}>
            <Layers size={14} />
            Controls
          </button>

          <button
            onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: '#374151',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(55,65,81,0.2)',
            }}>
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Mobile bottom sheet */}
        {mobileSheet && (
          <>
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.25)' }}
              onClick={() => setMobileSheet(null)} />
            <div className="mobile-sheet fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
              style={{ maxHeight: '58vh', background: '#ffffff', borderRadius: '20px 20px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none' }}>
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: '#d1d5db' }} />
              </div>
              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 pt-1 pb-2 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color: '#111827' }}>
                  {mobileSheet === 'controls' ? 'Controls' : 'Export'}
                </span>
                <button onClick={() => setMobileSheet(null)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              {/* Scrollable content — full width */}
              <div className="overflow-y-auto styled-scroll" style={{ maxHeight: 'calc(58vh - 72px)' }}>
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
