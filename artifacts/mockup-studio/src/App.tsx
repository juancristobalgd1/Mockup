import * as React from "react";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppProvider, useApp } from "./store";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Canvas } from "./components/canvas/Canvas";
import { MovieTimeline } from "./components/timeline/MovieTimeline";
import type { MovieTimelineHandle } from "./components/timeline/MovieTimeline";
import { GridOverlay } from "./components/ui/GridOverlay";
import { FloatingToolbar } from "./components/ui/FloatingToolbar";
import type { Device3DViewerHandle } from "./components/devices3d/Device3DViewer";

// Hooks & UI Layout Components
import { useNavigation } from "./hooks/useNavigation";
import { usePropertyEditor } from "./hooks/usePropertyEditor";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useWindowListeners } from "./hooks/useWindowListeners";
import { TopHeader } from "./components/layout/TopHeader";
import { ExportSheet } from "./components/layout/ExportSheet";
import { MobileNavigation } from "./components/layout/MobileNavigation";

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

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Device3DViewerHandle>(null);
  const movieTimeRef = useRef<number>(0);
  const movieTimelineRef = useRef<MovieTimelineHandle>(null);

  // States
  const [moviePlaying, setMoviePlaying] = useState(false);

  // Custom Hooks
  const nav = useNavigation();
  const props = usePropertyEditor();

  // Global Listeners & Shortcuts
  useGlobalShortcuts({ undo, redo, showGrid: !!state.showGrid, updateState });
  useWindowListeners({ state, showGlobalMenu: nav.showGlobalMenu, setShowGlobalMenu: nav.setShowGlobalMenu });

  const handleViewToggle = (showVideoEditor: boolean) => {
    nav.setMobileTab(null);
    updateState({ movieMode: showVideoEditor });
    if (!showVideoEditor) setMoviePlaying(false);
  };

  return (
    <div
      className="app-root"
      style={{ background: "var(--ps-canvas)", position: "relative" }}
    >
      {/* 1. Header (Undo/Redo, Grid, Global Menu, Export Trigger) */}
      <TopHeader
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        showGrid={!!state.showGrid}
        updateState={updateState}
        mobileTab={nav.mobileTab}
        setMobileTab={(tab) => nav.setMobileTab(tab as any)}
        showGlobalMenu={nav.showGlobalMenu}
        setShowGlobalMenu={nav.setShowGlobalMenu}
        annotateStrokes={state.annotateStrokes}
        annotateClearKey={state.annotateClearKey}
      />

      {/* 2. Main Viewport (Canvas) */}
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

      {/* 3. Export Sheet (Mobile) */}
      <ExportSheet
        isOpen={nav.mobileTab === "export"}
        canvasRef={canvasRef}
        viewerRef={viewerRef}
        state={state}
        updateText={updateText}
        removeText={removeText}
      />

      {/* 4. Unified Command Bar (Floating Zoom & Move) */}
      <FloatingToolbar
        onAddElement={() => {
          nav.setActiveTab("template");
          nav.setMobileTab("template");
        }}
        onToggleExport={() =>
          nav.setMobileTab(nav.mobileTab === "export" ? null : "export")
        }
        isExportOpen={nav.mobileTab === "export"}
        isMobile={window.innerWidth < 768}
      />

      {/* 5. Mobile Navigation & Context Panels */}
      <MobileNavigation
        state={state}
        updateState={updateState}
        updateText={updateText}
        removeText={removeText}
        nav={nav}
        props={props}
        handleViewToggle={handleViewToggle}
        movieTimelineRef={movieTimelineRef}
        viewerRef={viewerRef}
        movieTimeRef={movieTimeRef}
        canvasRef={canvasRef}
        setMoviePlaying={setMoviePlaying}
      />
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
