import { useRef, useState } from 'react';
import { AppProvider, useApp } from './store';
import type { CreationMode } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { TAB_ICONS } from './components/panels/tabs';
import type { Tab } from './components/panels/tabs';
import { RightPanel } from './components/panels/RightPanel';
import { MovieTimeline } from './components/timeline/MovieTimeline';
import { Download, X, Film, Smartphone } from 'lucide-react';
import { getModelById } from './data/devices';
import type { Device3DViewerHandle } from './components/devices3d/Device3DViewer';

const CREATION_MODES: {
  id: CreationMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: 'mockup',
    label: 'Image',
    icon: <Smartphone size={11} />,
    desc: 'Device mockup with image or video',
  },
  {
    id: 'movie',
    label: 'Movie',
    icon: <Film size={11} />,
    desc: 'Animated cinematic video export',
  },
];

function Editor() {
  const { state, updateState, updateText, removeText } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Device3DViewerHandle>(null);
  const movieTimeRef = useRef<number>(0);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [mobileTab, setMobileTab] = useState<Tab | 'export' | null>(null);

  const currentModel = getModelById(state.deviceModel);
  const deviceLabel = currentModel.label;
  const activeMode = CREATION_MODES.find(m => m.id === state.creationMode) ?? CREATION_MODES[0];

  const handleModeChange = (mode: CreationMode) => {
    const isMovie = mode === 'movie';
    updateState({ creationMode: mode, movieMode: isMovie });
    if (!isMovie) setMoviePlaying(false);
  };

  return (
    <div className="app-root" style={{ background: 'var(--rt-canvas)' }}>

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────── */}
      <div className="desktop-layout">
        <LeftPanel />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* ── Rotato-style Title Bar ──────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 14px', height: 42, flexShrink: 0,
            background: 'var(--rt-panel)',
            borderBottom: '1px solid var(--rt-border)',
            gap: 14,
          }}>
            {/* macOS traffic lights */}
            <div className="rt-traffic" style={{ flexShrink: 0 }}>
              <span className="tl-red" />
              <span className="tl-yellow" />
              <span className="tl-green" />
            </div>

            {/* Document / device title */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--rt-text-2)' }}>
                {deviceLabel}
                {(state.deviceType === 'iphone' || state.deviceType === 'android') && (
                  <span style={{ color: 'var(--rt-text-3)' }}>
                    {' '}· {state.deviceLandscape ? 'Landscape' : 'Portrait'}
                  </span>
                )}
              </span>
              {state.contentType && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 20,
                  background: state.contentType === 'video'
                    ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.07)',
                  color: state.contentType === 'video'
                    ? 'var(--rt-accent-green)' : 'var(--rt-text-3)',
                  border: state.contentType === 'video'
                    ? '1px solid rgba(48,209,88,0.2)' : '1px solid var(--rt-border)',
                }}>
                  {state.contentType === 'video' ? '▶ Video' : 'Image'}
                </span>
              )}
            </div>

            {/* Rotato-style segmented mode picker */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '2px',
              border: '1px solid var(--rt-border)',
              flexShrink: 0,
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
                      padding: '4px 11px', borderRadius: 6, cursor: 'pointer',
                      fontSize: 11, fontWeight: 600,
                      transition: 'all 0.12s',
                      background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                      color: isActive ? 'var(--rt-text)' : 'var(--rt-text-3)',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                    }}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }} className="canvas-bg">
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
      {/* Canvas fills the full screen; tab bar + sheet float over it */}
      <div className="mobile-layout" style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Canvas — absolute full fill */}
        <div style={{ position: 'absolute', inset: 0 }} className="canvas-bg">
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
          <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, zIndex: 15 }}>
            <MovieTimeline
              viewerRef={viewerRef}
              movieTimeRef={movieTimeRef}
              canvasRef={canvasRef}
              onPlayingChange={setMoviePlaying}
              onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); setMobileTab(null); }}
            />
          </div>
        )}

        {/* ── Floating glass panel — appears above tab bar ─── */}
        {mobileTab !== null && (
          <>
            {/* Invisible tap-to-close overlay (no dim) */}
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 20 }}
              onClick={() => setMobileTab(null)}
            />
            <div style={{
              position: 'absolute', bottom: 58, left: 8, right: 8, zIndex: 30,
              maxHeight: '70vh',
              background: 'rgba(22,24,26,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            } as React.CSSProperties}>
              {/* Content — no header, no handle, content starts immediately */}
              <div className="styled-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {mobileTab === 'export' ? (
                  <RightPanel
                    canvasRef={canvasRef}
                    viewerRef={viewerRef}
                    textOverlays={state.texts}
                    onUpdateText={updateText}
                    onRemoveText={removeText}
                  />
                ) : (
                  <LeftPanel mobile mobileContentOnly={mobileTab as Tab} />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Floating tab bar — dark pill style ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 14px 22px',
          background: 'transparent',
          scrollbarWidth: 'none',
        } as React.CSSProperties}>
          {TAB_ICONS.map(({ id, icon: Icon, label }) => {
            const active = mobileTab === id;
            return (
              <button key={id}
                onClick={() => setMobileTab(active ? null : id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 16px', borderRadius: 24,
                  fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                  background: active
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(30,30,32,0.88)',
                  border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.78)',
                  cursor: 'pointer', transition: 'all 0.14s',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}>
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
          {/* Export pill — slightly brighter */}
          <button
            onClick={() => setMobileTab(mobileTab === 'export' ? null : 'export')}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', borderRadius: 24,
              fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
              background: mobileTab === 'export'
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(30,30,32,0.88)',
              border: mobileTab === 'export'
                ? '1px solid rgba(255,255,255,0.25)'
                : '1px solid rgba(255,255,255,0.06)',
              color: '#fff',
              cursor: 'pointer', transition: 'all 0.14s',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            } as React.CSSProperties}>
            <Download size={14} />
            Export
          </button>
        </div>
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
