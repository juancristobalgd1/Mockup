import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../store';
import { Section, Slider } from '../../ui/PanelUI';
import { PoseThumbnail } from '../../ui/DeviceThumbnails';
import { PRESENT_POSES } from '../../../data/panelConstants';
import { clampL, safeW } from '../../../utils/panelUtils';

export const PresetsTab = () => {
  const { state, updateState } = useApp();

  const [presentsPopupOpen, setPresentsPopupOpen] = useState(false);
  const [presentsPopupAnchor, setPresentsPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const presentsPopupRef = useRef<HTMLDivElement>(null);
  const presentsBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (presentsPopupOpen && presentsPopupRef.current && !presentsPopupRef.current.contains(e.target as Node)
        && presentsBtnRef.current && !presentsBtnRef.current.contains(e.target as Node)) {
        setPresentsPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [presentsPopupOpen]);

  const activePose = PRESENT_POSES.find(p => p.id === state.cameraAngle) ?? PRESENT_POSES[0];
  const scalePct   = state.deviceScale ?? 100;

  return (
    <>
      {/* ── Scale popup ─────────────────────────────────── */}
      {presentsPopupOpen && presentsPopupAnchor && (
        <div ref={presentsPopupRef} style={{
          position: 'fixed',
          left: clampL(presentsPopupAnchor.x, 262, -130),
          bottom: window.innerHeight - presentsPopupAnchor.y + 8,
          width: safeW(262),
          maxHeight: 'min(400px, calc(100vh - 80px))',
          overflowY: 'auto',
          background: 'rgba(18,20,26,0.98)',
          borderRadius: 18, padding: '14px 16px', zIndex: 9999,
          boxShadow: '0 8px 40px rgba(0,0,0,0.80)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(22px)',
        }}>
          {/* Active pose preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <PoseThumbnail ry={activePose.ry} rx={activePose.rx} rz={activePose.rz} active={true} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Scale</div>
          <Slider label="Scale" value={scalePct} min={40} max={160} step={5}
            onChange={v => updateState({ deviceScale: v })} unit="%" />
        </div>
      )}

      {/* ── Compact row: poses chips + scale button ──────── */}
      <Section label="Presents">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>

          {/* Scrollable pose chips */}
          <div style={{
            flex: 1, display: 'flex', gap: 5, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {PRESENT_POSES.map(pose => {
              const active = state.cameraAngle === pose.id;
              return (
                <button key={pose.id}
                  onClick={() => updateState({ cameraAngle: pose.id, cameraResetKey: (state.cameraResetKey ?? 0) + 1 })}
                  style={{
                    flexShrink: 0, padding: '5px 14px 4px', borderRadius: 11, border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    background: active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.5)',
                    outline: active ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.14)',
                    color: active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.12s',
                  }}>
                  <PoseThumbnail ry={pose.ry} rx={pose.rx} rz={pose.rz} active={active} mini />
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {pose.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

          {/* Scale indicator button */}
          <button
            ref={presentsBtnRef}
            onClick={() => {
              if (presentsPopupOpen) { setPresentsPopupOpen(false); return; }
              const r = presentsBtnRef.current?.getBoundingClientRect();
              if (r) setPresentsPopupAnchor({ x: r.left + r.width / 2, y: r.top });
              setPresentsPopupOpen(true);
            }}
            style={{
              flexShrink: 0, padding: '5px 9px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: presentsPopupOpen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)',
              outline: presentsPopupOpen ? '1.5px solid rgba(167,139,250,0.8)' : '1px solid rgba(255,255,255,0.12)',
              color: presentsPopupOpen ? 'rgba(167,139,250,1)' : 'rgba(255,255,255,0.55)',
              fontSize: 10, fontWeight: 700, transition: 'all 0.14s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 21l-6-6m6 6v-4m0 4h-4M3 3l6 6M3 3v4m0-4h4"/>
            </svg>
            {scalePct}%
          </button>
        </div>
      </Section>
    </>
  );
};
