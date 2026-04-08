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
    accent: '#a78bfa',
    glow: 'rgba(124,58,237,0.35)',
    border: 'rgba(124,58,237,0.5)',
  },
  {
    id: 'movie',
    label: 'Movie',
    icon: <Film size={13} />,
    desc: 'Animated cinematic video export',
    accent: '#f87171',
    glow: 'rgba(239,68,68,0.35)',
    border: 'rgba(239,68,68,0.5)',
  },
  {
    id: 'screenshot',
    label: 'Screenshot',
    icon: <Camera size={13} />,
    desc: 'Capture any website into a device',
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.35)',
    border: 'rgba(56,189,248,0.5)',
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
    <div className="app-root" style={{ background: '#070912' }}>
      {/* Desktop layout */}
      <div className="desktop-layout">
        <LeftPanel />

        {/* Center */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top bar */}
          <div className="topbar flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{
              background: 'rgba(8,10,22,0.85)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>

            {/* Mode selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                      background: isActive ? `rgba(${mode.id === 'mockup' ? '124,58,237' : mode.id === 'movie' ? '239,68,68' : '56,189,248'},0.18)` : 'transparent',
                      border: isActive ? `1px solid ${mode.border}` : '1px solid transparent',
                      color: isActive ? mode.accent : '#4b5563',
                      boxShadow: isActive ? `0 0 12px ${mode.glow}` : 'none',
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
                    background: state.contentType === 'video' ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.1)',
                    color: state.contentType === 'video' ? '#4ade80' : '#a78bfa',
                    border: state.contentType === 'video' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(124,58,237,0.2)',
                  }}>
                  {state.contentType === 'video' ? '▶ Video' : '⬛ Image'}
                </span>
              )}
              <span className="text-xs font-medium" style={{ color: '#4b5563' }}>{deviceLabel}</span>
              {(state.deviceType === 'iphone' || state.deviceType === 'android' || state.deviceType === 'ipad') && (
                <span className="text-xs" style={{ color: '#374151' }}>
                  · {state.deviceLandscape ? 'Landscape' : 'Portrait'}
                </span>
              )}
              {state.canvasRatio !== 'free' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#4b5563', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {state.canvasRatio}
                </span>
              )}
            </div>
          </div>

          {/* Mode hint bar */}
          <div style={{
            padding: '6px 20px',
            background: `linear-gradient(90deg, ${activeMode.id === 'mockup' ? 'rgba(124,58,237,0.08)' : activeMode.id === 'movie' ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.08)'}, transparent)`,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
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
          style={{ background: 'rgba(8,10,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>M</div>
            <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>MockupStudio</span>
          </div>
          <div className="flex items-center gap-2">
            {state.contentType && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
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
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px 0', background: 'rgba(8,10,22,0.98)' }}>
          {CREATION_MODES.map(mode => {
            const isActive = state.creationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: isActive ? `rgba(${mode.id === 'mockup' ? '124,58,237' : mode.id === 'movie' ? '239,68,68' : '56,189,248'},0.18)` : 'rgba(255,255,255,0.04)',
                  border: isActive ? `1px solid ${mode.border}` : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? mode.accent : '#4b5563',
                }}>
                {mode.icon}
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Mobile bottom bar */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ background: 'rgba(8,10,22,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: mobileSheet === 'controls' ? activeMode.glow.replace('0.35', '0.22') : 'rgba(255,255,255,0.05)',
              border: mobileSheet === 'controls' ? `1px solid ${activeMode.border}` : '1px solid rgba(255,255,255,0.08)',
              color: mobileSheet === 'controls' ? activeMode.accent : '#6b7280',
            }}>
            <Layers size={14} />
            Controls
          </button>

          <button
            onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
            }}>
            <Download size={14} />
            Export
          </button>
        </div>

        {/* Mobile bottom sheet */}
        {mobileSheet && (
          <>
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setMobileSheet(null)} />
            <div className="mobile-sheet fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
              style={{ maxHeight: '58vh', background: 'rgba(10,12,24,0.98)', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
              {/* Drag handle */}
              <div className="flex items-center justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>
              {/* Sheet header */}
              <div className="flex items-center justify-between px-4 pt-1 pb-2 flex-shrink-0">
                <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                  {mobileSheet === 'controls' ? 'Controls' : 'Export'}
                </span>
                <button onClick={() => setMobileSheet(null)} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
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
