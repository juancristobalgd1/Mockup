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

        {/* ── Floating content sheet — appears above tab bar ─── */}
        {mobileTab !== null && (
          <>
            {/* Dim overlay — tap to close */}
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setMobileTab(null)}
            />
            <div style={{
              position: 'absolute', bottom: 64, left: 0, right: 0, zIndex: 30,
              maxHeight: '76vh',
              background: 'var(--rt-panel)',
              borderRadius: '20px 20px 0 0',
              borderTop: '1px solid var(--rt-border-mid)',
              boxShadow: '0 -12px 48px rgba(0,0,0,0.65)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>

              {/* Sheet header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '2px 16px 10px', flexShrink: 0,
                borderBottom: '1px solid var(--rt-border)',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rt-text)' }}>
                  {mobileTab === 'export' ? 'Export' : TAB_ICONS.find(t => t.id === mobileTab)?.label}
                </span>
                <button onClick={() => setMobileTab(null)} style={{
                  width: 26, height: 26, borderRadius: 13, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: 'var(--rt-text-2)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={13} />
                </button>
              </div>

              {/* Sheet content */}
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

        {/* ── Floating tab bar — always visible at the bottom ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 12px 14px',
          background: 'rgba(18, 20, 21, 0.88)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          scrollbarWidth: 'none',
        } as React.CSSProperties}>
          {TAB_ICONS.map(({ id, icon: Icon, label }) => {
            const active = mobileTab === id;
            return (
              <button key={id}
                onClick={() => setMobileTab(active ? null : id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 22, fontSize: 12, fontWeight: 600,
                  background: active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.09)',
                  border: '1px solid transparent',
                  color: active ? '#0d0e0f' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}>
                <Icon size={13} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </button>
            );
          })}
          {/* Export pill */}
          <button
            onClick={() => setMobileTab(mobileTab === 'export' ? null : 'export')}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 22, fontSize: 12, fontWeight: 700,
              background: mobileTab === 'export' ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.9)',
              color: '#0d0e0f', border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
            <Download size={13} />
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
