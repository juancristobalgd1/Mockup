import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Crown, 
  Undo2, 
  Redo2, 
  Grid3X3, 
  Download, 
  MoreHorizontal, 
  Trash2 
} from "lucide-react";

interface TopHeaderProps {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  updateState: (updates: any) => void;
  mobileTab: string | null;
  setMobileTab: (tab: string | null) => void;
  showGlobalMenu: boolean;
  setShowGlobalMenu: (show: boolean) => void;
  annotateStrokes: any[];
  annotateClearKey: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  undo,
  redo,
  canUndo,
  canRedo,
  showGrid,
  updateState,
  mobileTab,
  setMobileTab,
  showGlobalMenu,
  setShowGlobalMenu,
  annotateStrokes,
  annotateClearKey
}) => {
  return (
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
          onClick={() => updateState({ showGrid: !showGrid })}
          className="btn-press"
          style={{
            padding: "8px 12px",
            border: "none",
            background: "none",
            color: showGrid ? "var(--ps-accent-blue)" : "#fff",
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
                    updateState({ annotateStrokes: [], annotateClearKey: (annotateClearKey ?? 0) + 1 });
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
  );
};
