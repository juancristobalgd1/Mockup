import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppProvider, useApp } from "./store";
import type { CreationMode } from "./store";
import { Toaster } from "sonner";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Canvas } from "./components/canvas/Canvas";
import { LeftPanel } from "./components/panels/LeftPanel";
import { TAB_ICONS } from "./components/panels/tabs";
import type { Tab } from "./components/panels/tabs";
import { RightPanel } from "./components/panels/RightPanel";
import { MovieTimeline } from "./components/timeline/MovieTimeline";
import type { MovieTimelineHandle } from "./components/timeline/MovieTimeline";
import {
  Undo2,
  Redo2,
  Smartphone,
  Film,
  Download,
  Grid3X3,
  Home,
  Crown,
  Lightbulb,
  MoreHorizontal,
  Plus,
  Layout,
  LayoutGrid,
  Image as ImageIcon,
  Wand2,
  Type,
  Settings2,
  Box,
  Palette,
  Pencil,
  MousePointer2,
  Layers,
  Tags,
  Sliders,
  Blend,
  PenLine,
  Sparkles,
  ChevronLeft,
  ArrowLeft,
  User,
  Pipette,
  Settings,
  Focus,
  ScanLine,
  RotateCw,
  CirclePlay,
  CircleStop,
  CirclePlus,
  CircleMinus,
  MousePointerSquareDashed,
  PlusCircle,
  Sun,
  Lamp,
  Maximize,
  Activity,
  Trash2,
  Eraser,
  LayoutList,
  MoreVertical,
  Shuffle,
} from "lucide-react";
import { GridOverlay } from "./components/ui/GridOverlay";
import { getModelById, DEVICE_MODELS, DEVICE_GROUPS } from "./data/devices";
import { FloatingToolbar } from "./components/ui/FloatingToolbar";
import { PRESENT_POSES } from "./data/panelConstants";
import {
  DeviceThumbnail,
  PoseThumbnail,
} from "./components/ui/DeviceThumbnails";
import type { Device3DViewerHandle } from "./components/devices3d/Device3DViewer";

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
    id: "mockup",
    label: "Imagen",
    icon: <Smartphone size={11} />,
    desc: "Mockup de dispositivo con imagen o video",
  },
  {
    id: "movie",
    label: "Película",
    icon: <Film size={11} />,
    desc: "Exportación de video cinemático animado",
  },
];

function Editor() {
  const {
    state,
    updateState,
    updateText,
    removeText,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Device3DViewerHandle>(null);
  const movieTimeRef = useRef<number>(0);
  const movieTimelineRef = useRef<MovieTimelineHandle>(null);
  const [moviePlaying, setMoviePlaying] = useState(false);
  const [mobileTab, setMobileTab] = useState<Tab | "export" | null>(null);
  const [activeTab, setActiveTab] = useState<string>("template");
  const [backgroundPanelView, setBackgroundPanelView] = useState<'hub' | 'content'>('hub');
  const [devicePanelView, setDevicePanelView] = useState<'hub' | 'content'>('hub');
  const [scenePanelView, setScenePanelView] = useState<'hub' | 'content'>('hub');
  const [labelsPanelView, setLabelsPanelView] = useState<'hub' | 'content'>('hub');
  const [annotatePanelView, setAnnotatePanelView] = useState<'hub' | 'shapes' | 'stickers'>('hub');
  const [annotateProperty, setAnnotateProperty] = useState<'size' | 'opacity' | 'color' | 'hardness' | 'more' | null>(null);
  const [overlayProperty, setOverlayProperty] = useState<'color' | 'opacity' | 'light' | 'more' | null>(null);
  const [backgroundProperty, setBackgroundProperty] = useState<'color' | 'opacity' | 'blur' | 'more' | null>(null);
  const [deviceProperty, setDeviceProperty] = useState<'color' | 'reflection' | 'shadow' | 'more' | null>(null);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [showGlobalMenu, setShowGlobalMenu] = useState(false);

  const currentModel = getModelById(state.deviceModel);
  const deviceLabel = currentModel.label;

  useEffect(() => {
    if (mobileTab === "background") setBackgroundPanelView('hub');
    if (mobileTab === "device") setDevicePanelView('hub');
    if (mobileTab === "canvas") setScenePanelView('hub');
    if (mobileTab === "labels") setLabelsPanelView('hub');
    if (mobileTab === "annotate") setAnnotatePanelView('hub');
  }, [mobileTab]);

  useEffect(() => {
    if (!showGlobalMenu) return;
    const handleClick = () => {
      setShowGlobalMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showGlobalMenu]);

  const TOOLBAR_ACTIONS = [
    {
      title: "Cuadrícula",
      icon: Grid3X3,
      action: () => updateState({ showGrid: !state.showGrid }),
      enabled: true,
      shortcut: "G",
    },
    {
      title: "Deshacer",
      icon: Undo2,
      action: undo,
      enabled: canUndo,
      shortcut: "⌘Z",
    },
    {
      title: "Rehacer",
      icon: Redo2,
      action: redo,
      enabled: canRedo,
      shortcut: "⇧⌘Z",
    },
  ];

  // ── Global keyboard shortcuts: Ctrl+Z (undo) / Ctrl+Shift+Z (redo) / G (grid) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isEditing) return;

      const key = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (key === "z" && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (key === "y") {
          e.preventDefault();
          redo();
        }
      } else {
        if (key === "g") {
          e.preventDefault();
          updateState({ showGrid: !state.showGrid });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, state.showGrid, updateState]);

  // ── Warn before unload when there are unsaved changes ──
  useEffect(() => {
    const hasContent =
      state.screenshotUrl ||
      state.videoUrl ||
      state.texts.length > 0 ||
      state.annotateStrokes.length > 0;
    if (!hasContent) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [
    state.screenshotUrl,
    state.videoUrl,
    state.texts.length,
    state.annotateStrokes.length,
  ]);

  const handleViewToggle = (showVideoEditor: boolean) => {
    setMobileTab(null);
    updateState({ movieMode: showVideoEditor });
    if (!showVideoEditor) setMoviePlaying(false);
  };

  return (
    <div
      className="app-root"
      style={{ background: "var(--ps-canvas)", position: "relative" }}
    >
      {/* Skip link for keyboard users */}
      <a href="#main-canvas" className="skip-link">
        Skip to canvas
      </a>

      {/* ── MAIN VIEWPORT (Canvas) ─────────────────────────────────── */}
      <main
        id="main-canvas"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px 140px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
          }}
          className="canvas-bg"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.creationMode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", height: "100%" }}
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
      <header
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {/* Left: Home & Crown */}
        <div className="floating-pill" style={{ pointerEvents: "auto" }}>
          <button
            className="btn-press"
            style={{
              padding: "8px 12px",
              color: "#fff",
              border: "none",
              background: "none",
            }}
          >
            <Home size={20} />
          </button>
          <button
            className="btn-press"
            style={{ padding: "8px 12px", border: "none", background: "none" }}
          >
            <Crown size={20} className="ps-crown-icon" />
          </button>
        </div>

        {/* Right: Actions */}
        <div
          className="floating-pill"
          style={{ pointerEvents: "auto", gap: 2 }}
        >
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn-press"
            style={{
              padding: "8px 12px",
              border: "none",
              background: "none",
              color: canUndo ? "#fff" : "#444",
            }}
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="btn-press"
            style={{
              padding: "8px 12px",
              border: "none",
              background: "none",
              color: canRedo ? "#fff" : "#444",
            }}
          >
            <Redo2 size={18} />
          </button>
          <div
            style={{
              width: 1,
              height: 20,
              background: "rgba(255,255,255,0.1)",
              margin: "0 4px",
            }}
          />
          <button
            onClick={() => updateState({ showGrid: !state.showGrid })}
            className="btn-press"
            style={{
              padding: "8px 12px",
              border: "none",
              background: "none",
              color: state.showGrid ? "var(--ps-accent-blue)" : "#fff",
            }}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            aria-label="Abrir opciones de descarga"
            title="Descargar"
            onClick={() => setMobileTab(mobileTab === "export" ? null : "export")}
            className="btn-press"
            style={{
              padding: "8px 12px",
              color: "#fff",
              border: "none",
              background: "none",
            }}
          >
            <Download size={18} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="btn-press"
              onClick={() => setShowGlobalMenu(!showGlobalMenu)}
              style={{
                padding: "8px 12px",
                color: showGlobalMenu ? "var(--ps-accent-blue)" : "#fff",
                border: "none",
                background: "none",
              }}
            >
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {showGlobalMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(10px)' }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 10,
                    background: 'rgba(28,28,30,0.95)',
                    backdropFilter: 'blur(25px)',
                    borderRadius: 16,
                    padding: 6,
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
                    zIndex: 2000,
                    minWidth: 180
                  }}
                >
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>Annotate</label>
                  <button
                    onClick={() => {
                      updateState({ annotateStrokes: [], annotateClearKey: (state.annotateClearKey ?? 0) + 1 });
                      setShowGlobalMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'none',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s'
                    }}
                    className="btn-hover-bg"
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} style={{ color: '#f87171' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Limpiar Lienzo</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── UNIFIED COMMAND BAR ────────────────────────────── */}
      <FloatingToolbar
        onAddElement={() => {
          setActiveTab("template");
          setMobileTab("template");
        }}
        onToggleExport={() =>
          setMobileTab(mobileTab === "export" ? null : "export")
        }
        isExportOpen={mobileTab === "export"}
        isMobile={window.innerWidth < 768}
      />

      {/* ── FLOATING CONTENT SHEET (Export) ─────────────────────────── */}
      <AnimatePresence>
        {mobileTab === "export" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            style={{
              position: "absolute",
              bottom: 140,
              left: 20,
              right: 20,
              zIndex: 90,
              background: "rgba(26,26,26,0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 24,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "60vh",
              overflowY: "auto",
              boxShadow: "0 -20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <RightPanel
              canvasRef={canvasRef}
              viewerRef={viewerRef}
              textOverlays={state.texts}
              onUpdateText={updateText}
              onRemoveText={removeText}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAVIGATION & ACTION BAR ────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 160,
        }}
      >
        <AnimatePresence mode="wait">
          {!state.movieMode && mobileTab === null ? (
            <motion.div
              key="main-nav"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <nav className="ps-bottom-nav">
                <button
                  onClick={() => {
                    setActiveTab("template");
                    setMobileTab("template");
                  }}
                  className={`ps-nav-item ${activeTab === "template" ? "active" : ""}`}
                >
                  <Layout
                    size={22}
                    strokeWidth={activeTab === "template" ? 2.5 : 1.8}
                  />
                  <span>Plantillas</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("device");
                    setMobileTab("device");
                  }}
                  className={`ps-nav-item ${activeTab === "device" ? "active" : ""}`}
                >
                  <Smartphone
                    size={22}
                    strokeWidth={activeTab === "device" ? 2.5 : 1.8}
                  />
                  <span>Dispositivo</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("background");
                    setMobileTab("background");
                  }}
                  className={`ps-nav-item ${activeTab === "background" ? "active" : ""}`}
                >
                  <ImageIcon
                    size={22}
                    strokeWidth={activeTab === "background" ? 2.5 : 1.8}
                  />
                  <span>Fondo</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("overlay");
                    setMobileTab("overlay");
                  }}
                  className={`ps-nav-item ${activeTab === "overlay" ? "active" : ""}`}
                >
                  <Layers
                    size={22}
                    strokeWidth={activeTab === "overlay" ? 2.5 : 1.8}
                  />
                  <span>Overlay</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("labels");
                    setMobileTab("labels");
                  }}
                  className={`ps-nav-item ${activeTab === "labels" ? "active" : ""}`}
                >
                  <Tags
                    size={22}
                    strokeWidth={activeTab === "labels" ? 2.5 : 1.8}
                  />
                  <span>Etiquetas</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("canvas");
                    setMobileTab("canvas");
                  }}
                  className={`ps-nav-item ${activeTab === "canvas" ? "active" : ""}`}
                >
                  <Sliders
                    size={22}
                    strokeWidth={activeTab === "canvas" ? 2.5 : 1.8}
                  />
                  <span>Escena</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("annotate");
                    setMobileTab("annotate");
                  }}
                  className={`ps-nav-item ${activeTab === "annotate" ? "active" : ""}`}
                >
                  <PenLine
                    size={22}
                    strokeWidth={activeTab === "annotate" ? 2.5 : 1.8}
                  />
                  <span>ANNOTATE</span>
                </button>
              </nav>

              <div
                style={{
                  background: "rgba(10,10,10,1)",
                  padding: "0 0 20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  className="ps-action-pill"
                  style={{ position: "relative", minWidth: 200 }}
                >
                  <button
                    className={`ps-action-item ${!state.movieMode ? "active" : ""}`}
                    onClick={() => handleViewToggle(false)}
                    aria-label="Herramientas"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {!state.movieMode && (
                      <motion.div
                        layoutId="active-action-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "#3a3a3a",
                          borderRadius: 26,
                          zIndex: -1,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <Sliders size={16} />
                  </button>
                  <button
                    className={`ps-action-item ${state.movieMode ? "active" : ""}`}
                    onClick={() => handleViewToggle(true)}
                    aria-label="Timeline"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {state.movieMode && (
                      <motion.div
                        layoutId="active-action-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "#3a3a3a",
                          borderRadius: 26,
                          zIndex: -1,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <Film size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : mobileTab === null && state.movieMode ? (
            <motion.div
              key="video-editor"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div
                style={{
                  background: "var(--ps-panel)",
                  padding: "0 0 12px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  className="ps-action-pill"
                  style={{ position: "relative", minWidth: 200 }}
                >
                  <button
                    className={`ps-action-item ${!state.movieMode ? "active" : ""}`}
                    onClick={() => handleViewToggle(false)}
                    aria-label="Herramientas"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {!state.movieMode && (
                      <motion.div
                        layoutId="active-action-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "#3a3a3a",
                          borderRadius: 26,
                          zIndex: -1,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <Sliders size={16} />
                  </button>
                  <button
                    className={`ps-action-item ${state.movieMode ? "active" : ""}`}
                    onClick={() => handleViewToggle(true)}
                    aria-label="Timeline"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {state.movieMode && (
                      <motion.div
                        layoutId="active-action-pill"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "#3a3a3a",
                          borderRadius: 26,
                          zIndex: -1,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    <Film size={16} />
                  </button>
                </div>
              </div>
              <MovieTimeline
                ref={movieTimelineRef}
                viewerRef={viewerRef}
                movieTimeRef={movieTimeRef}
                canvasRef={canvasRef}
                onPlayingChange={setMoviePlaying}
                onClose={() => {
                  updateState({ movieMode: false });
                  setMoviePlaying(false);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="context-nav"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="ps-tiered-nav"
            >
              {/* Floating Action Circles (Above tiers) */}
                <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  position: "absolute",
                  top: -64,
                  left: 0,
                  right: 0,
                  pointerEvents: "none",
                }}
              >
                {mobileTab === "annotate" && (
                  <>
                    {/* Tooltips Layer */}
                    <AnimatePresence>
                      {annotateProperty && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            bottom: 60,
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "auto"
                          }}
                        >
                          <div style={{
                            background: "rgba(30,30,32,0.95)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 20,
                            padding: "16px 20px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                            minWidth: 260,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {annotateProperty === 'size' ? 'Grosor' : annotateProperty === 'opacity' ? 'Opacidad' : annotateProperty === 'more' ? 'Ajustes' : 'Color'}
                              </span>
                              <button onClick={() => setAnnotateProperty(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: 0, cursor: 'pointer' }}>×</button>
                            </div>

                            {annotateProperty === 'color' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {['#ffffff', '#aaaaaa', '#333333', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateState({ annotateColor: c })}
                                    style={{
                                      width: 38, height: 38, borderRadius: '50%', background: c, border: state.annotateColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                                    }}
                                  />
                                ))}
                              </div>
                            ) : annotateProperty === 'more' ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => {
                                    updateState({ annotateStrokes: [], annotateClearKey: (state.annotateClearKey ?? 0) + 1 });
                                    setAnnotateProperty(null);
                                  }}
                                  style={{
                                    flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                                  }}
                                  className="btn-press"
                                >
                                  <Trash2 size={16} style={{ color: '#f87171' }} /> Limpiar Lienzo
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                  type="range"
                                  min={annotateProperty === 'size' ? 1 : 5}
                                  max={annotateProperty === 'size' ? 100 : 100}
                                  step={1}
                                  value={annotateProperty === 'size' ? (state.annotateLineWidth ?? 5) : Math.round((state.annotateOpacity ?? 1) * 100)}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (annotateProperty === 'size') updateState({ annotateLineWidth: val });
                                    else updateState({ annotateOpacity: val / 100 });
                                  }}
                                  style={{ flex: 1, accentColor: '#3498db', height: 4 }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}>
                                  {annotateProperty === 'size' ? `${state.annotateLineWidth ?? 5}px` : `${Math.round((state.annotateOpacity ?? 1) * 100)}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Color Button (Left) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setAnnotateProperty(annotateProperty === 'color' ? null : 'color')}
                      style={{
                        pointerEvents: "auto",
                        background: annotateProperty === 'color' ? "#fff" : "#1c1c1e",
                        color: annotateProperty === 'color' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 8,
                          borderRadius: 4,
                          backgroundImage:
                            "linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)",
                          backgroundSize: "8px 8px",
                          backgroundColor: "#222",
                          opacity: 0.4
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: state.annotateColor, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                      </div>
                    </button>

                    {/* Property Pill (Center) */}
                    <div
                      style={{
                        pointerEvents: "auto",
                        display: "flex",
                        background: "#1c1c1e",
                        borderRadius: 30,
                        padding: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <button
                        className="btn-press"
                        onClick={() => setAnnotateProperty(annotateProperty === 'size' ? null : 'size')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: annotateProperty === 'size' ? "#f5f5f7" : "transparent",
                          color: annotateProperty === 'size' ? "#000" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      </button>
                      <button
                        className="btn-press"
                        onClick={() => setAnnotateProperty(annotateProperty === 'opacity' ? null : 'opacity')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: annotateProperty === 'opacity' ? "#f5f5f7" : "transparent",
                          color: annotateProperty === 'opacity' ? "#000" : "rgba(255,255,255,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                    </div>
 
                    {/* Annotate More Options (Right) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setAnnotateProperty(annotateProperty === 'more' ? null : 'more')}
                      style={{
                        pointerEvents: "auto",
                        background: annotateProperty === 'more' ? "#fff" : "#1c1c1e",
                        color: annotateProperty === 'more' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </>
                )}

                {mobileTab === "overlay" && (
                  <>
                    {/* Tooltips Layer */}
                    <AnimatePresence>
                      {overlayProperty && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            bottom: 60,
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "auto"
                          }}
                        >
                          <div style={{
                            background: "rgba(30,30,32,0.95)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 20,
                            padding: "16px 20px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                            minWidth: 260,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {overlayProperty === 'color' ? 'Color Sólido' : overlayProperty === 'opacity' ? 'Opacidad Sólido' : overlayProperty === 'light' ? 'Opacidad Luz' : 'Mezcla'}
                              </span>
                              <button onClick={() => setOverlayProperty(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: 0, cursor: 'pointer' }}>×</button>
                            </div>

                            {overlayProperty === 'color' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                {['#ffffff', '#aaaaaa', '#333333', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateState({ overlayColor: c, overlayEnabled: true })}
                                    style={{
                                      width: 38, height: 38, borderRadius: '50%', background: c, border: state.overlayColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                                    }}
                                  />
                                ))}
                              </div>
                            ) : overlayProperty === 'more' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {(['multiply', 'screen', 'overlay', 'soft-light'] as const).map(mode => (
                                    <button
                                      key={mode}
                                      onClick={() => updateState({ lightOverlayBlend: mode })}
                                      style={{
                                        padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700,
                                        background: state.lightOverlayBlend === mode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                        color: state.lightOverlayBlend === mode ? '#000' : '#fff'
                                      }}
                                    >
                                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                  ))}
                                </div>
                                <div style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: state.lightOverlayBgOnly ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                                      Solo al fondo
                                    </div>
                                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                                      El efecto no cubre el dispositivo
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => updateState({ lightOverlayBgOnly: !state.lightOverlayBgOnly })}
                                    style={{
                                      width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                                      background: state.lightOverlayBgOnly ? '#3498db' : 'rgba(255,255,255,0.12)',
                                      position: 'relative', transition: 'all 0.18s', flexShrink: 0,
                                    }}>
                                    <div style={{
                                      position: 'absolute', top: 3, left: state.lightOverlayBgOnly ? 19 : 3, width: 16, height: 16,
                                      borderRadius: '50%', background: '#fff', transition: 'left 0.18s',
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                    }} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={overlayProperty === 'opacity' ? state.overlayOpacity : state.lightOverlayOpacity}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (overlayProperty === 'opacity') updateState({ overlayOpacity: val, overlayEnabled: true });
                                    else updateState({ lightOverlayOpacity: val });
                                  }}
                                  style={{ flex: 1, accentColor: '#3498db', height: 4 }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}>
                                  {overlayProperty === 'opacity' ? `${state.overlayOpacity}%` : `${state.lightOverlayOpacity}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Overlay Color Button (Left) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setOverlayProperty(overlayProperty === 'color' ? null : 'color')}
                      style={{
                        pointerEvents: "auto",
                        background: overlayProperty === 'color' ? "#fff" : "#1c1c1e",
                        color: overlayProperty === 'color' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: state.overlayColor, border: '2px solid rgba(255,255,255,0.8)', opacity: state.overlayEnabled ? 1 : 0.4 }} />
                      </div>
                    </button>

                    {/* Property Pill (Center) */}
                    <div
                      style={{
                        pointerEvents: "auto",
                        display: "flex",
                        background: "#1c1c1e",
                        borderRadius: 30,
                        padding: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <button
                        className="btn-press"
                        onClick={() => setOverlayProperty(overlayProperty === 'opacity' ? null : 'opacity')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: overlayProperty === 'opacity' ? "#f5f5f7" : "transparent",
                          color: overlayProperty === 'opacity' ? "#000" : (state.overlayEnabled ? "#fff" : "rgba(255,255,255,0.4)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                      <button
                        className="btn-press"
                        onClick={() => setOverlayProperty(overlayProperty === 'light' ? null : 'light')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: overlayProperty === 'light' ? "#f5f5f7" : "transparent",
                          color: overlayProperty === 'light' ? "#000" : (state.lightOverlay ? "#fff" : "rgba(255,255,255,0.4)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      </button>
                    </div>

                    {/* More Options (Right) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setOverlayProperty(overlayProperty === 'more' ? null : 'more')}
                      style={{
                        pointerEvents: "auto",
                        background: overlayProperty === 'more' ? "#fff" : "#1c1c1e",
                        color: overlayProperty === 'more' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </>
                )}

                {mobileTab === "background" && (
                  <>
                    {/* Tooltips Layer */}
                    <AnimatePresence>
                      {backgroundProperty && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            bottom: 60,
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "auto"
                          }}
                        >
                          <div style={{
                            background: "rgba(30,30,32,0.95)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 20,
                            padding: "16px 20px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                            minWidth: 260,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {backgroundProperty === 'opacity' ? 'Opacidad' : backgroundProperty === 'blur' ? 'Desenfoque' : 'Efectos'}
                              </span>
                              <button onClick={() => setBackgroundProperty(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: 0, cursor: 'pointer' }}>×</button>
                            </div>

                            {backgroundProperty === 'more' ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <button onClick={() => updateState({ grain: !state.grain })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.grain ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.grain ? '#000' : '#fff'
                                  }}>Ruido</button>
                                <button onClick={() => updateState({ bgVignette: !state.bgVignette })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.bgVignette ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.bgVignette ? '#000' : '#fff'
                                  }}>Viñeta</button>
                                <button onClick={() => updateState({ grainBgOnly: !state.grainBgOnly })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.grainBgOnly ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.grainBgOnly ? '#000' : '#fff'
                                  }}>Solo Fondo (Ruido)</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                  type="range"
                                  min={0}
                                  max={backgroundProperty === 'opacity' ? 100 : 20}
                                  step={backgroundProperty === 'opacity' ? 1 : 1}
                                  value={backgroundProperty === 'opacity' ? state.bgOpacity : state.bgBlur}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (backgroundProperty === 'opacity') updateState({ bgOpacity: val });
                                    else updateState({ bgBlur: val });
                                  }}
                                  style={{ flex: 1, accentColor: '#3498db', height: 4 }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}>
                                  {backgroundProperty === 'opacity' ? `${state.bgOpacity}%` : `${state.bgBlur}px`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* BG Shuffle Button (Left) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => {
                        const pool = [
                          { bgType: 'solid', bgColor: '#ffffff' },
                          { bgType: 'solid', bgColor: '#1c1c1e' },
                          { bgType: 'solid', bgColor: '#ef4444' },
                          { bgType: 'gradient', bgColor: 'sky' },
                          { bgType: 'gradient', bgColor: 'fire' },
                          { bgType: 'mesh', bgColor: 'aurora' },
                          { bgType: 'mesh', bgColor: 'ocean' },
                          { bgType: 'wallpaper', bgColor: 'nature-1' },
                        ];
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        updateState(pick as any);
                      }}
                      style={{
                        pointerEvents: "auto",
                        background: "#1c1c1e",
                        color: "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Shuffle size={20} />
                    </button>

                    {/* Property Pill (Center) */}
                    <div
                      style={{
                        pointerEvents: "auto",
                        display: "flex",
                        background: "#1c1c1e",
                        borderRadius: 30,
                        padding: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <button
                        className="btn-press"
                        onClick={() => setBackgroundProperty(backgroundProperty === 'opacity' ? null : 'opacity')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: backgroundProperty === 'opacity' ? "#f5f5f7" : "transparent",
                          color: backgroundProperty === 'opacity' ? "#000" : "rgba(255,255,255,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                      <button
                        className="btn-press"
                        onClick={() => setBackgroundProperty(backgroundProperty === 'blur' ? null : 'blur')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: backgroundProperty === 'blur' ? "#f5f5f7" : "transparent",
                          color: backgroundProperty === 'blur' ? "#000" : (state.bgBlur > 0 ? "#fff" : "rgba(255,255,255,0.4)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      </button>
                    </div>

                    {/* More Options (Right) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setBackgroundProperty(backgroundProperty === 'more' ? null : 'more')}
                      style={{
                        pointerEvents: "auto",
                        background: backgroundProperty === 'more' ? "#fff" : "#1c1c1e",
                        color: backgroundProperty === 'more' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </>
                )}
                {mobileTab === "device" && (
                  <>
                    {/* Tooltips Layer */}
                    <AnimatePresence>
                      {deviceProperty && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            bottom: 60,
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "auto"
                          }}
                        >
                          <div style={{
                            background: "rgba(30,30,32,0.95)",
                            backdropFilter: "blur(20px)",
                            borderRadius: 20,
                            padding: "16px 20px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                            minWidth: 260,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {deviceProperty === 'color' ? 'Material / Color' : deviceProperty === 'reflection' ? 'Reflexión' : deviceProperty === 'shadow' ? 'Sombra' : 'Ajustes'}
                              </span>
                              <button onClick={() => setDeviceProperty(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, padding: 0, cursor: 'pointer' }}>×</button>
                            </div>

                            {deviceProperty === 'color' ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                <button
                                  onClick={() => {
                                    updateState({ clayMode: false, deviceColor: 'original' });
                                  }}
                                  style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    background: 'conic-gradient(from 0deg, #ff4d4d, #f9cb28, #7cfc00, #00ffff, #4d4dff, #ff00ff, #ff4d4d)',
                                    border: state.deviceColor === 'original' && !state.clayMode ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  title="Original"
                                >
                                  <Smartphone size={14} color="#fff" />
                                </button>
                                {['titanium', 'spaceblack', 'silver', 'gold', 'blue'].map(c => (
                                  <button
                                    key={c}
                                    onClick={() => updateState({ deviceColor: c, clayMode: state.clayMode })}
                                    style={{
                                      width: 38, height: 38, borderRadius: '50%', background: c === 'titanium' ? '#a7a7a1' : c === 'spaceblack' ? '#2e2e2e' : c === 'silver' ? '#e3e3e3' : c === 'gold' ? '#f5e1c4' : '#4b5e7a',
                                      border: state.deviceColor === c && state.clayMode ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer'
                                    }}
                                  />
                                ))}
                              </div>
                            ) : deviceProperty === 'more' ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <button onClick={() => updateState({ clayMode: !state.clayMode })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.clayMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.clayMode ? '#000' : '#fff'
                                  }}>Modo Clay</button>
                                <button onClick={() => updateState({ deviceLandscape: !state.deviceLandscape })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.deviceLandscape ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.deviceLandscape ? '#000' : '#fff'
                                  }}>Horizontal</button>
                                <button onClick={() => updateState({ reflection: !state.reflection })}
                                  style={{
                                    padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                    background: state.reflection ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
                                    color: state.reflection ? '#000' : '#fff'
                                  }}>Reflexión</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={deviceProperty === 'reflection' ? state.reflectionOpacity * 100 : state.contactShadowOpacity * 100}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) / 100;
                                    if (deviceProperty === 'reflection') updateState({ reflectionOpacity: val, reflection: true });
                                    else updateState({ contactShadowOpacity: val });
                                  }}
                                  style={{ flex: 1, accentColor: '#3498db', height: 4 }}
                                />
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}>
                                  {deviceProperty === 'reflection' ? `${Math.round(state.reflectionOpacity * 100)}%` : `${Math.round(state.contactShadowOpacity * 100)}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Device Material Button (Left) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setDeviceProperty(deviceProperty === 'color' ? null : 'color')}
                      style={{
                        pointerEvents: "auto",
                        background: deviceProperty === 'color' ? "#fff" : "#1c1c1e",
                        color: deviceProperty === 'color' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                        position: "relative",
                        overflow: "hidden",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Palette size={20} />
                    </button>

                    {/* Property Pill (Center) */}
                    <div
                      style={{
                        pointerEvents: "auto",
                        display: "flex",
                        background: "#1c1c1e",
                        borderRadius: 30,
                        padding: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <button
                        className="btn-press"
                        onClick={() => setDeviceProperty(deviceProperty === 'reflection' ? null : 'reflection')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: deviceProperty === 'reflection' ? "#f5f5f7" : "transparent",
                          color: deviceProperty === 'reflection' ? "#000" : (state.reflection ? "#fff" : "rgba(255,255,255,0.4)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                      <button
                        className="btn-press"
                        onClick={() => setDeviceProperty(deviceProperty === 'shadow' ? null : 'shadow')}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: deviceProperty === 'shadow' ? "#f5f5f7" : "transparent",
                          color: deviceProperty === 'shadow' ? "#000" : (state.contactShadowOpacity > 0 ? "#fff" : "rgba(255,255,255,0.4)"),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      </button>
                    </div>

                    {/* More Options (Right) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      onClick={() => setDeviceProperty(deviceProperty === 'more' ? null : 'more')}
                      style={{
                        pointerEvents: "auto",
                        background: deviceProperty === 'more' ? "#fff" : "#1c1c1e",
                        color: deviceProperty === 'more' ? "#000" : "#fff",
                        border: "none",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* Tier 1: Contextual Tools (icons with labels) */}
              {((mobileTab === 'presets') ||
                (mobileTab === 'device' && devicePanelView === 'hub') ||
                (mobileTab === 'annotate') ||
                (mobileTab === 'background' && backgroundPanelView === 'hub') ||
                (mobileTab === 'canvas' && scenePanelView === 'hub') ||
                (mobileTab === 'labels' && labelsPanelView === 'hub')) && (
                <div
                  className="ps-tier-tools"
                  style={{ padding: "20px 20px 10px" }}
                >
                {mobileTab === "presets" &&
                  PRESENT_POSES.map((pose) => {
                    const active = state.cameraAngle === pose.id;
                    return (
                      <div key={pose.id} className="ps-tool-thumb-box">
                        <button
                          className={`ps-tool-thumb btn-press ${active ? "active" : ""}`}
                          onClick={() =>
                            updateState({
                              cameraAngle: pose.id,
                              cameraResetKey: (state.cameraResetKey ?? 0) + 1,
                            })
                          }
                        >
                          <PoseThumbnail
                            ry={pose.ry}
                            rx={pose.rx}
                            rz={pose.rz}
                            active={active}
                            mini
                          />
                        </button>
                        <span className="ps-tool-label">{pose.label}</span>
                      </div>
                    );
                  })}

                {mobileTab === "device" && devicePanelView === 'hub' && (
                  <>
                    {DEVICE_GROUPS.map((group) => {
                      const repModel = DEVICE_MODELS.find(
                        (m) => m.group === group,
                      );
                      const isActive =
                        getModelById(state.deviceModel)?.group === group &&
                        state.deviceSubTab === "models";
                      return (
                        <div key={group} className="ps-tool-thumb-box">
                          <button
                            className="ps-tool-thumb btn-press"
                            onClick={() => {
                              if (repModel) {
                                updateState({
                                  deviceModel: repModel.id,
                                  deviceType: repModel.storeType,
                                  deviceColor: repModel.useOriginalMaterials
                                    ? "original"
                                    : "titanium",
                                  deviceSubTab: "models",
                                });
                                setDevicePanelView('content');
                              }
                            }}
                          >
                            <div style={{ transform: "scale(1.3)" }}>
                              <DeviceThumbnail
                                modelId={repModel?.id || ""}
                                isSelected={false}
                              />
                            </div>
                          </button>
                          <span className="ps-tool-label">{group}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {mobileTab === "annotate" && annotatePanelView === 'hub' &&
                  [
                    {
                      id: "select",
                      label: "Seleccionar",
                      icon: <MousePointer2 size={24} />,
                      action: () => updateState({ annotateTool: 'select', annotateMode: true }),
                    },
                    {
                      id: "pen",
                      label: "Pincel",
                      icon: <Pencil size={24} />,
                      action: () => updateState({ annotateTool: 'pen', annotateMode: true }),
                    },
                    {
                      id: "shapes",
                      label: "Formas",
                      icon: <Box size={24} />,
                      action: () => setAnnotatePanelView('shapes'),
                    },
                    {
                      id: "text",
                      label: "Texto",
                      icon: <Type size={24} />,
                      action: () => updateState({ annotateTool: 'text', annotateMode: true }),
                    },
                    {
                      id: "eraser",
                      label: "Borrador",
                      icon: <Eraser size={24} />,
                      action: () => updateState({ annotateTool: 'eraser', annotateMode: true }),
                    },
                    {
                      id: "stickers",
                      label: "Stickers",
                      icon: <Sparkles size={24} />,
                      action: () => setAnnotatePanelView('stickers'),
                    },
                  ].map((tool) => {
                    const isActive = state.annotateTool === tool.id || (tool.id === 'shapes' && (state.annotateTool as any) && ['rect', 'arrow', 'circle'].includes(state.annotateTool as any));
                    return (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className={`ps-tool-thumb btn-press ${isActive ? "active" : ""}`}
                          onClick={tool.action}
                          style={{
                            padding: 0,
                            width: 60,
                            height: 60,
                            borderRadius: 12,
                            background: "#1c1c1e",
                            border: isActive ? "2px solid #3498db" : "1px solid rgba(255,255,255,0.1)",
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? '#3498db' : '#fff'
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{tool.label}</span>
                      </div>
                    );
                  })}

                {mobileTab === "annotate" && annotatePanelView === 'shapes' && (
                  <>
                    <div className="ps-tool-thumb-box" style={{ paddingRight: 12, marginRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        className="ps-tool-thumb btn-press"
                        onClick={() => setAnnotatePanelView('hub')}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.05)",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}
                      >
                        <ArrowLeft size={24} />
                      </button>
                      <span className="ps-tool-label">Volver</span>
                    </div>
                    {[
                      { id: 'arrow', label: 'Flecha', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg> },
                      { id: 'rect', label: 'Rect', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
                      { id: 'circle', label: 'Círculo', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg> },
                      { id: 'ellipse', label: 'Elipse', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg> },
                      { id: 'triangle', label: 'Triáng.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,22 2,22"/></svg> },
                      { id: 'diamond', label: 'Rombo', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 23,12 12,23 1,12"/></svg> },
                      { id: 'star', label: 'Estrella', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 15.09,8.26 23,9.27 17.5,14.63 18.18,22.54 12,19.27 5.82,22.54 6.5,14.63 1,9.27 8.91,8.26"/></svg> },
                      { id: 'hexagon', label: 'Hexág.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 21.66,6.5 21.66,17.5 12,23 2.34,17.5 2.34,6.5"/></svg> },
                      { id: 'spiral', label: 'Espiral', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12 C12 12, 18 10, 18 6 C18 2, 12 1, 8 3 C3 5, 2 11, 5 15 C8 19, 15 20, 19 17 C23 14, 22 7, 19 4"/></svg> },
                      { id: 'wave', label: 'Ondulada', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 Q5 6, 8 12 Q11 18, 14 12 Q17 6, 20 12 Q21.5 15, 22 12"/></svg> },
                    ].map((sh) => {
                      const isActive = state.annotateTool === sh.id || (state.annotateTool === 'rect' && state.annotateShape === sh.id);
                      return (
                        <div key={sh.id} className="ps-tool-thumb-box">
                          <button
                            className={`ps-tool-thumb btn-press ${isActive ? "active" : ""}`}
                            onClick={() => updateState({ annotateTool: sh.id === 'arrow' ? 'arrow' : 'rect', annotateShape: sh.id as any, annotateMode: true })}
                            style={{
                              padding: 0,
                              width: 60,
                              height: 60,
                              borderRadius: 12,
                              background: "#1c1c1e",
                              border: isActive ? "2px solid #3498db" : "1px solid rgba(255,255,255,0.1)",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isActive ? '#3498db' : '#fff'
                            }}
                          >
                            {sh.icon}
                          </button>
                          <span className="ps-tool-label" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{sh.label}</span>
                        </div>
                      );
                    })}
                  </>
                )}
 
                {mobileTab === "annotate" && annotatePanelView === 'stickers' && (
                  <>
                    <div className="ps-tool-thumb-box" style={{ paddingRight: 12, marginRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      <button
                        className="ps-tool-thumb btn-press"
                        onClick={() => setAnnotatePanelView('hub')}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.05)",
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}
                      >
                        <ArrowLeft size={24} />
                      </button>
                      <span className="ps-tool-label">Volver</span>
                    </div>
                    {[
                      { id: 'heart', label: 'Corazón', icon: '❤️' },
                      { id: 'star_s', label: 'Estrella', icon: '⭐' },
                      { id: 'fire', label: 'Fuego', icon: '🔥' },
                      { id: 'rocket', label: 'Cohete', icon: '🚀' },
                      { id: 'crown_s', label: 'Corona', icon: '👑' },
                    ].map((tool) => {
                      return (
                        <div key={tool.id} className="ps-tool-thumb-box">
                          <button
                            className="ps-tool-thumb btn-press"
                            onClick={() => {
                                const newSticker: any = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  kind: 'sticker',
                                  stickerId: tool.id,
                                  icon: tool.icon,
                                  position: { x: 50, y: 50 },
                                  size: 40
                                };
                                updateState({
                                  annotateStrokes: [...state.annotateStrokes, newSticker]
                                });
                                setAnnotatePanelView('hub');
                            }}
                            style={{
                              padding: 0,
                              width: 60,
                              height: 60,
                              borderRadius: 12,
                              background: "#1c1c1e",
                              border: "1px solid rgba(255,255,255,0.1)",
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 24
                            }}
                          >
                            {tool.icon}
                          </button>
                          <span className="ps-tool-label">{tool.label}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {mobileTab === "background" && backgroundPanelView === 'hub' && (
                  <>
                    {[
                      {
                        id: "solid",
                        icon: <Palette size={24} />,
                        label: "Sólido",
                      },
                      {
                        id: "gradient",
                        icon: <Blend size={24} />,
                        label: "Degradado",
                      },
                      {
                        id: "image",
                        icon: <ImageIcon size={24} />,
                        label: "Imagen",
                      },
                      {
                        id: "color",
                        icon: <Pipette size={24} />,
                        label: "Gotero",
                      },
                      {
                        id: "transparent",
                        icon: <div style={{ width: 24, height: 24, borderRadius: 4, backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)', backgroundSize: '8px 8px', backgroundColor: '#222' }} />,
                        label: "Transp.",
                      },
                      {
                        id: "mesh",
                        icon: <Sparkles size={24} />,
                        label: "Mesh",
                      },
                      {
                        id: "wallpaper",
                        icon: <LayoutList size={24} />,
                        label: "Walls",
                      },
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className="ps-tool-thumb btn-press"
                          onClick={() => {
                            if (tool.id === 'transparent') {
                              updateState({ bgType: 'transparent', bgColor: 'transparent', bgImage: null, bgVideo: null });
                            } else {
                              updateState({
                                bgType: tool.id as any,
                                showBgSettings: false,
                              });
                            }
                            setBackgroundPanelView('content');
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}

                  </>
                )}

                {mobileTab === "canvas" && scenePanelView === 'hub' && (
                  <>
                    {[
                      {
                        id: "estudio",
                        icon: <Sun size={24} />,
                        label: "Estudio",
                      },
                      { id: "luz", icon: <Lamp size={24} />, label: "Luz" },
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className="ps-tool-thumb btn-press"
                          onClick={() => {
                            updateState({ sceneSubTab: tool.id as any });
                            setScenePanelView('content');
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}

                    <div
                      style={{
                        width: 1,
                        background: "rgba(255,255,255,0.12)",
                        height: 64,
                        margin: "0 4px",
                        borderRadius: 2,
                      }}
                    />

                    {[
                      {
                        id: "camera",
                        icon: <Maximize size={24} />,
                        label: "Cámara",
                      },
                      {
                        id: "motion",
                        icon: <Activity size={24} />,
                        label: "Movimiento",
                      },
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className="ps-tool-thumb btn-press"
                          onClick={() => {
                            updateState({ sceneSubTab: tool.id as any });
                            setScenePanelView('content');
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}

                    <div
                      style={{
                        width: 1,
                        background: "rgba(255,255,255,0.12)",
                        height: 64,
                        margin: "0 4px",
                        borderRadius: 2,
                      }}
                    />

                    {[
                      {
                        id: "effects",
                        icon: <Sparkles size={24} />,
                        label: "Efectos",
                      },
                      {
                        id: "shadow",
                        icon: <Layers size={24} />,
                        label: "Sombras",
                      },
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className="ps-tool-thumb btn-press"
                          onClick={() => {
                            updateState({ sceneSubTab: tool.id as any });
                            setScenePanelView('content');
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}
                  </>
                )}

                {mobileTab === "labels" && labelsPanelView === 'hub' && (
                  <>
                    {[
                      {
                        id: "add",
                        icon: <PlusCircle size={24} />,
                        label: "Anclar",
                        disabled: false,
                      },
                      {
                        id: "view",
                        icon: <MousePointer2 size={24} />,
                        label: "Gestionar",
                        disabled: state.texts.filter(t => t.kind === 'label').length === 0,
                      },
                      {
                        id: "subtract",
                        icon: <Trash2 size={24} />,
                        label: "Limpiar",
                        disabled: state.texts.filter(t => t.kind === 'label').length === 0,
                      },
                    ].map((tool) => (
                      <div 
                        key={tool.id} 
                        className="ps-tool-thumb-box"
                        style={{ opacity: tool.disabled ? 0.35 : 1, pointerEvents: tool.disabled ? 'none' : 'auto' }}
                      >
                        <button
                          className="ps-tool-thumb btn-press"
                          disabled={tool.disabled}
                          onClick={() => {
                            updateState({ labelsSubTab: tool.id as any });
                            setLabelsPanelView('content');
                          }}
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
              )}



              {/* Tier 2.5: Inline Panel Settings (Replaces Float Modal) */}
              {mobileTab !== "annotate" &&
                mobileTab !== "presets" &&
                (mobileTab !== "background" || backgroundPanelView === 'content') &&
                (mobileTab !== "device" || devicePanelView === 'content') &&
                (mobileTab !== "canvas" || scenePanelView === 'content') &&
                (mobileTab !== "labels" || labelsPanelView === 'content') && (
                  <div
                    style={{
                      width: "100%",
                      minWidth: 0,
                      overflowX: "hidden",
                      maxHeight: "25vh",
                      overflowY: "auto",
                      padding: "8px 16px",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}
                    className="styled-scroll hide-scrollbars"
                  >
                    <LeftPanel
                      mobile
                      mobileContentOnly={mobileTab as any}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      backgroundPanelView={backgroundPanelView}
                      setBackgroundPanelView={setBackgroundPanelView}
                    />
                  </div>
                )}

              {/* Tier 3: Context Footer */}
              <div
                className="ps-tier-footer"
                style={{
                  padding: "8px 16px 4px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <button
                  className="ps-back-btn btn-press"
                  onClick={() => {
                    if (mobileTab === 'background' && backgroundPanelView === 'content') {
                      setBackgroundPanelView('hub');
                    } else if (mobileTab === 'device' && devicePanelView === 'content') {
                      setDevicePanelView('hub');
                    } else if (mobileTab === 'canvas' && scenePanelView === 'content') {
                      setScenePanelView('hub');
                    } else if (mobileTab === 'labels' && state.activeLabelId) {
                      updateState({ activeLabelId: null });
                    } else if (mobileTab === 'labels' && labelsPanelView === 'content') {
                      setLabelsPanelView('hub');
                    } else {
                      setMobileTab(null);
                    }
                  }}
                  style={{
                    position: "relative",
                    left: "auto",
                    background: "none",
                    border: "none",
                    color: "#fff",
                    padding: 0,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                {mobileTab === 'labels' && state.activeLabelId ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, marginLeft: 4 }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        value={state.texts.find(t => t.id === state.activeLabelId)?.text || ""} 
                        onChange={(e) => updateText(state.activeLabelId!, { text: e.target.value })}
                        placeholder="Texto..."
                        style={{ 
                          width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', 
                          color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', padding: '8px 10px', borderRadius: 10
                        }} 
                      />
                    </div>
                    <button onClick={() => { removeText(state.activeLabelId!); updateState({ activeLabelId: null }); }}
                      style={{ 
                        width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.1)', 
                        border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="ps-context-title" style={{ flex: 1, textAlign: 'center', marginRight: 40 }}>
                    {mobileTab === "annotate" ? "Annotate" :
                     mobileTab === "presets" ? "Preajustes" :
                     mobileTab === "template" ? "Plantillas" :
                     mobileTab === "device" ? (devicePanelView === 'content' ? "Modelo" : "Dispositivo") :
                     mobileTab === "background" ? (backgroundPanelView === 'content' ? "Fondo" : "Fondo") :
                     mobileTab === "overlay" ? "Overlay" :
                     mobileTab === "labels" ? (labelsPanelView === 'content' ? (
                        state.labelsSubTab === 'view' ? "Gestionar Etiquetas" :
                        state.labelsSubTab === 'add' ? "Anclar Nueva" :
                        state.labelsSubTab === 'subtract' ? "Limpiar Todo" : "Etiquetas"
                     ) : "Etiquetas") :
                     mobileTab === "canvas" ? (scenePanelView === 'content' ? "Escena" : "Lienzo") : ""}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
