import { useRef, useState } from 'react';
import { AppProvider, useApp } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { RightPanel } from './components/panels/RightPanel';
import { MovieTimeline } from './components/timeline/MovieTimeline';
import { Download, Layers, X, Film } from 'lucide-react';
import { getModelById } from './data/devices';
import type { Device3DViewerHandle } from './components/devices3d/Device3DViewer';

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
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{deviceLabel}</span>
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

            {/* Movie mode button */}
            <button
              onClick={() => {
                updateState({ movieMode: !state.movieMode });
                if (state.movieMode) setMoviePlaying(false);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: state.movieMode ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                border: state.movieMode ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.09)',
                color: state.movieMode ? '#f87171' : '#6b7280',
              }}
            >
              <Film size={12} />
              Movie
            </button>
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
          <Canvas ref={canvasRef} viewerRef={viewerRef} textOverlays={state.texts} onUpdateText={updateText} />
        </div>

        {/* Mobile bottom bar */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ background: 'rgba(8,10,22,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setMobileSheet(mobileSheet === 'controls' ? null : 'controls')}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: mobileSheet === 'controls' ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.05)',
              border: mobileSheet === 'controls' ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.08)',
              color: mobileSheet === 'controls' ? '#c4b5fd' : '#6b7280',
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
