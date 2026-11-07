import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../store';
import { clampL, clampT, safeW } from '../../../utils/panelUtils';
import { Eraser } from 'lucide-react';

type AnnotateShapeId = 'arrow' | 'rect' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'star' | 'hexagon' | 'spiral' | 'wave';

const ANNOTATE_COLOR_GRID = [
  '#ffffff', '#aaaaaa', '#666666', '#333333', '#000000',
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '__custom__',
];

const ANNOTATE_SIZES: ('S' | 'M' | 'L' | 'XL')[] = ['S', 'M', 'L', 'XL'];

const ANNOTATE_SHAPES: { id: AnnotateShapeId; label: string; icon: React.ReactNode }[] = [
  { id: 'arrow',    label: 'Flecha',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg> },
  { id: 'rect',     label: 'Rect',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
  { id: 'circle',   label: 'Círculo', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg> },
  { id: 'ellipse',  label: 'Elipse',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg> },
  { id: 'triangle', label: 'Triáng.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,22 2,22"/></svg> },
  { id: 'diamond',  label: 'Rombo',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 23,12 12,23 1,12"/></svg> },
  { id: 'star',     label: 'Estrella',icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 15.09,8.26 23,9.27 17.5,14.63 18.18,22.54 12,19.27 5.82,22.54 6.5,14.63 1,9.27 8.91,8.26"/></svg> },
  { id: 'hexagon',  label: 'Hexág.',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,1 21.66,6.5 21.66,17.5 12,23 2.34,17.5 2.34,6.5"/></svg> },
  { id: 'spiral',   label: 'Espiral', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12 C12 12, 18 10, 18 6 C18 2, 12 1, 8 3 C3 5, 2 11, 5 15 C8 19, 15 20, 19 17 C23 14, 22 7, 19 4"/></svg> },
  { id: 'wave',     label: 'Onda',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 Q5 6, 8 12 Q11 18, 14 12 Q17 6, 20 12 Q21.5 15, 22 12"/></svg> },
];

export const AnnotateTab = () => {
  const { state, updateState } = useApp();

  const [annotatePopup, setAnnotatePopup] = useState<null | 'color' | 'size' | 'shapes'>(null);
  const [annotatePopupAnchor, setAnnotatePopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const annotatePopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (annotatePopup && annotatePopupRef.current && !annotatePopupRef.current.contains(e.target as Node)) {
        setAnnotatePopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [annotatePopup]);

  const currentShapeItem = ANNOTATE_SHAPES.find(s =>
    state.annotateTool === 'arrow' ? s.id === 'arrow' : s.id === (state.annotateShape ?? 'rect')
  ) ?? ANNOTATE_SHAPES[0];

  return (
    <div ref={annotatePopupRef} style={{ position: 'relative' }}>

      {/* ── Floating color popup ───────────────────────────────── */}
      {annotatePopup === 'color' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 220, -110),
          top: clampT(annotatePopupAnchor.y - 290),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 12,
          width: safeW(220),
          maxHeight: 'min(400px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          <div className="ps-responsive-list" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {ANNOTATE_COLOR_GRID.map(col => {
              if (col === '__custom__') {
                return (
                  <div key="custom" style={{ position: 'relative' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                      </svg>
                    </div>
                    <input type="color" value={state.annotateColor}
                      onChange={e => { updateState({ annotateColor: e.target.value }); }}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </div>
                );
              }
              const sel = state.annotateColor === col;
              return (
                <button key={col}
                  onClick={() => { updateState({ annotateColor: col }); setAnnotatePopup(null); }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: col, flexShrink: 0,
                    outline: sel ? `3px solid rgba(255,255,255,0.9)` : '2px solid rgba(255,255,255,0.08)',
                    outlineOffset: sel ? '2px' : '0px',
                    boxShadow: sel ? `0 0 14px ${col}88` : '0 1px 4px rgba(0,0,0,0.4)',
                    transform: sel ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.12s',
                  }}
                />
              );
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', margin: '0 -2px' }} />

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Opacidad
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={5} max={100} step={1}
                value={Math.round((state.annotateOpacity ?? 1) * 100)}
                onChange={e => updateState({ annotateOpacity: Number(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', minWidth: 34, textAlign: 'right' }}>
                {Math.round((state.annotateOpacity ?? 1) * 100)}%
              </span>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.09)', margin: '0 -2px' }} />

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Grosor
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={1} max={40} step={1}
                value={state.annotateLineWidth ?? 5}
                onChange={e => updateState({ annotateLineWidth: Number(e.target.value) })}
                style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', minWidth: 34, textAlign: 'right' }}>
                {state.annotateLineWidth ?? 5}px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating size popup ───────────────────────────────── */}
      {annotatePopup === 'size' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 260, -130),
          top: clampT(annotatePopupAnchor.y - 90),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '12px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          width: safeW(260),
        }}>
          {ANNOTATE_SIZES.map(sz => {
            const sel = state.annotateSize === sz;
            const dotPx = sz === 'S' ? 5 : sz === 'M' ? 10 : sz === 'L' ? 17 : 26;
            return (
              <button key={sz}
                onClick={() => { updateState({ annotateSize: sz, annotateLineWidth: { S: 2, M: 5, L: 10, XL: 18 }[sz] }); setAnnotatePopup(null); }}
                style={{
                  width: 52, height: 52, borderRadius: 13, border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: sel ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                  outline: sel ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.12s',
                }}>
                <div style={{
                  width: dotPx, height: dotPx, borderRadius: '50%',
                  background: sel ? state.annotateColor : 'rgba(255,255,255,0.5)',
                  boxShadow: sel ? `0 0 10px ${state.annotateColor}88` : 'none',
                  transition: 'all 0.12s',
                }} />
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                  color: sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                }}>{sz}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Floating shapes popup ──────────────────────────────── */}
      {annotatePopup === 'shapes' && annotatePopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(annotatePopupAnchor.x, 230, -115),
          top: clampT(annotatePopupAnchor.y - 230),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 8,
          width: safeW(230),
          maxHeight: 'min(350px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 }}>Forma</div>
          <div className="ps-responsive-list" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {ANNOTATE_SHAPES.map(sh => {
              const sel = currentShapeItem.id === sh.id;
              return (
                <button key={sh.id}
                  onClick={() => {
                    updateState({
                      annotateShape: sh.id,
                      annotateTool: sh.id === 'arrow' ? 'arrow' : 'rect',
                      annotateMode: true,
                    });
                    setAnnotatePopup(null);
                  }}
                  style={{
                    width: 64, height: 64, borderRadius: 14, border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: sel ? `${state.annotateColor}22` : 'rgba(255,255,255,0.07)',
                    outline: sel ? `2px solid ${state.annotateColor}` : '1px solid rgba(255,255,255,0.1)',
                    color: sel ? state.annotateColor : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.12s',
                  }}>
                  {sh.icon}
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: sel ? state.annotateColor : 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>{sh.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
};
