import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../store';
import { Section } from '../../ui/PanelUI';
import { LIGHT_OVERLAYS } from '../../../data/lightOverlays';
import { clampL, clampT, safeW } from '../../../utils/panelUtils';

const OVERLAY_COLOR_GRID = [
  '#ffffff', '#aaaaaa', '#666666', '#333333', '#000000',
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '__custom__',
];
const OVERLAY_OPACITY_PRESETS = [5, 10, 15, 20, 30, 45, 60, 75, 90];

export const OverlayTab = () => {
  const { state, updateState } = useApp();

  const [overlayPopup, setOverlayPopup] = useState<null | 'color' | 'opacity' | 'light'>(null);
  const [overlayPopupAnchor, setOverlayPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const overlayPopupRef = useRef<HTMLDivElement>(null);
  const overlayColorBtnRef = useRef<HTMLButtonElement>(null);
  const overlayOpacityBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (overlayPopup && overlayPopupRef.current && !overlayPopupRef.current.contains(e.target as Node)) {
        setOverlayPopup(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [overlayPopup]);

  return (
    <div ref={overlayPopupRef} style={{ position: 'relative' }}>

      {/* ── Floating overlay color popup ──────────────────────── */}
      {overlayPopup === 'color' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 215),
          background: 'rgba(22,24,28,0.98)', borderRadius: 18,
          padding: 14, zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75), 0 2px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
          maxHeight: 'min(400px, calc(100vh - 16px))',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {OVERLAY_COLOR_GRID.map(col => {
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
                    <input type="color" value={state.overlayColor}
                      onChange={e => updateState({ overlayColor: e.target.value })}
                      style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                  </div>
                );
              }
              const sel = state.overlayColor === col;
              return (
                <button key={col}
                  onClick={() => { updateState({ overlayColor: col }); setOverlayPopup(null); }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: col, flexShrink: 0,
                    outline: sel ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.08)',
                    outlineOffset: sel ? '2px' : '0px',
                    boxShadow: sel ? `0 0 14px ${col}88` : '0 1px 4px rgba(0,0,0,0.4)',
                    transform: sel ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.12s',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating overlay opacity popup ────────────────────── */}
      {overlayPopup === 'opacity' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 180),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
        }}>
          <div style={{ marginBottom: 10 }}>
            <input type="range" min={0} max={90} value={state.overlayOpacity}
              onChange={e => updateState({ overlayOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: state.overlayColor }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>0%</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{state.overlayOpacity}%</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>90%</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {OVERLAY_OPACITY_PRESETS.map(v => {
              const sel = state.overlayOpacity === v;
              return (
                <button key={v}
                  onClick={() => updateState({ overlayOpacity: v })}
                  style={{
                    padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: sel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)',
                    outline: sel ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.1)',
                    color: sel ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.5)',
                    fontSize: 11, fontWeight: 700, transition: 'all 0.12s',
                  }}>
                  {v}%
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Floating light overlay controls popup ──────────────── */}
      {overlayPopup === 'light' && overlayPopupAnchor && (
        <div style={{
          position: 'fixed',
          left: clampL(overlayPopupAnchor.x, 220, -110),
          top: clampT(overlayPopupAnchor.y - 190),
          background: 'rgba(22,24,28,0.98)', borderRadius: 16,
          padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          width: safeW(220),
        }}>
          {/* Preset name */}
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0,
              background: '#fff',
            }}>
              {(() => {
                const p = LIGHT_OVERLAYS.find(x => x.id === state.lightOverlay);
                return p ? (
                  <div style={{
                    width: '100%', height: '100%',
                    backgroundImage: p.background, backgroundSize: 'cover',
                    filter: p.filter,
                  }} />
                ) : null;
              })()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
              {LIGHT_OVERLAYS.find(x => x.id === state.lightOverlay)?.label ?? 'Overlay'}
            </span>
          </div>

          {/* Opacity slider */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Opacidad</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{state.lightOverlayOpacity}%</span>
            </div>
            <input type="range" min={0} max={100} value={state.lightOverlayOpacity}
              onChange={e => updateState({ lightOverlayOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#a78bfa' }}
            />
          </div>

          {/* Blend mode */}
          {!state.lightOverlayBgOnly && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>Modo de fusión</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(['multiply', 'overlay', 'screen', 'soft-light'] as const).map(mode => {
                  const sel = state.lightOverlayBlend === mode;
                  return (
                    <button key={mode}
                      onClick={() => updateState({ lightOverlayBlend: mode })}
                      style={{
                        padding: '4px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: sel ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)',
                        outline: sel ? '1.5px solid rgba(167,139,250,0.7)' : '1px solid rgba(255,255,255,0.1)',
                        color: sel ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                        fontSize: 11, fontWeight: 600, transition: 'all 0.12s',
                      }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solo fondo toggle */}
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
                background: state.lightOverlayBgOnly ? 'rgba(167,139,250,0.85)' : 'rgba(255,255,255,0.12)',
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
      )}

      {/* Combined Overlay row */}
      <Section label="Efectos">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>

          {/* Scrollable light preset thumbnails */}
          <div style={{
            flex: 1, display: 'flex', gap: 7, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {/* None */}
            <button
              onClick={() => { updateState({ lightOverlay: null }); setOverlayPopup(p => p === 'light' ? null : p); }}
              style={{
                flexShrink: 0, width: 46, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)',
                outline: !state.lightOverlay ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <line x1="4" y1="4" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Light presets */}
            {LIGHT_OVERLAYS.map(preset => {
              const active = state.lightOverlay === preset.id;
              const popupOpen = overlayPopup === 'light' && active;
              return (
                <button key={preset.id}
                  onClick={e => {
                    const r = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                    if (active && overlayPopup === 'light') { setOverlayPopup(null); }
                    else { updateState({ lightOverlay: preset.id }); setOverlayPopup('light'); }
                  }}
                  style={{
                    flexShrink: 0, width: 46, height: 46, borderRadius: 11, border: 'none', cursor: 'pointer',
                    overflow: 'hidden', position: 'relative',
                    outline: active ? '2px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.1)',
                    background: '#fff',
                    boxShadow: popupOpen ? '0 0 0 3px rgba(167,139,250,0.5)' : 'none',
                    transition: 'box-shadow 0.15s',
                  }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: preset.background, backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: preset.filter,
                  }} />
                  {active && <div style={{ position: 'absolute', inset: 0, borderRadius: 11, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)' }} />}
                  {popupOpen && (
                    <div style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Vertical separator */}
          <div style={{ width: 1, height: 38, background: 'rgba(255,255,255,0.13)', flexShrink: 0 }} />

          {/* Color overlay controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            opacity: state.overlayEnabled ? 1 : 0.45,
            transition: 'opacity 0.2s',
          }}>
            {/* Toggle pill */}
            <button
              onClick={() => updateState({ overlayEnabled: !state.overlayEnabled })}
              title={state.overlayEnabled ? 'Desactivar capa de color' : 'Activar capa de color'}
              style={{
                width: 32, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: state.overlayEnabled ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)',
                position: 'relative', transition: 'background 0.2s',
              }}>
              <div style={{
                position: 'absolute', top: 2, left: state.overlayEnabled ? 13 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: state.overlayEnabled ? '#111' : 'rgba(255,255,255,0.6)',
                transition: 'left 0.2s, background 0.2s',
              }} />
            </button>

            {/* Color circle */}
            <button
              ref={overlayColorBtnRef}
              onClick={() => {
                if (!state.overlayEnabled) updateState({ overlayEnabled: true });
                if (overlayPopup === 'color') { setOverlayPopup(null); return; }
                const r = overlayColorBtnRef.current?.getBoundingClientRect();
                if (r) setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setOverlayPopup('color');
              }}
              style={{
                width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: state.overlayColor,
                outline: overlayPopup === 'color' ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.22)',
                outlineOffset: '2px',
                boxShadow: `0 0 8px ${state.overlayColor}55`,
                transition: 'all 0.14s',
              }}
            />

            {/* Opacity button */}
            <button
              ref={overlayOpacityBtnRef}
              onClick={() => {
                if (!state.overlayEnabled) updateState({ overlayEnabled: true });
                if (overlayPopup === 'opacity') { setOverlayPopup(null); return; }
                const r = overlayOpacityBtnRef.current?.getBoundingClientRect();
                if (r) setOverlayPopupAnchor({ x: r.left + r.width / 2, y: r.top });
                setOverlayPopup('opacity');
              }}
              style={{
                width: 38, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: overlayPopup === 'opacity' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
                outline: overlayPopup === 'opacity' ? '1.5px solid rgba(255,255,255,0.7)' : '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
              }}>
              {state.overlayOpacity}%
            </button>
          </div>
        </div>

        {/* Subtle active-preset hint */}
        {state.lightOverlay && overlayPopup !== 'light' && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
              {state.lightOverlayOpacity}% · {state.lightOverlayBlend}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(167,139,250,0.45)', cursor: 'pointer' }}
              onClick={e => {
                const r = (e.currentTarget as HTMLSpanElement).getBoundingClientRect();
                setOverlayPopupAnchor({ x: r.left, y: r.top });
                setOverlayPopup('light');
              }}>Editar ›</span>
          </div>
        )}
      </Section>
    </div>
  );
};
