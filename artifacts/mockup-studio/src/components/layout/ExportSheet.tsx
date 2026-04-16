import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RightPanel } from "../panels/RightPanel";

interface ExportSheetProps {
  isOpen: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  viewerRef: React.RefObject<any>;
  state: any;
  updateText: any;
  removeText: any;
}

export const ExportSheet: React.FC<ExportSheetProps> = ({ 
  isOpen, 
  canvasRef, 
  viewerRef, 
  state, 
  updateText, 
  removeText 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
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
  );
};
