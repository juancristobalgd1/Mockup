import * as React from 'react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import { useApp, type InteractionMode } from '../../store';

const ZOOM_SLIDER_MIN = 0;
const ZOOM_SLIDER_MAX = 100;

interface FloatingToolbarProps {
  onAddElement: () => void;
  onToggleExport: () => void;
  isExportOpen: boolean;
  isMobile: boolean;
}

export function FloatingToolbar({
  onAddElement,
  onToggleExport,
  isExportOpen,
  isMobile,
}: FloatingToolbarProps) {
  const { state, updateState } = useApp();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragPointerOffsetRef = useRef({ x: 0, y: 0 });
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);

  const mode = state.interactionMode;
  const zoomValue = state.zoomValue;
  const zoomOpen = mode === 'zoom';

  const toggleMode = (nextMode: Exclude<InteractionMode, 'none'>) => {
    updateState({ interactionMode: mode === nextMode ? 'none' : nextMode });
  };

  const onZoomChange = (value: number) => {
    updateState({ zoomValue: value }, true); // skipHistory: true for smooth slider
  };

  const getClampedPosition = useCallback((left: number, top: number) => {
    const controlEl = rootRef.current;
    const parentEl = controlEl?.parentElement;
    if (!controlEl || !parentEl) return { x: left, y: top };

    const parentRect = parentEl.getBoundingClientRect();
    const controlRect = controlEl.getBoundingClientRect();
    const maxX = Math.max(12, parentRect.width - controlRect.width - 24);
    const maxY = Math.max(12, parentRect.height - controlRect.height - 24);

    return {
      x: Math.min(Math.max(12, left), maxX),
      y: Math.min(Math.max(12, top), maxY),
    };
  }, []);

  const updateDraggedPosition = useCallback((clientX: number, clientY: number) => {
    const controlEl = rootRef.current;
    const parentEl = controlEl?.parentElement;
    if (!controlEl || !parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();
    const nextLeft = clientX - parentRect.left - dragPointerOffsetRef.current.x;
    const nextTop = clientY - parentRect.top - dragPointerOffsetRef.current.y;
    setCustomPosition(getClampedPosition(nextLeft, nextTop));
  }, [getClampedPosition]);

  const handleGripPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const controlEl = rootRef.current;
    const parentEl = controlEl?.parentElement;
    if (!controlEl || !parentEl) return;

    const controlRect = controlEl.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    dragPointerIdRef.current = event.pointerId;
    dragPointerOffsetRef.current = {
      x: event.clientX - controlRect.left,
      y: event.clientY - controlRect.top,
    };

    setCustomPosition((current) => current ?? getClampedPosition(controlRect.left - parentRect.left, controlRect.top - parentRect.top));
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }, [getClampedPosition]);

  const handleGripPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    updateDraggedPosition(event.clientX, event.clientY);
  }, [updateDraggedPosition]);

  const handleGripPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragPointerIdRef.current !== event.pointerId) return;
    updateDraggedPosition(event.clientX, event.clientY);
    dragPointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, [updateDraggedPosition]);

  const pillButton = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    width: 44,
    height: 44,
    border: 'none',
    borderRadius: 999,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: active ? '#f5f5f5' : 'rgba(255,255,255,0.76)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
    transition: 'all 0.18s ease',
  });

  return (
    <div 
      ref={rootRef} 
      role="toolbar" 
      aria-label="Unified Command Bar" 
      style={{
        position: 'absolute',
        left: customPosition ? customPosition.x : isMobile ? '50%' : 'auto',
        right: customPosition ? 'auto' : isMobile ? 'auto' : 24,
        top: customPosition ? customPosition.y : 'auto',
        transform: customPosition ? 'none' : isMobile ? 'translateX(-50%)' : 'none',
        bottom: customPosition ? 'auto' : isMobile ? 'max(92px, calc(env(safe-area-inset-bottom, 0px) + 84px))' : 160,
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'auto',
        transition: !customPosition ? 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
      }}
      className="btn-press"
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 6,
        borderRadius: 999,
        background: 'linear-gradient(rgba(32, 32, 34, 0.96), rgba(24, 24, 26, 0.94))',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: 'rgba(255, 255, 255, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.24) 0px 14px 24px, rgba(255, 255, 255, 0.08) 0px 1px 1px inset',
        backdropFilter: 'blur(18px)',
      }}>
        {/* DRAG HANDLE */}
        <button
          aria-label="Recolocar controles"
          title="Recolocar controles"
          onPointerDown={handleGripPointerDown}
          onPointerMove={handleGripPointerMove}
          onPointerUp={handleGripPointerUp}
          onPointerCancel={handleGripPointerUp}
          style={{
            width: 28,
            height: 44,
            border: 'none',
            borderRadius: 999,
            background: 'transparent',
            color: 'rgba(255,255,255,0.48)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 4px)',
            gridTemplateRows: 'repeat(3, 4px)',
            gap: 4,
            alignContent: 'center',
            justifyContent: 'center',
            cursor: dragPointerIdRef.current === null ? 'grab' : 'grabbing',
            touchAction: 'none',
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: 'currentColor',
                opacity: 0.9,
              }}
            />
          ))}
        </button>

        {/* MOVE TOOL */}
        <button aria-label="Desplazar dispositivo" aria-pressed={mode === 'drag'} title="Desplazar dispositivo" onClick={() => toggleMode('drag')} style={pillButton(mode === 'drag')}>
          {mode === 'drag' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.5 2.75a1.25 1.25 0 0 0-1.25 1.25V9H9.5V3.75a1.25 1.25 0 1 0-2.5 0V11H6.25V6.75a1.25 1.25 0 1 0-2.5 0v7.5c0 3.45 2.8 6.25 6.25 6.25h1.5c4 0 7.25-3.25 7.25-7.25v-5a1.25 1.25 0 1 0-2.5 0V11h-.75V4.75a1.25 1.25 0 0 0-2.5 0V11h-.75V4a1.25 1.25 0 0 0-1.25-1.25Z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10" />
              <path d="M12 10V4.5a1.5 1.5 0 0 1 3 0V11" />
              <path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V13" />
              <path d="M6 12V9.5a1.5 1.5 0 0 1 3 0V13" />
              <path d="M18 13.5c0 4.5-2.7 7.5-6.6 7.5-3.3 0-5.8-2.1-6.7-5.3l-1.3-4.6a1.5 1.5 0 0 1 2.9-.8l.7 2.2" />
            </svg>
          )}
        </button>

        {/* ZOOM TOOL */}
        <button aria-label="Abrir control de zoom" aria-pressed={zoomOpen} title="Zoom" onClick={() => toggleMode('zoom')} style={pillButton(zoomOpen)}>
          {zoomOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10.5 4a6.5 6.5 0 1 0 4.06 11.58l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9Z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          )}
        </button>

        {/* EXTRA TOOLS SEPARATOR */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        {/* ADD TOOL */}
        <button aria-label="Añadir elemento" title="Añadir" onClick={onAddElement} style={pillButton(false)}>
          <Plus size={22} strokeWidth={2.2} />
        </button>

        {/* LAYERS / EXPORT TOOL */}
        <button aria-label="Capas y Exportar" title="Capas" onClick={onToggleExport} style={pillButton(isExportOpen)}>
          <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {state.screenshotUrl ? (
              <img 
                src={state.screenshotUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: 4,
                  border: isExportOpen ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)'
                }} 
              />
            ) : (
              <Layers size={22} strokeWidth={2.2} />
            )}
          </div>
        </button>
      </div>

      {/* ZOOM SLIDER POPUP */}
      <div aria-hidden={!zoomOpen} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: zoomOpen ? 54 : 0,
        opacity: zoomOpen ? 1 : 0,
        transform: zoomOpen ? 'translateX(0)' : 'translateX(-10px)',
        pointerEvents: zoomOpen ? 'auto' : 'none',
        transition: 'width 0.2s ease, opacity 0.18s ease, transform 0.18s ease',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '10px 8px',
          borderRadius: 18,
          background: 'linear-gradient(rgba(32, 32, 34, 0.96), rgba(22, 22, 24, 0.94))',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 14px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(18px)',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>+</span>
          <input
            aria-label="Nivel de zoom"
            type="range"
            min={ZOOM_SLIDER_MIN}
            max={ZOOM_SLIDER_MAX}
            value={Math.round(zoomValue)}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            style={{
              writingMode: 'vertical-rl',
              WebkitAppearance: 'slider-vertical',
              appearance: 'slider-vertical',
              width: 16,
              height: 108,
              accentColor: '#f4f4f5',
              cursor: 'ns-resize',
              background: 'transparent',
            } as unknown as React.CSSProperties}
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>-</span>
        </div>
      </div>
    </div>
  );
}
