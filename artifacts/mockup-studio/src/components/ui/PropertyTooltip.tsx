import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  id: string;
  minWidth?: number | string;
}

export function PropertyTooltip({ 
  isOpen, 
  onClose, 
  label, 
  children, 
  id,
  minWidth = 260 
}: PropertyTooltipProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={id}
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
            minWidth: minWidth,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                fontSize: 11, 
                fontWeight: 700, 
                color: 'rgba(255,255,255,0.4)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
              }}>
                {label}
              </span>
              <button 
                onClick={onClose} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: 18, 
                  padding: 0, 
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
