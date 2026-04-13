import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './store';
import { Toaster } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { CreationMode } from './store';
import { Canvas } from './components/canvas/Canvas';
import { LeftPanel } from './components/panels/LeftPanel';
import { TAB_ICONS } from './components/panels/tabs';
import type { Tab } from './components/panels/tabs';
import { RightPanel } from './components/panels/RightPanel';
import { MovieTimeline } from './components/timeline/MovieTimeline';
import type { MovieTimelineHandle } from './components/timeline/MovieTimeline';
import { 
  Undo2, Redo2, 
  Smartphone, Film, 
  Download, Grid3X3
} from 'lucide-react';
import { GridOverlay } from './components/ui/GridOverlay';
import { getModelById } from './data/devices';
import type { Device3DViewerHandle } from './components/devices3d/Device3DViewer';

function Shortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/50">
      {children}
    </span>
  );
}

const CREATION_MODES: {
  id: CreationMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    id: 'mockup',
    label: 'Imagen',
    icon: <Smartphone size={11} />,
    desc: 'Mockup de dispositivo con imagen o video',
  },
  {
    id: 'movie',
    label: 'Película',
    icon: <Film size={11} />,
    desc: 'Exportación de video cinemático animado',
  },
];

function Editor() {
  const { state, updateState, updateText, removeText, undo, redo, canUndo, canRedo } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Device3DViewerHandle>(null);
  const movieTimeRef = useRef<number>(0);
  const movieTimelineRef = useRef<MovieTimelineHandle>(null);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [mobileTab, setMobileTab] = useState<Tab | 'export' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('presets');
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  const currentModel = getModelById(state.deviceModel);
  const deviceLabel = currentModel.label;
  const activeMode = CREATION_MODES.find(m => m.id === state.creationMode) ?? CREATION_MODES[0];

  const TOOLBAR_ACTIONS = [
    { title: 'Cuadrícula', icon: Grid3X3, action: () => updateState({ showGrid: !state.showGrid }), enabled: true, shortcut: 'G' },
    { title: 'Deshacer', icon: Undo2, action: undo, enabled: canUndo, shortcut: '⌘Z' },
    { title: 'Rehacer', icon: Redo2, action: redo, enabled: canRedo, shortcut: '⇧⌘Z' },
  ];

  // ── Global keyboard shortcuts: Ctrl+Z (undo) / Ctrl+Shift+Z (redo) / G (grid) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditing) return;
      
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey)) {
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if (key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
        else if (key === 'y') { e.preventDefault(); redo(); }
      } else {
        if (key === 'g') { e.preventDefault(); updateState({ showGrid: !state.showGrid }); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, state.showGrid, updateState]);

  // ── Warn before unload when there are unsaved changes ──
  useEffect(() => {
    const hasContent = state.screenshotUrl || state.videoUrl || state.texts.length > 0 || state.annotateStrokes.length > 0;
    if (!hasContent) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.screenshotUrl, state.videoUrl, state.texts.length, state.annotateStrokes.length]);

  const handleModeChange = (mode: CreationMode) => {
    const isMovie = mode === 'movie';
    updateState({ creationMode: mode, movieMode: isMovie });
    if (!isMovie) setMoviePlaying(false);
  };

  return (
    <div className="app-root" style={{ background: 'var(--rt-canvas)' }}>

      {/* Skip link for keyboard users */}
      <a href="#main-canvas" className="skip-link">Skip to canvas</a>

      {/* ── DESKTOP LAYOUT ─────────────────────────────────────── */}
      <div className="desktop-layout">
        <aside aria-label="Design controls">
          <LeftPanel activeTab={activeTab} setActiveTab={setActiveTab} />
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* ── Rotato-style Title Bar ──────────────────────────── */}
          <header style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: '0 14px', height: 42, flexShrink: 0,
            background: 'var(--rt-panel)',
            borderBottom: '1px solid var(--rt-border)',
          }}>
            {/* Left: traffic lights + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div className="rt-traffic" role="presentation" aria-hidden="true" style={{ flexShrink: 0 }}>
                <span className="tl-red" />
                <span className="tl-yellow" />
                <span className="tl-green" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--rt-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deviceLabel}
                  {(state.deviceType === 'iphone' || state.deviceType === 'android') && (
                    <span style={{ color: 'var(--rt-text-3)' }}>
                      {' '}· {state.deviceLandscape ? 'Horizontal' : 'Vertical'}
                    </span>
                  )}
                </span>
                {state.contentType && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                    background: state.contentType === 'video' ? 'rgba(48,209,88,0.12)' : 'rgba(255,255,255,0.07)',
                    color: state.contentType === 'video' ? 'var(--rt-accent-green)' : 'var(--rt-text-3)',
                    border: state.contentType === 'video' ? '1px solid rgba(48,209,88,0.2)' : '1px solid var(--rt-border)',
                  }}>
                    {state.contentType === 'video' ? '▶ Video' : 'Imagen'}
                  </span>
                )}
              </div>
            </div>

            {/* Center: Undo / Redo group — always in the exact middle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 1,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 9, padding: '3px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              {TOOLBAR_ACTIONS.map(({ title, icon: Icon, action, enabled, shortcut }, i) => (
                <Tooltip key={i} delayDuration={400}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={action}
                      disabled={!enabled}
                      aria-label={title}
                      className="btn-press"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 30, height: 26, borderRadius: 6,
                        background: 'transparent', border: 'none',
                        color: enabled ? 'var(--rt-text)' : 'var(--rt-text-3)',
                        cursor: enabled ? 'pointer' : 'not-allowed',
                        transition: 'all 0.12s',
                        opacity: enabled ? 1 : 0.4,
                      }}
                      onMouseEnter={e => { if (enabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex items-center">
                    {title}
                    {shortcut && <Shortcut>{shortcut}</Shortcut>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Right: segmented mode picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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
                    <Tooltip key={mode.id} delayDuration={400}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleModeChange(mode.id)}
                          aria-label={mode.desc}
                          aria-pressed={isActive}
                          className="btn-press"
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
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{mode.desc}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Canvas */}
          <main id="main-canvas" style={{ flex: 1, overflow: 'hidden', position: 'relative' }} className="canvas-bg">
            <AnimatePresence mode="wait">
              <motion.div
                key={state.creationMode}
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', height: '100%' }}
              >
                <Canvas
                  ref={canvasRef}
                  viewerRef={viewerRef}
                  textOverlays={state.texts}
                  onUpdateText={updateText}
                  moviePlaying={moviePlaying}
                  movieTimeRef={movieTimeRef}
                />
                {state.showGrid && <GridOverlay opacity={0.65} />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Movie Timeline */}
          {state.movieMode && (
            <MovieTimeline
              ref={movieTimelineRef}
              viewerRef={viewerRef}
              movieTimeRef={movieTimeRef}
              canvasRef={canvasRef}
              onPlayingChange={setMoviePlaying}
              onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); }}
            />
          )}
        </div>

        <aside aria-label="Export controls">
          <RightPanel
            canvasRef={canvasRef}
            viewerRef={viewerRef}
            movieTimelineRef={movieTimelineRef}
            movieTimeRef={movieTimeRef}
            textOverlays={state.texts}
            onUpdateText={updateText}
            onRemoveText={removeText}
          />
        </aside>
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


        {/* ── Floating glass panel — appears above tab bar ─── */}
        {mobileTab !== null && (
          <>
            {/* Invisible tap-to-close overlay (no dim) */}
            <div
              style={{ position: 'absolute', inset: 0, zIndex: 20 }}
              onClick={() => setMobileTab(null)}
            />
            <div style={{
              position: 'absolute',
              bottom: state.movieMode ? (timelineCollapsed ? 96 : 180) : 58,
              left: 8, right: 8, zIndex: 30,
              maxHeight: state.movieMode ? (timelineCollapsed ? '68vh' : '48vh') : '70vh',
              background: 'transparent',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              borderRadius: 20,
              border: 'none',
              boxShadow: 'none',
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
                  <LeftPanel mobile mobileContentOnly={mobileTab as Tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Floating top bar — mode group + undo/redo + export ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '10px 14px',
          pointerEvents: 'none',
        }}>
          {/* Left: Image / Movie group button */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(22,24,26,0.82)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              borderRadius: 14, padding: 3,
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              pointerEvents: 'auto',
            } as React.CSSProperties}>
              {CREATION_MODES.map(mode => {
                const isActive = state.creationMode === mode.id;
                const isMovie = mode.id === 'movie';
                return (
                  <button key={mode.id} onClick={() => handleModeChange(mode.id)}
                    aria-label={mode.desc}
                    aria-pressed={isActive}
                    className="btn-press"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 11, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      transition: 'all 0.13s',
                      background: isActive ? (isMovie ? '#161819' : 'rgba(255,255,255,0.14)') : 'transparent',
                      border: isActive ? `1px solid ${isMovie ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.14)'}` : '1px solid transparent',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.52)',
                      boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    }}>
                    {mode.icon}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: Undo / Redo group */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 1,
            background: 'rgba(22,24,26,0.82)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: 14, padding: 3,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
          } as React.CSSProperties}>
            {TOOLBAR_ACTIONS.map(({ action, enabled, icon: Icon, title }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={!enabled}
                aria-label={title}
                className="btn-press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  cursor: enabled ? 'pointer' : 'not-allowed',
                  transition: 'background 0.12s, opacity 0.12s',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--rt-text-2)',
                  opacity: enabled ? 1 : 0.3,
                }}
                onMouseEnter={e => { if (enabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Icon size={15} strokeWidth={2} />
              </button>
            ))}
          </div>

          {/* Right: Export button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setMobileTab(mobileTab === 'export' ? null : 'export')}
              aria-label={mobileTab === 'export' ? 'Close export panel' : 'Open export panel'}
              className="btn-press"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 14,
                fontSize: 13, fontWeight: 700,
                background: mobileTab === 'export'
                  ? 'rgba(255,255,255,0.20)'
                  : 'rgba(22,24,26,0.82)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: mobileTab === 'export'
                  ? '1px solid rgba(255,255,255,0.25)'
                  : '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                cursor: 'pointer', transition: 'all 0.13s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                pointerEvents: 'auto',
              } as React.CSSProperties}>
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* ── Bottom: tab bar (+ timeline in movie mode) ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Tab pill row */}
          <nav aria-label="Editor tabs" style={{
            display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 14px 22px',
            background: 'transparent', scrollbarWidth: 'none',
          } as React.CSSProperties} className="tab-bar-scroll">
            {TAB_ICONS.map(({ id, icon: Icon, label }) => {
              const active = mobileTab === id;
              return (
                <button key={id}
                  onClick={() => setMobileTab(active ? null : id)}
                  aria-label={label}
                  aria-pressed={active}
                  className="btn-press"
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 16px', borderRadius: 24,
                    fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(30,30,32,0.88)',
                    border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.78)',
                    cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  }}>
                  <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Timeline — sits below the tab bar when movie mode is active */}
          {state.movieMode && (
            <MovieTimeline
              ref={movieTimelineRef}
              viewerRef={viewerRef}
              movieTimeRef={movieTimeRef}
              canvasRef={canvasRef}
              hideManualKeyframeButton
              forceCollapsed={!!mobileTab}
              onPlayingChange={setMoviePlaying}
              onCollapsedChange={setTimelineCollapsed}
              onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); setMobileTab(null); setTimelineCollapsed(false); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <TooltipProvider>
      <AppProvider>
        <Editor />
        <Toaster position="top-center" richColors theme="dark" closeButton />
      </AppProvider>
    </TooltipProvider>
  );
}
