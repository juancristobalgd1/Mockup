import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Image as ImageIcon,
  Layers,
  Grid3X3,
  Tags,
  Sliders,
  PenLine,
  Film,
  Shuffle,
  MoreHorizontal,
  Palette,
  Pencil,
  Plus,
  Search,
  Box,
  Type,
  Eraser,
  Sparkles,
  ArrowLeft,
  Trash2,
  Blend,
  Hand,
  MousePointer2,
  PlusCircle,
  Maximize,
  Activity,
  Sun,
  Lamp,
  Pipette,
  LayoutList,
  ChevronLeft
} from "lucide-react";
import { PropertyTooltip } from "../ui/PropertyTooltip";
import { getModelById, DEVICE_MODELS, DEVICE_GROUPS } from "../../data/devices";
import { PRESENT_POSES } from "../../data/panelConstants";
import { DeviceThumbnail, PoseThumbnail } from "../ui/DeviceThumbnails";
import { MovieTimeline } from "../timeline/MovieTimeline";
import { LeftPanel } from "../panels/LeftPanel";

interface MobileNavigationProps {
  state: any;
  updateState: (updates: any) => void;
  updateText: (id: string, updates: any) => void;
  removeText: (id: string) => void;
  nav: any;
  props: any;
  handleViewToggle: (showVideoEditor: boolean) => void;
  movieTimelineRef: React.RefObject<any>;
  viewerRef: React.RefObject<any>;
  movieTimeRef: React.MutableRefObject<number>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setMoviePlaying: (playing: boolean) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  state,
  updateState,
  updateText,
  removeText,
  nav,
  props,
  handleViewToggle,
  movieTimelineRef,
  viewerRef,
  movieTimeRef,
  canvasRef,
  setMoviePlaying
}) => {
  const {
    mobileTab, setMobileTab,
    activeTab, setActiveTab,
    backgroundPanelView, setBackgroundPanelView,
    devicePanelView, setDevicePanelView,
    scenePanelView, setScenePanelView,
    labelsPanelView, setLabelsPanelView,
    annotatePanelView, setAnnotatePanelView,
  } = nav;

  const {
    annotateProperty, setAnnotateProperty,
    overlayProperty, setOverlayProperty,
    backgroundProperty, setBackgroundProperty,
    patternsProperty, setPatternsProperty,
    deviceProperty, setDeviceProperty,
  } = props;

  return (
    <div
      className="ps-tiered-nav-root"
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
                  setActiveTab("patterns");
                  setMobileTab("patterns");
                }}
                className={`ps-nav-item ${activeTab === "patterns" ? "active" : ""}`}
              >
                <Grid3X3
                  size={22}
                  strokeWidth={activeTab === "patterns" ? 2.5 : 1.8}
                />
                <span>Patrones</span>
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
                background: "rgba(10, 10, 10, 0.96)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                padding: "0 12px 20px",
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => {
                    setActiveTab("template");
                    setMobileTab("template");
                  }}
                  className="btn-press"
                  style={{
                    background: activeTab === 'template' ? '#333' : 'rgba(10, 10, 10, 0.96)',
                    color: activeTab === 'template' ? '#fff' : 'var(--ps-text-dim)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 30,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 44,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    zIndex: 2,
                    flexShrink: 0
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="8" width="14" height="8" rx="1.5" />
                    <rect x="8" y="5" width="8" height="14" rx="1.5" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{state.canvasRatio || "1:1"}</span>
                </button>
              </div>

              <div
                className="ps-action-pill"
                style={{ position: "relative", minWidth: 130, height: 44, padding: '2px' }}
              >
                <button
                  className={`ps-action-item ${!state.movieMode ? "active" : ""}`}
                  onClick={() => handleViewToggle(false)}
                  aria-label="Herramientas"
                  style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
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
                  style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  className="ps-action-pill"
                  style={{ position: "relative", minWidth: 90, height: 44, padding: '2px' }}
                >
                  <button
                    className={`ps-action-item ${state.interactionMode === 'drag' ? "active" : ""}`}
                    onClick={() => updateState({ interactionMode: state.interactionMode === 'drag' ? 'none' : 'drag' })}
                    aria-label="Cámara"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
                  >
                    {state.interactionMode === 'drag' && (
                      <motion.div
                        layoutId="active-action-pill-interaction"
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10" />
                      <path d="M12 10V4.5a1.5 1.5 0 0 1 3 0V11" />
                      <path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V13" />
                      <path d="M6 12V9.5a1.5 1.5 0 0 1 3 0V13" />
                      <path d="M18 13.5c0 4.5-2.7 7.5-6.6 7.5-3.3 0-5.8-2.1-6.7-5.3l-1.3-4.6a1.5 1.5 0 0 1 2.9-.8l.7 2.2" />
                    </svg>
                  </button>
                  <button
                    className={`ps-action-item ${state.interactionMode === 'zoom' ? "active" : ""}`}
                    onClick={() => updateState({ interactionMode: state.interactionMode === 'zoom' ? 'none' : 'zoom' })}
                    aria-label="Zoom"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
                  >
                    {state.interactionMode === 'zoom' && (
                      <motion.div
                        layoutId="active-action-pill-interaction"
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
                    <Search size={16} />
                  </button>
                </div>

                <AnimatePresence>
                  {state.interactionMode === 'zoom' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 70,
                        zIndex: 100,
                        padding: '12px 10px',
                        borderRadius: 20,
                        background: 'rgba(26, 26, 26, 0.96)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Plus size={12} color="rgba(255,255,255,0.6)" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={state.zoomValue}
                        onChange={(e) => updateState({ zoomValue: Number(e.target.value) }, true)}
                        style={{
                          writingMode: 'vertical-rl',
                          WebkitAppearance: 'slider-vertical',
                          appearance: 'slider-vertical',
                          width: 16,
                          height: 120,
                          accentColor: '#f4f4f5',
                          cursor: 'ns-resize',
                          background: 'transparent',
                        } as any}
                      />
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>-</div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                background: "rgba(10, 10, 10, 0.96)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                padding: "0 12px 20px",
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => {
                    setActiveTab("template");
                    setMobileTab("template");
                  }}
                  className="btn-press"
                  style={{
                    background: activeTab === 'template' ? '#333' : 'rgba(10, 10, 10, 0.96)',
                    color: activeTab === 'template' ? '#fff' : 'var(--ps-text-dim)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 30,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 44,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    zIndex: 2,
                    flexShrink: 0
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="8" width="14" height="8" rx="1.5" />
                    <rect x="8" y="5" width="8" height="14" rx="1.5" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{state.canvasRatio || "1:1"}</span>
                </button>
              </div>

              <div
                className="ps-action-pill"
                style={{ position: "relative", minWidth: 130, height: 44, padding: '2px' }}
              >
                <button
                  className={`ps-action-item ${!state.movieMode ? "active" : ""}`}
                  onClick={() => handleViewToggle(false)}
                  aria-label="Herramientas"
                  style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
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
                  style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  className="ps-action-pill"
                  style={{ position: "relative", minWidth: 90, height: 44, padding: '2px' }}
                >
                  <button
                    className={`ps-action-item ${state.interactionMode === 'drag' ? "active" : ""}`}
                    onClick={() => updateState({ interactionMode: state.interactionMode === 'drag' ? 'none' : 'drag' })}
                    aria-label="Cámara"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
                  >
                    {state.interactionMode === 'drag' && (
                      <motion.div
                        layoutId="active-action-pill-interaction-movie"
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10" />
                      <path d="M12 10V4.5a1.5 1.5 0 0 1 3 0V11" />
                      <path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V13" />
                      <path d="M6 12V9.5a1.5 1.5 0 0 1 3 0V13" />
                      <path d="M18 13.5c0 4.5-2.7 7.5-6.6 7.5-3.3 0-5.8-2.1-6.7-5.3l-1.3-4.6a1.5 1.5 0 0 1 2.9-.8l.7 2.2" />
                    </svg>
                  </button>
                  <button
                    className={`ps-action-item ${state.interactionMode === 'zoom' ? "active" : ""}`}
                    onClick={() => updateState({ interactionMode: state.interactionMode === 'zoom' ? 'none' : 'zoom' })}
                    aria-label="Zoom"
                    style={{ position: "relative", zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, height: 40 }}
                  >
                    {state.interactionMode === 'zoom' && (
                      <motion.div
                        layoutId="active-action-pill-interaction-movie"
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
                    <Search size={16} />
                  </button>
                </div>

                <AnimatePresence>
                  {state.interactionMode === 'zoom' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 70,
                        zIndex: 100,
                        padding: '12px 10px',
                        borderRadius: 20,
                        background: 'rgba(26, 26, 26, 0.96)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Plus size={12} color="rgba(255,255,255,0.6)" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={state.zoomValue}
                        onChange={(e) => updateState({ zoomValue: Number(e.target.value) }, true)}
                        style={{
                          writingMode: 'vertical-rl',
                          WebkitAppearance: 'slider-vertical',
                          appearance: 'slider-vertical',
                          width: 16,
                          height: 120,
                          accentColor: '#f4f4f5',
                          cursor: 'ns-resize',
                          background: 'transparent',
                        } as any}
                      />
                      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>-</div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <PropertyTooltip
                    isOpen={!!annotateProperty}
                    onClose={() => setAnnotateProperty(null)}
                    id="annotate-tooltip"
                    label={annotateProperty === 'size' ? 'Grosor' : annotateProperty === 'opacity' ? 'Opacidad' : annotateProperty === 'more' ? 'Ajustes' : 'Color'}
                  >
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
                  </PropertyTooltip>

                  <button
                    className="ps-tool-icon-btn btn-press"
                    onClick={() => setAnnotateProperty(annotateProperty === 'color' ? null : 'color')}
                    style={{
                      pointerEvents: "auto",
                      background: annotateProperty === 'color' ? "#fff" : "#1c1c1e",
                      color: annotateProperty === 'color' ? "#000" : "#fff",
                      border: "none", width: 44, height: 44, borderRadius: 22,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden",
                    }}
                  >
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: state.annotateColor, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                    </div>
                  </button>

                  <div style={{ pointerEvents: "auto", display: "flex", background: "#1c1c1e", borderRadius: 30, padding: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <button className="btn-press" onClick={() => setAnnotateProperty(annotateProperty === 'size' ? null : 'size')}
                      style={{ width: 40, height: 40, borderRadius: 20, background: annotateProperty === 'size' ? "#f5f5f7" : "transparent", color: annotateProperty === 'size' ? "#000" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                    </button>
                    <button className="btn-press" onClick={() => setAnnotateProperty(annotateProperty === 'opacity' ? null : 'opacity')}
                      style={{ width: 40, height: 40, borderRadius: 20, background: annotateProperty === 'opacity' ? "#f5f5f7" : "transparent", color: annotateProperty === 'opacity' ? "#000" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /></svg>
                    </button>
                  </div>

                  <button className="ps-tool-icon-btn btn-press" onClick={() => setAnnotateProperty(annotateProperty === 'more' ? null : 'more')}
                    style={{ pointerEvents: "auto", background: annotateProperty === 'more' ? "#fff" : "#1c1c1e", color: annotateProperty === 'more' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}

              {mobileTab === "overlay" && (
                <>
                  <PropertyTooltip
                    isOpen={!!overlayProperty}
                    onClose={() => setOverlayProperty(null)}
                    id="overlay-tooltip"
                    label={overlayProperty === 'color' ? 'Color Sólido' : overlayProperty === 'opacity' ? 'Opacidad Sólido' : overlayProperty === 'light' ? 'Opacidad Luz' : 'Mezcla'}
                  >
                    {overlayProperty === 'color' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        {['#ffffff', '#aaaaaa', '#333333', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateState({ overlayColor: c, overlayEnabled: true })}
                            style={{ width: 38, height: 38, borderRadius: '50%', background: c, border: state.overlayColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    ) : overlayProperty === 'more' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {(['multiply', 'screen', 'overlay', 'soft-light'] as const).map(mode => (
                            <button key={mode} onClick={() => updateState({ lightOverlayBlend: mode })} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700, background: state.lightOverlayBlend === mode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.lightOverlayBlend === mode ? '#000' : '#fff' }}> {mode.charAt(0).toUpperCase() + mode.slice(1)} </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: state.lightOverlayBgOnly ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>Solo al fondo</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>El efecto no cubre el dispositivo</div>
                          </div>
                          <button onClick={() => updateState({ lightOverlayBgOnly: !state.lightOverlayBgOnly })} style={{ width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: state.lightOverlayBgOnly ? '#3498db' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'all 0.18s', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 3, left: state.lightOverlayBgOnly ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="range" min={0} max={100} step={1} value={overlayProperty === 'opacity' ? state.overlayOpacity : state.lightOverlayOpacity} onChange={(e) => { const val = Number(e.target.value); if (overlayProperty === 'opacity') updateState({ overlayOpacity: val, overlayEnabled: true }); else updateState({ lightOverlayOpacity: val }); }} style={{ flex: 1, accentColor: '#3498db', height: 4 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}> {overlayProperty === 'opacity' ? `${state.overlayOpacity}%` : `${state.lightOverlayOpacity}%`} </span>
                      </div>
                    )}
                  </PropertyTooltip>

                  <button className="ps-tool-icon-btn btn-press" onClick={() => setOverlayProperty(overlayProperty === 'color' ? null : 'color')} style={{ pointerEvents: "auto", background: overlayProperty === 'color' ? "#fff" : "#1c1c1e", color: overlayProperty === 'color' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: state.overlayColor, border: '2px solid rgba(255,255,255,0.8)', opacity: state.overlayEnabled ? 1 : 0.4 }} />
                    </div>
                  </button>

                  <div style={{ pointerEvents: "auto", display: "flex", background: "#1c1c1e", borderRadius: 30, padding: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <button className="btn-press" onClick={() => setOverlayProperty(overlayProperty === 'opacity' ? null : 'opacity')}
                      style={{ width: 40, height: 40, borderRadius: 20, background: overlayProperty === 'opacity' ? "#f5f5f7" : "transparent", color: overlayProperty === 'opacity' ? "#000" : (state.overlayEnabled ? "#fff" : "rgba(255,255,255,0.4)"), display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /></svg>
                    </button>
                    <button className="btn-press" onClick={() => setOverlayProperty(overlayProperty === 'light' ? null : 'light')}
                      style={{ width: 40, height: 40, borderRadius: 20, background: overlayProperty === 'light' ? "#f5f5f7" : "transparent", color: overlayProperty === 'light' ? "#000" : (state.lightOverlay ? "#fff" : "rgba(255,255,255,0.4)"), display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                    </button>
                  </div>

                  <button className="ps-tool-icon-btn btn-press" onClick={() => setOverlayProperty(overlayProperty === 'more' ? null : 'more')} style={{ pointerEvents: "auto", background: overlayProperty === 'more' ? "#fff" : "#1c1c1e", color: overlayProperty === 'more' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}

              {mobileTab === "background" && (
                <>
                  <PropertyTooltip
                    isOpen={!!backgroundProperty}
                    onClose={() => setBackgroundProperty(null)}
                    id="background-tooltip"
                    label={backgroundProperty === 'opacity' ? 'Opacidad' : backgroundProperty === 'blur' ? 'Desenfoque' : 'Efectos'}
                  >
                    {backgroundProperty === 'more' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button onClick={() => updateState({ grain: !state.grain })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.grain ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.grain ? '#000' : '#fff' }}>Ruido</button>
                        <button onClick={() => updateState({ bgVignette: !state.bgVignette })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.bgVignette ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.bgVignette ? '#000' : '#fff' }}>Viñeta</button>
                        <button onClick={() => updateState({ grainBgOnly: !state.grainBgOnly })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.grainBgOnly ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.grainBgOnly ? '#000' : '#fff' }}>Solo Fondo (Ruido)</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="range" min={0} max={backgroundProperty === 'opacity' ? 100 : 20} step={1} value={backgroundProperty === 'opacity' ? state.bgOpacity : state.bgBlur} onChange={(e) => { const val = Number(e.target.value); if (backgroundProperty === 'opacity') updateState({ bgOpacity: val }); else updateState({ bgBlur: val }); }} style={{ flex: 1, accentColor: '#3498db', height: 4 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}> {backgroundProperty === 'opacity' ? `${state.bgOpacity}%` : `${state.bgBlur}px`} </span>
                      </div>
                    )}
                  </PropertyTooltip>

                  <button className="ps-tool-icon-btn btn-press" onClick={() => { const pool = [{ bgType: 'solid', bgColor: '#ffffff' }, { bgType: 'solid', bgColor: '#1c1c1e' }, { bgType: 'solid', bgColor: '#ef4444' }, { bgType: 'gradient', bgColor: 'sky' }, { bgType: 'gradient', bgColor: 'fire' }, { bgType: 'mesh', bgColor: 'aurora' }, { bgType: 'mesh', bgColor: 'ocean' }, { bgType: 'wallpaper', bgColor: 'nature-1' },]; const pick = pool[Math.floor(Math.random() * pool.length)]; updateState(pick as any); }} style={{ pointerEvents: "auto", background: "#1c1c1e", color: "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shuffle size={20} />
                  </button>

                  <div style={{ pointerEvents: "auto", display: "flex", background: "#1c1c1e", borderRadius: 30, padding: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <button className="btn-press" onClick={() => setBackgroundProperty(backgroundProperty === 'opacity' ? null : 'opacity')} style={{ width: 40, height: 40, borderRadius: 20, background: backgroundProperty === 'opacity' ? "#f5f5f7" : "transparent", color: backgroundProperty === 'opacity' ? "#000" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /></svg>
                    </button>
                    <button className="btn-press" onClick={() => setBackgroundProperty(backgroundProperty === 'blur' ? null : 'blur')} style={{ width: 40, height: 40, borderRadius: 20, background: backgroundProperty === 'blur' ? "#f5f5f7" : "transparent", color: backgroundProperty === 'blur' ? "#000" : (state.bgBlur > 0 ? "#fff" : "rgba(255,255,255,0.4)"), display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                    </button>
                  </div>

                  <button className="ps-tool-icon-btn btn-press" onClick={() => setBackgroundProperty(backgroundProperty === 'more' ? null : 'more')} style={{ pointerEvents: "auto", background: backgroundProperty === 'more' ? "#fff" : "#1c1c1e", color: backgroundProperty === 'more' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}

              {mobileTab === "patterns" && (
                <>
                  <PropertyTooltip
                    isOpen={!!patternsProperty}
                    onClose={() => setPatternsProperty(null)}
                    id="patterns-tooltip"
                    label={patternsProperty === 'color' ? 'Color de Patrón' : patternsProperty === 'opacity' ? 'Opacidad' : patternsProperty === 'scale' ? 'Escala' : 'Ajustes'}
                  >
                    {patternsProperty === 'color' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, background: state.bgPatternColor, border: '1px solid rgba(255,255,255,0.2)' }}>
                          <input type="color" value={state.bgPatternColor.startsWith('#') ? state.bgPatternColor : '#ffffff'} onChange={e => updateState({ bgPatternColor: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                        </div>
                        <input type="text" value={state.bgPatternColor} onChange={e => updateState({ bgPatternColor: e.target.value })} className="rt-input" style={{ flex: 1, height: 44, fontFamily: 'monospace', fontSize: 14 }} />
                      </div>
                    ) : patternsProperty === 'more' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button onClick={() => updateState({ bgPatternEnabled: false })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(255,100,100,0.1)', color: 'rgba(255,150,150,1)', border: '1px solid rgba(255,100,100,0.2)' }}>Eliminar Patrón</button>
                        <button onClick={() => { updateState({ bgPatternEnabled: true, bgPatternOpacity: 100, bgPatternScale: 1, bgPatternColor: '#ffffff' }); }} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>Resetear Ajustes</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="range" min={0} max={100} step={1} value={patternsProperty === 'opacity' ? state.bgOpacity : (state.bgPatternScale * 25)} onChange={(e) => { const val = Number(e.target.value); if (patternsProperty === 'opacity') updateState({ bgOpacity: val }); else updateState({ bgPatternScale: val / 25 }); }} style={{ flex: 1, accentColor: '#fff', height: 4 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}> {patternsProperty === 'opacity' ? `${state.bgOpacity}%` : `${Math.round(state.bgPatternScale * 100)}%`} </span>
                      </div>
                    )}
                  </PropertyTooltip>
                  <button className="ps-tool-icon-btn btn-press" onClick={() => setPatternsProperty(patternsProperty === 'color' ? null : 'color')} style={{ pointerEvents: "auto", background: patternsProperty === 'color' ? "#fff" : "#1c1c1e", color: patternsProperty === 'color' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", position: 'relative', overflow: 'hidden', opacity: state.bgPatternEnabled ? 1 : 0.5 }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: state.bgPatternColor, border: '2px solid rgba(255,255,255,0.8)', opacity: 0.8 }} />
                    </div>
                  </button>
                  <div style={{ display: "flex", background: "#1c1c1e", borderRadius: 30, padding: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", opacity: state.bgPatternEnabled ? 1 : 0.5, pointerEvents: state.bgPatternEnabled ? 'auto' : 'none' }}>
                    <button className="btn-press" onClick={() => setPatternsProperty(patternsProperty === 'opacity' ? null : 'opacity')} style={{ width: 40, height: 40, borderRadius: 20, background: patternsProperty === 'opacity' ? "#f5f5f7" : "transparent", color: patternsProperty === 'opacity' ? "#000" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /></svg></button>
                    <button className="btn-press" onClick={() => setPatternsProperty(patternsProperty === 'scale' ? null : 'scale')} style={{ width: 40, height: 40, borderRadius: 20, background: patternsProperty === 'scale' ? "#f5f5f7" : "transparent", color: patternsProperty === 'scale' ? "#000" : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /><path d="M12 8v8" /></svg></button>
                  </div>
                  <button className="ps-tool-icon-btn btn-press" onClick={() => setPatternsProperty(patternsProperty === 'more' ? null : 'more')} style={{ pointerEvents: "auto", background: patternsProperty === 'more' ? "#fff" : "#1c1c1e", color: patternsProperty === 'more' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <MoreHorizontal size={20} />
                  </button>
                </>
              )}

              {mobileTab === "device" && (
                <>
                  <PropertyTooltip
                    isOpen={!!deviceProperty}
                    onClose={() => setDeviceProperty(null)}
                    id="device-tooltip"
                    label={deviceProperty === 'color' ? 'Material / Color' : deviceProperty === 'reflection' ? 'Reflexión' : deviceProperty === 'shadow' ? 'Sombra' : 'Ajustes'}
                  >
                    {deviceProperty === 'color' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                        <button onClick={() => updateState({ clayMode: false, deviceColor: 'original' })} style={{ width: 38, height: 38, borderRadius: '50%', background: 'conic-gradient(from 0deg, #ff4d4d, #f9cb28, #7cfc00, #00ffff, #4d4dff, #ff00ff, #ff4d4d)', border: state.deviceColor === 'original' && !state.clayMode ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Original"><Smartphone size={14} color="#fff" /></button>
                        {['titanium', 'spaceblack', 'silver', 'gold', 'blue'].map(c => (
                          <button key={c} onClick={() => updateState({ deviceColor: c, clayMode: state.clayMode })} style={{ width: 38, height: 38, borderRadius: '50%', background: c === 'titanium' ? '#a7a7a1' : c === 'spaceblack' ? '#2e2e2e' : c === 'silver' ? '#e3e3e3' : c === 'gold' ? '#f5e1c4' : '#4b5e7a', border: state.deviceColor === c && state.clayMode ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                        ))}
                      </div>
                    ) : deviceProperty === 'more' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button onClick={() => updateState({ clayMode: !state.clayMode })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.clayMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.clayMode ? '#000' : '#fff' }}>Modo Clay</button>
                        <button onClick={() => updateState({ deviceLandscape: !state.deviceLandscape })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.deviceLandscape ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.deviceLandscape ? '#000' : '#fff' }}>Horizontal</button>
                        <button onClick={() => updateState({ reflection: !state.reflection })} style={{ padding: '10px 16px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: state.reflection ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)', color: state.reflection ? '#000' : '#fff' }}>Reflexión</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input type="range" min={0} max={100} step={1} value={deviceProperty === 'reflection' ? state.reflectionOpacity * 100 : state.contactShadowOpacity * 100} onChange={(e) => { const val = Number(e.target.value) / 100; if (deviceProperty === 'reflection') updateState({ reflectionOpacity: val, reflection: true }); else updateState({ contactShadowOpacity: val }); }} style={{ flex: 1, accentColor: '#3498db', height: 4 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 36, textAlign: 'right' }}>{deviceProperty === 'reflection' ? `${Math.round(state.reflectionOpacity * 100)}%` : `${Math.round(state.contactShadowOpacity * 100)}%`}</span>
                      </div>
                    )}
                  </PropertyTooltip>
                  <button className="ps-tool-icon-btn btn-press" onClick={() => setDeviceProperty(deviceProperty === 'color' ? null : 'color')} style={{ pointerEvents: "auto", background: deviceProperty === 'color' ? "#fff" : "#1c1c1e", color: deviceProperty === 'color' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", position: "relative", overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Palette size={20} /></button>
                  <div style={{ pointerEvents: "auto", display: "flex", background: "#1c1c1e", borderRadius: 30, padding: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                    <button className="btn-press" onClick={() => setDeviceProperty(deviceProperty === 'reflection' ? null : 'reflection')} style={{ width: 40, height: 40, borderRadius: 20, background: deviceProperty === 'reflection' ? "#f5f5f7" : "transparent", color: deviceProperty === 'reflection' ? "#000" : (state.reflection ? "#fff" : "rgba(255,255,255,0.4)"), display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /></svg></button>
                    <button className="btn-press" onClick={() => setDeviceProperty(deviceProperty === 'shadow' ? null : 'shadow')} style={{ width: 40, height: 40, borderRadius: 20, background: deviceProperty === 'shadow' ? "#f5f5f7" : "transparent", color: deviceProperty === 'shadow' ? "#000" : (state.contactShadowOpacity > 0 ? "#fff" : "rgba(255,255,255,0.4)"), display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4" strokeWidth="1.5" /><path d="M8 12h8" /><path d="M12 8v8" /></svg></button>
                  </div>
                  <button className="ps-tool-icon-btn btn-press" onClick={() => setDeviceProperty(deviceProperty === 'more' ? null : 'more')} style={{ pointerEvents: "auto", background: deviceProperty === 'more' ? "#fff" : "#1c1c1e", color: deviceProperty === 'more' ? "#000" : "#fff", border: "none", width: 44, height: 44, borderRadius: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}><MoreHorizontal size={20} /></button>
                </>
              )}
            </div>

            {/* Tier 1: Contextual Tools */}
            {((mobileTab === 'presets') || (mobileTab === 'device' && devicePanelView === 'hub') || (mobileTab === 'annotate') || (mobileTab === 'background' && backgroundPanelView === 'hub') || (mobileTab === 'canvas' && scenePanelView === 'hub') || (mobileTab === 'labels' && labelsPanelView === 'hub')) && (
              <div className="ps-tier-tools" style={{ padding: "20px 20px 10px" }}>
                {mobileTab === "presets" && PRESENT_POSES.map((pose) => { const active = state.cameraAngle === pose.id; return (<div key={pose.id} className="ps-tool-thumb-box"> <button className={`ps-tool-thumb btn-press ${active ? "active" : ""}`} onClick={() => updateState({ cameraAngle: pose.id, cameraResetKey: (state.cameraResetKey ?? 0) + 1 })}> <PoseThumbnail ry={pose.ry} rx={pose.rx} rz={pose.rz} active={active} mini /> </button> <span className="ps-tool-label">{pose.label}</span> </div>) })}
                {mobileTab === "device" && devicePanelView === 'hub' && DEVICE_GROUPS.map((group) => { const repModel = DEVICE_MODELS.find((m) => m.group === group); return (<div key={group} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { if (repModel) { updateState({ deviceModel: repModel.id, deviceType: repModel.storeType, deviceColor: repModel.useOriginalMaterials ? "original" : "titanium", deviceSubTab: "models" }); setDevicePanelView('content'); } }}> <div style={{ transform: "scale(1.3)" }}><DeviceThumbnail modelId={repModel?.id || ""} isSelected={false} /></div> </button> <span className="ps-tool-label">{group}</span> </div>) })}
                {mobileTab === "annotate" && annotatePanelView === 'hub' && [{ id: "select", label: "Seleccionar", icon: <MousePointer2 size={24} />, action: () => updateState({ annotateTool: 'select', annotateMode: true }) }, { id: "pen", label: "Pincel", icon: <Pencil size={24} />, action: () => updateState({ annotateTool: 'pen', annotateMode: true }) }, { id: "shapes", label: "Formas", icon: <Box size={24} />, action: () => setAnnotatePanelView('shapes') }, { id: "text", label: "Texto", icon: <Type size={24} />, action: () => updateState({ annotateTool: 'text', annotateMode: true }) }, { id: "eraser", label: "Borrador", icon: <Eraser size={24} />, action: () => updateState({ annotateTool: 'eraser', annotateMode: true }) }, { id: "stickers", label: "Stickers", icon: <Sparkles size={24} />, action: () => setAnnotatePanelView('stickers') },].map((tool) => { const isActive = state.annotateTool === tool.id || (tool.id === 'shapes' && (state.annotateTool as any) && ['rect', 'arrow', 'circle'].includes(state.annotateTool as any)); return (<div key={tool.id} className="ps-tool-thumb-box"> <button className={`ps-tool-thumb btn-press ${isActive ? "active" : ""}`} onClick={tool.action} style={{ padding: 0, width: 60, height: 60, borderRadius: 12, background: "#1c1c1e", border: isActive ? "2px solid #3498db" : "1px solid rgba(255,255,255,0.1)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#3498db' : '#fff' }}> {tool.icon} </button> <span className="ps-tool-label" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{tool.label}</span> </div>) })}
                {mobileTab === "annotate" && annotatePanelView === 'shapes' && (
                  <>
                    <div className="ps-tool-thumb-box" style={{ paddingRight: 12, marginRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      <button className="ps-tool-thumb btn-press" onClick={() => setAnnotatePanelView('hub')} style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><ArrowLeft size={24} /></button>
                      <span className="ps-tool-label">Volver</span>
                    </div>
                    {[
                      { id: 'arrow', label: 'Flecha', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /><polyline points="9 5 19 5 19 15" /></svg> },
                      { id: 'rect', label: 'Rect', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg> },
                      { id: 'circle', label: 'Círculo', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg> },
                      { id: 'ellipse', label: 'Elipse', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6" /></svg> },
                      { id: 'triangle', label: 'Triáng.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,22 2,22" /></svg> },
                      { id: 'diamond', label: 'Rombo', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 23,12 12,23 1,12" /></svg> },
                      { id: 'star', label: 'Estrella', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 15.09,8.26 23,9.27 17.5,14.63 18.18,22.54 12,19.27 5.82,22.54 6.5,14.63 1,9.27 8.91,8.26" /></svg> },
                      { id: 'hexagon', label: 'Hexág.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 21.66,6.5 21.66,17.5 12,23 2.34,17.5 2.34,6.5" /></svg> },
                      { id: 'spiral', label: 'Espiral', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12 C12 12, 18 10, 18 6 C18 2, 12 1, 8 3 C3 5, 2 11, 5 15 C8 19, 15 20, 19 17 C23 14, 22 7, 19 4" /></svg> },
                      { id: 'wave', label: 'Ondulada', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 Q5 6, 8 12 Q11 18, 14 12 Q17 6, 20 12 Q21.5 15, 22 12" /></svg> },
                    ].map((sh) => { const isActive = state.annotateTool === sh.id || (state.annotateTool === 'rect' && state.annotateShape === sh.id); return (<div key={sh.id} className="ps-tool-thumb-box"> <button className={`ps-tool-thumb btn-press ${isActive ? "active" : ""}`} onClick={() => updateState({ annotateTool: sh.id === 'arrow' ? 'arrow' : 'rect', annotateShape: sh.id as any, annotateMode: true })} style={{ padding: 0, width: 60, height: 60, borderRadius: 12, background: "#1c1c1e", border: isActive ? "2px solid #3498db" : "1px solid rgba(255,255,255,0.1)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#3498db' : '#fff' }}> {sh.icon} </button> <span className="ps-tool-label" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{sh.label}</span> </div>) })}
                  </>
                )}
                {mobileTab === "annotate" && annotatePanelView === 'stickers' && (
                  <>
                    <div className="ps-tool-thumb-box" style={{ paddingRight: 12, marginRight: 12, borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      <button className="ps-tool-thumb btn-press" onClick={() => setAnnotatePanelView('hub')} style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><ArrowLeft size={24} /></button> <span className="ps-tool-label">Volver</span>
                    </div>
                    {[{ id: 'heart', label: 'Corazón', icon: '❤️' }, { id: 'star_s', label: 'Estrella', icon: '⭐' }, { id: 'fire', label: 'Fuego', icon: '🔥' }, { id: 'rocket', label: 'Cohete', icon: '🚀' }, { id: 'crown_s', label: 'Corona', icon: '👑' },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { const newSticker: any = { id: Math.random().toString(36).substr(2, 9), kind: 'sticker', stickerId: tool.id, icon: tool.icon, position: { x: 50, y: 50 }, size: 40 }; updateState({ annotateStrokes: [...state.annotateStrokes, newSticker] }); setAnnotatePanelView('hub'); }} style={{ padding: 0, width: 60, height: 60, borderRadius: 12, background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
                  </>
                )}
                {mobileTab === "background" && backgroundPanelView === 'hub' && [{ id: "solid", icon: <Palette size={24} />, label: "Sólido" }, { id: "gradient", icon: <Blend size={24} />, label: "Degradado" }, { id: "image", icon: <ImageIcon size={24} />, label: "Imagen" }, { id: "color", icon: <Pipette size={24} />, label: "Gotero" }, { id: "transparent", icon: <div style={{ width: 24, height: 24, borderRadius: 4, backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)', backgroundSize: '8px 8px', backgroundColor: '#222' }} />, label: "Transp." }, { id: "mesh", icon: <Sparkles size={24} />, label: "Mesh" }, { id: "wallpaper", icon: <LayoutList size={24} />, label: "Walls" },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { if (tool.id === 'transparent') { updateState({ bgType: 'transparent', bgColor: 'transparent', bgImage: null, bgVideo: null }); } else { updateState({ bgType: tool.id as any, showBgSettings: false }); } setBackgroundPanelView('content'); }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
                {mobileTab === "canvas" && scenePanelView === 'hub' && (
                  <>
                    {[{ id: "estudio", icon: <Sun size={24} />, label: "Estudio" }, { id: "luz", icon: <Lamp size={24} />, label: "Luz" },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { updateState({ sceneSubTab: tool.id as any }); setScenePanelView('content'); }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
                    <div style={{ width: 1, background: "rgba(255,255,255,0.12)", height: 64, margin: "0 4px", borderRadius: 2 }} />
                    {[{ id: "camera", icon: <Maximize size={24} />, label: "Cámara" }, { id: "motion", icon: <Activity size={24} />, label: "Movimiento" },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { updateState({ sceneSubTab: tool.id as any }); setScenePanelView('content'); }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
                    <div style={{ width: 1, background: "rgba(255,255,255,0.12)", height: 64, margin: "0 4px", borderRadius: 2 }} />
                    {[{ id: "effects", icon: <Sparkles size={24} />, label: "Efectos" }, { id: "shadow", icon: <Layers size={24} />, label: "Sombras" },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box"> <button className="ps-tool-thumb btn-press" onClick={() => { updateState({ sceneSubTab: tool.id as any }); setScenePanelView('content'); }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
                  </>
                )}
                {mobileTab === "labels" && labelsPanelView === 'hub' && [{ id: "add", icon: <PlusCircle size={24} />, label: "Anclar", disabled: false }, { id: "view", icon: <MousePointer2 size={24} />, label: "Gestionar", disabled: state.texts.filter((t: any) => t.kind === 'label').length === 0 }, { id: "subtract", icon: <Trash2 size={24} />, label: "Limpiar", disabled: state.texts.filter((t: any) => t.kind === 'label').length === 0 },].map((tool) => (<div key={tool.id} className="ps-tool-thumb-box" style={{ opacity: tool.disabled ? 0.35 : 1, pointerEvents: tool.disabled ? 'none' : 'auto' }}> <button className="ps-tool-thumb btn-press" disabled={tool.disabled} onClick={() => { updateState({ labelsSubTab: tool.id as any }); setLabelsPanelView('content'); }}> {tool.icon} </button> <span className="ps-tool-label">{tool.label}</span> </div>))}
              </div>
            )}

            {/* Tier 2.5: Inline Panel Settings */}
            {mobileTab !== "annotate" && mobileTab !== "presets" && (mobileTab !== "background" || backgroundPanelView === 'content') && (mobileTab !== "device" || devicePanelView === 'content') && (mobileTab !== "canvas" || scenePanelView === 'content') && (mobileTab !== "labels" || labelsPanelView === 'content') && (
              <div style={{ width: "100%", minWidth: 0, overflowX: "hidden", maxHeight: "25vh", overflowY: "auto", padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }} className="styled-scroll hide-scrollbars">
                <LeftPanel mobile mobileContentOnly={mobileTab as any} activeTab={activeTab} setActiveTab={setActiveTab} backgroundPanelView={backgroundPanelView} setBackgroundPanelView={setBackgroundPanelView} />
              </div>
            )}

            {/* Tier 3: Context Footer */}
            <div className="ps-tier-footer" style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", gap: 16 }}>
              <button className="ps-back-btn btn-press" onClick={() => { if (mobileTab === 'background' && backgroundPanelView === 'content') { setBackgroundPanelView('hub'); } else if (mobileTab === 'device' && devicePanelView === 'content') { setDevicePanelView('hub'); } else if (mobileTab === 'canvas' && scenePanelView === 'content') { setScenePanelView('hub'); } else if (mobileTab === 'labels' && state.activeLabelId) { updateState({ activeLabelId: null }); } else if (mobileTab === 'labels' && labelsPanelView === 'content') { setLabelsPanelView('hub'); } else { setMobileTab(null); } }} style={{ position: "relative", left: "auto", background: "none", border: "none", color: "#fff", padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={28} />
              </button>
              {mobileTab === 'labels' && state.activeLabelId ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, marginLeft: 4 }}>
                  <div style={{ flex: 1 }}><input value={state.texts.find((t: any) => t.id === state.activeLabelId)?.text || ""} onChange={(e) => updateText(state.activeLabelId!, { text: e.target.value })} placeholder="Texto..." style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', padding: '8px 10px', borderRadius: 10 }} /></div>
                  <button onClick={() => { removeText(state.activeLabelId!); updateState({ activeLabelId: null }); }} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                </div>
              ) : (
                <span className="ps-context-title" style={{ flex: 1, textAlign: 'center', marginRight: 40 }}>
                  {mobileTab === "annotate" ? "Annotate" : mobileTab === "presets" ? "Preajustes" : mobileTab === "template" ? "Plantillas" : mobileTab === "device" ? (devicePanelView === 'content' ? "Modelo" : "Dispositivo") : mobileTab === "background" ? (backgroundPanelView === 'content' ? "Fondo" : "Fondo") : mobileTab === "overlay" ? "Overlay" : mobileTab === "labels" ? (labelsPanelView === 'content' ? (state.labelsSubTab === 'view' ? "Gestionar Etiquetas" : state.labelsSubTab === 'add' ? "Anclar Nueva" : state.labelsSubTab === 'subtract' ? "Limpiar Todo" : "Etiquetas") : "Etiquetas") : mobileTab === "canvas" ? (scenePanelView === 'content' ? "Escena" : "Lienzo") : ""}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
