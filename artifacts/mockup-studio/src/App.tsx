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
  Download, Grid3X3,
  Home, Crown, Lightbulb, MoreHorizontal,
  Plus, LayoutGrid, Image as ImageIcon, Wand2, Type, 
  Settings2, Box, Palette, Pencil, MousePointer2, Layers,
  Tags, Sliders, Blend, PenLine, Sparkles
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
    <div className="app-root" style={{ background: 'var(--ps-canvas)', position: 'relative' }}>

      {/* Skip link for keyboard users */}
      <a href="#main-canvas" className="skip-link">Skip to canvas</a>

      {/* ── MAIN VIEWPORT (Canvas) ─────────────────────────────────── */}
      <main id="main-canvas" style={{ 
        position: 'absolute', inset: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 20px 140px' 
      }}>
        <div style={{ 
          width: '100%', height: '100%', 
          position: 'relative', overflow: 'hidden',
          borderRadius: 20, boxShadow: '0 20px 80px rgba(0,0,0,0.8)'
        }} className="canvas-bg">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.creationMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
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
        </div>
      </main>

      {/* ── TOP FLOATING PILLS ─────────────────────────────────────── */}
      <header style={{
        position: 'absolute', top: 20, left: 20, right: 20, zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none'
      }}>
        {/* Left: Home & Crown */}
        <div className="floating-pill" style={{ pointerEvents: 'auto' }}>
          <button className="btn-press" style={{ padding: '8px 12px', color: '#fff', border: 'none', background: 'none' }}>
            <Home size={20} />
          </button>
          <button className="btn-press" style={{ padding: '8px 12px', border: 'none', background: 'none' }}>
            <Crown size={20} className="ps-crown-icon" />
          </button>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', padding: '0 12px 0 4px', opacity: 0.8 }}>
            {deviceLabel}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="floating-pill" style={{ pointerEvents: 'auto', gap: 2 }}>
          <button onClick={undo} disabled={!canUndo} className="btn-press" style={{ padding: '8px 12px', border: 'none', background: 'none', color: canUndo ? '#fff' : '#444' }}>
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={!canRedo} className="btn-press" style={{ padding: '8px 12px', border: 'none', background: 'none', color: canRedo ? '#fff' : '#444' }}>
            <Redo2 size={18} />
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          <button onClick={() => updateState({ showGrid: !state.showGrid })} className="btn-press" style={{ padding: '8px 12px', border: 'none', background: 'none', color: state.showGrid ? 'var(--ps-accent-blue)' : '#fff' }}>
            <Grid3X3 size={18} />
          </button>
          <button className="btn-press" style={{ padding: '8px 12px', color: '#fff', border: 'none', background: 'none' }}>
            <Download size={18} />
          </button>
          <button className="btn-press" style={{ padding: '8px 12px', color: '#fff', border: 'none', background: 'none' }}>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* ── FLOATING AUXILIARY BUTTONS ────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 160, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <button className="ps-floating-circle btn-press" onClick={() => setActiveTab('template')}>
          <Plus size={24} />
        </button>
        <button className="ps-floating-layer btn-press" onClick={() => setMobileTab(mobileTab === 'export' ? null : 'export')}>
          {state.screenshotUrl ? <img src={state.screenshotUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Layers size={20} />}
        </button>
      </div>

      {/* ── FLOATING CONTENT SHEET ────────────────────────────────── */}
      <AnimatePresence>
        {mobileTab !== null && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            style={{
              position: 'absolute', bottom: 140, left: 20, right: 20, zIndex: 90,
              background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(20px)',
              borderRadius: 24, padding: 20, border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '60vh', overflowY: 'auto', boxShadow: '0 -20px 40px rgba(0,0,0,0.5)'
            }}
          >
            {mobileTab === 'export' ? (
              <RightPanel canvasRef={canvasRef} viewerRef={viewerRef} textOverlays={state.texts} onUpdateText={updateText} onRemoveText={removeText} />
            ) : (
              <LeftPanel mobile mobileContentOnly={mobileTab as any} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAVIGATION & ACTION BAR ────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 110 }}>
        {/* Category Icons Row */}
        <nav className="ps-bottom-nav">
          <button onClick={() => { setActiveTab('presets'); setMobileTab('presets'); }} className={`ps-nav-item ${activeTab === 'presets' ? 'active' : ''}`}>
            <Sparkles size={22} strokeWidth={activeTab === 'presets' ? 2.5 : 1.8} />
            <span>Preajustes</span>
          </button>
          <button onClick={() => { setActiveTab('device'); setMobileTab('device'); }} className={`ps-nav-item ${activeTab === 'device' ? 'active' : ''}`}>
            <Smartphone size={22} strokeWidth={activeTab === 'device' ? 2.5 : 1.8} />
            <span>Dispositivo</span>
          </button>
          <button onClick={() => { setActiveTab('background'); setMobileTab('background'); }} className={`ps-nav-item ${activeTab === 'background' ? 'active' : ''}`}>
            <ImageIcon size={22} strokeWidth={activeTab === 'background' ? 2.5 : 1.8} />
            <span>Fondo</span>
          </button>
          <button onClick={() => { setActiveTab('overlay'); setMobileTab('overlay'); }} className={`ps-nav-item ${activeTab === 'overlay' ? 'active' : ''}`}>
            <LayoutGrid size={22} strokeWidth={activeTab === 'overlay' ? 2.5 : 1.8} />
            <span>Efectos</span>
          </button>
          <button onClick={() => { setActiveTab('labels'); setMobileTab('labels'); }} className={`ps-nav-item ${activeTab === 'labels' ? 'active' : ''}`}>
            <Tags size={22} strokeWidth={activeTab === 'labels' ? 2.5 : 1.8} />
            <span>Etiquetas</span>
          </button>
          <button onClick={() => { setActiveTab('annotate'); setMobileTab('annotate'); }} className={`ps-nav-item ${activeTab === 'annotate' ? 'active' : ''}`}>
            <Pencil size={22} strokeWidth={activeTab === 'annotate' ? 2.5 : 1.8} />
            <span>Anotar</span>
          </button>
          <button onClick={() => { setActiveTab('canvas'); setMobileTab('canvas'); }} className={`ps-nav-item ${activeTab === 'canvas' ? 'active' : ''}`}>
            <Sliders size={22} strokeWidth={activeTab === 'canvas' ? 2.5 : 1.8} />
            <span>Escena</span>
          </button>
          <button onClick={() => { setActiveTab('template'); setMobileTab('template'); }} className={`ps-nav-item ${activeTab === 'template' ? 'active' : ''}`}>
            <Box size={22} strokeWidth={activeTab === 'template' ? 2.5 : 1.8} />
            <span>Modelos</span>
          </button>
        </nav>

        {/* Main Action Pill Container */}
        <div style={{ 
          background: 'rgba(10,10,10,1)', padding: '0 0 20px', 
          display: 'flex', justifyContent: 'center' 
        }}>
          <div className="ps-action-pill">
            <button className="ps-action-item">
              Asistente de IA
            </button>
            <button 
              className={`ps-action-item ${mobileTab !== null ? 'active' : ''}`}
              onClick={() => {
                if (mobileTab !== null) setMobileTab(null);
                else setMobileTab(activeTab as any);
              }}
            >
              Herramientas
            </button>
          </div>
        </div>
      </div>

      {/* Timeline (only in movie mode) */}
      {state.movieMode && (
        <div style={{ position: 'absolute', bottom: 130, left: 0, right: 0, zIndex: 120 }}>
          <MovieTimeline
            ref={movieTimelineRef} viewerRef={viewerRef} movieTimeRef={movieTimeRef} canvasRef={canvasRef}
            onPlayingChange={setMoviePlaying}
            onClose={() => { updateState({ movieMode: false }); setMoviePlaying(false); }}
          />
        </div>
      )}
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
