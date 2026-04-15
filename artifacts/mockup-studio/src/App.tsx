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
} from "lucide-react";
import { GridOverlay } from "./components/ui/GridOverlay";
import { getModelById, DEVICE_MODELS, DEVICE_GROUPS } from "./data/devices";
import { FloatingToolbar } from "./components/ui/FloatingToolbar";
import { PRESENT_POSES } from "./data/panelConstants";
import {
  DeviceThumbnail,
  PoseThumbnail,
  MaskThumbnail,
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
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);

  const currentModel = getModelById(state.deviceModel);
  const deviceLabel = currentModel.label;

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
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              padding: "0 12px 0 4px",
              opacity: 0.8,
            }}
          >
            {deviceLabel}
          </div>
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
          <button
            className="btn-press"
            style={{
              padding: "8px 12px",
              color: "#fff",
              border: "none",
              background: "none",
            }}
          >
            <MoreHorizontal size={18} />
          </button>
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
                  <LayoutGrid
                    size={22}
                    strokeWidth={activeTab === "overlay" ? 2.5 : 1.8}
                  />
                  <span>Capa</span>
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
                  <Pencil
                    size={22}
                    strokeWidth={activeTab === "annotate" ? 2.5 : 1.8}
                  />
                  <span>Máscara</span>
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
                    {/* View Mask Button (Left) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      style={{
                        pointerEvents: "auto",
                        background: "#1c1c1e",
                        color: "#fff",
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
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                          }}
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                    </button>

                    {/* Add/Subtract Pill (Center) */}
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
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: "#f5f5f7",
                          color: "#000",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            strokeDasharray="4 4"
                            strokeWidth="1.5"
                          />
                          <path d="M8 12h8" />
                          <path d="M12 8v8" />
                        </svg>
                      </button>
                      <button
                        className="btn-press"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: "transparent",
                          color: "rgba(255,255,255,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            strokeDasharray="4 4"
                            strokeWidth="1.5"
                          />
                          <path d="M8 12h8" />
                        </svg>
                      </button>
                    </div>

                    {/* More Options Button (Right) */}
                    <button
                      className="ps-tool-icon-btn btn-press"
                      style={{
                        pointerEvents: "auto",
                        background: "#1c1c1e",
                        color: "#fff",
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

                {mobileTab === "device" && (
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
                            className={`ps-tool-thumb btn-press ${isActive ? "active" : ""}`}
                            onClick={() => {
                              if (repModel)
                                updateState({
                                  deviceModel: repModel.id,
                                  deviceType: repModel.storeType,
                                  deviceColor: repModel.useOriginalMaterials
                                    ? "original"
                                    : "titanium",
                                  deviceSubTab: "models",
                                });
                            }}
                          >
                            <div style={{ transform: "scale(1.3)" }}>
                              <DeviceThumbnail
                                modelId={repModel?.id || ""}
                                isSelected={isActive}
                              />
                            </div>
                          </button>
                          <span className="ps-tool-label">{group}</span>
                        </div>
                      );
                    })}

                    <div
                      style={{
                        width: 1,
                        background: "rgba(255,255,255,0.12)",
                        height: 64,
                        margin: "0 4px",
                        borderRadius: 2,
                      }}
                    />

                    <div className="ps-tool-thumb-box">
                      <button
                        className={`ps-tool-thumb btn-press ${state.deviceSubTab === "colors" ? "active" : ""}`}
                        onClick={() => updateState({ deviceSubTab: "colors" })}
                      >
                        <Palette size={24} />
                      </button>
                      <span className="ps-tool-label">Color</span>
                    </div>

                    <div className="ps-tool-thumb-box">
                      <button
                        className={`ps-tool-thumb btn-press ${state.deviceSubTab === "orientation" || state.deviceSubTab === "browser-theme" ? "active" : ""}`}
                        onClick={() =>
                          updateState({
                            deviceSubTab:
                              state.deviceType === "browser"
                                ? "browser-theme"
                                : "orientation",
                          })
                        }
                      >
                        <RotateCw size={24} />
                      </button>
                      <span className="ps-tool-label">
                        {state.deviceType === "browser"
                          ? "Tema"
                          : "Orientación"}
                      </span>
                    </div>
                  </>
                )}

                {mobileTab === "annotate" &&
                  [
                    {
                      id: "subject",
                      label: "Sujeto: Preciso",
                      icon: (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                          <path
                            d="M5 3v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3"
                            strokeDasharray="3 3"
                          />
                        </svg>
                      ),
                    },
                    {
                      id: "bg",
                      label: "Fondo: Preciso",
                      icon: (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path
                            d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
                            strokeDasharray="3 3"
                          />
                          <circle cx="12" cy="7" r="4" strokeDasharray="3 3" />
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      ),
                    },
                    {
                      id: "brush",
                      label: "Pincel: Suave",
                      icon: <MaskThumbnail active />,
                    },
                    {
                      id: "mask",
                      label: "Máscara",
                      icon: <MaskThumbnail type="horizontal" />,
                    },
                  ].map((tool, idx) => (
                    <div key={tool.id} className="ps-tool-thumb-box">
                      <button
                        className={`ps-tool-thumb btn-press ${idx === 2 ? "active" : ""}`}
                        onClick={() =>
                          idx === 2 && updateState({ annotateMode: true })
                        }
                        style={{
                          padding: 0,
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          background: "#1c1c1e",
                          border:
                            idx === 2
                              ? "2px solid #3498db"
                              : "1px solid transparent",
                        }}
                      >
                        {tool.icon}
                      </button>
                      <span className="ps-tool-label">{tool.label}</span>
                    </div>
                  ))}

                {mobileTab === "background" && (
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
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className={`ps-tool-thumb btn-press ${state.bgType === tool.id && !state.showBgSettings ? "active" : ""}`}
                          onClick={() =>
                            updateState({
                              bgType: tool.id as any,
                              showBgSettings: false,
                            })
                          }
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

                    <div className="ps-tool-thumb-box">
                      <button
                        className={`ps-tool-thumb btn-press ${state.showBgSettings ? "active" : ""}`}
                        onClick={() =>
                          updateState({ showBgSettings: !state.showBgSettings })
                        }
                      >
                        <Settings2 size={24} />
                      </button>
                      <span className="ps-tool-label">Ajustes</span>
                    </div>
                  </>
                )}

                {mobileTab === "canvas" && (
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
                          className={`ps-tool-thumb btn-press ${state.sceneSubTab === tool.id ? "active" : ""}`}
                          onClick={() =>
                            updateState({ sceneSubTab: tool.id as any })
                          }
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
                          className={`ps-tool-thumb btn-press ${state.sceneSubTab === tool.id ? "active" : ""}`}
                          onClick={() =>
                            updateState({ sceneSubTab: tool.id as any })
                          }
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
                          className={`ps-tool-thumb btn-press ${state.sceneSubTab === tool.id ? "active" : ""}`}
                          onClick={() =>
                            updateState({ sceneSubTab: tool.id as any })
                          }
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}
                  </>
                )}

                {mobileTab === "labels" && (
                  <>
                    {[
                      {
                        id: "view",
                        icon: <MousePointer2 size={24} />,
                        label: "Gestionar",
                      },
                      {
                        id: "add",
                        icon: <PlusCircle size={24} />,
                        label: "Anclar",
                      },
                      {
                        id: "subtract",
                        icon: <Trash2 size={24} />,
                        label: "Limpiar",
                      },
                    ].map((tool) => (
                      <div key={tool.id} className="ps-tool-thumb-box">
                        <button
                          className={`ps-tool-thumb btn-press ${state.labelsSubTab === tool.id ? "active" : ""}`}
                          onClick={() =>
                            updateState({ labelsSubTab: tool.id as any })
                          }
                        >
                          {tool.icon}
                        </button>
                        <span className="ps-tool-label">{tool.label}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Tier 2: Action Pill (Photoshop Style Primary Action) */}
              {mobileTab === "annotate" && (
                <div
                  className="ps-tier-info"
                  style={{
                    padding: "4px 20px 10px",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <button
                    className="ps-active-tool-pill btn-press"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#e0e0e0",
                      color: "#111",
                      padding: "10px 18px",
                      borderRadius: 8,
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        strokeDasharray="4 4"
                      />
                      <path d="M10 10l8.5 4.5L14 16l-4-6z" />
                    </svg>
                    <span style={{ fontSize: 13 }}>Pulse seleccionar</span>
                  </button>
                  <button
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "none",
                      background: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5" />
                      <path d="M5 12h14" strokeDasharray="2 4" />
                      <path d="M18 10l3-5c-2-2-5-3-5-3l-7 13" />
                    </svg>
                    Pincel de sel. rápida
                  </button>
                </div>
              )}

              {/* Tier 2.5: Inline Panel Settings (Replaces Float Modal) */}
              {(mobileTab !== "annotate" || state.annotateMode) &&
                mobileTab !== "presets" && (
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
                  gap: 12,
                }}
              >
                <button
                  className="ps-back-btn btn-press"
                  onClick={() => setMobileTab(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    padding: 0,
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                <span className="ps-context-title">
                  {mobileTab === "annotate"
                    ? "Selecciona el área"
                    : mobileTab === "presets"
                      ? "Preajustes"
                      : mobileTab === "template"
                        ? "Plantillas"
                        : mobileTab === "device"
                          ? "Dispositivo"
                          : mobileTab === "background"
                            ? "Fondo"
                            : mobileTab === "overlay"
                              ? "Efectos"
                              : mobileTab === "labels"
                                ? "Etiquetas"
                                : mobileTab === "canvas"
                                  ? "Escena"
                                  : "Modelos"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline (only in movie mode) */}
      {state.movieMode && (
        <div
          style={{
            position: "absolute",
            bottom: 64,
            left: 0,
            right: 0,
            zIndex: 120,
          }}
        >
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
