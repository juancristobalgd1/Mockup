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
  {
    id: 'screenshot',
    label: 'Screenshot',
    icon: <Camera size={11} />,
    desc: 'Capture any website into a device',
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
      <div className="mobile-layout">

        {/* Mobile topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 50, flexShrink: 0,
          background: 'var(--rt-panel)',
          borderBottom: '1px solid var(--rt-border)',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0d0e0f', fontWeight: 900, fontSize: 12, flexShrink: 0,
              fontStyle: 'italic',
            }}>M</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--rt-text)', letterSpacing: '-0.01em' }}>
              MockupStudio
            </span>
          </div>

          {/* Mode + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--rt-text-2)',
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--rt-border)',
            }}>
              {activeMode.label}
            </span>
            <button
              onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '7px 13px', borderRadius: 20, cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.9)', color: '#0d0e0f',
                border: 'none',
              }}>
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Mobile canvas */}
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
          display: 'flex', gap: 4, padding: '8px 12px 4px',
          background: 'var(--rt-panel)',
          borderTop: '1px solid var(--rt-border)',
        }}>
          {CREATION_MODES.map(mode => {
            const isActive = state.creationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                  color: isActive ? 'var(--rt-text)' : 'var(--rt-text-3)',
                }}>
                {mode.icon}
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Mobile bottom actions */}
        <div style={{
          display: 'flex', gap: 8, padding: '6px 12px 14px',
          background: 'var(--rt-panel)',
        }}>
          <button
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
              background: mobileSheet === 'controls' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--rt-border)',
              color: 'var(--rt-text)',
            }}>
            <Layers size={15} />
            Controls
          </button>

          <button
            onClick={() => setMobileSheet(mobileSheet === 'export' ? null : 'export')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: 'rgba(255,255,255,0.9)', color: '#0d0e0f',
              border: 'none',
            }}>
            <Download size={15} />
            Export
          </button>
        </div>

        {/* Mobile bottom sheet */}
        {mobileSheet && (
          <>
            <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.55)' }}
              onClick={() => setMobileSheet(null)} />
            <div className="mobile-sheet fixed bottom-0 left-0 right-0 z-50 overflow-hidden"
              style={{
                maxHeight: '75vh',
                background: 'var(--rt-panel)',
                borderRadius: '16px 16px 0 0',
                borderTop: '1px solid var(--rt-border-mid)',
                boxShadow: '0 -12px 48px rgba(0,0,0,0.6)',
              }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 18px 10px',
                borderBottom: '1px solid var(--rt-border)',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rt-text)' }}>
                  {mobileSheet === 'controls' ? 'Controls' : 'Export'}
                </span>
                <button
                  onClick={() => setMobileSheet(null)}
                  style={{
                    width: 26, height: 26, borderRadius: 13, border: 'none',
                    background: 'rgba(255,255,255,0.1)', color: 'var(--rt-text-2)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <X size={13} />
                </button>
              </div>
              <div className="overflow-y-auto styled-scroll" style={{ maxHeight: 'calc(75vh - 80px)' }}>
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
