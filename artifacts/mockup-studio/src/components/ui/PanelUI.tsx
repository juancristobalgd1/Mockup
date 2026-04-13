import * as React from 'react';
import { useState, useRef, useEffect, memo } from 'react';
import { LABEL_SHADOW } from '../../data/panelConstants';

// ── Horizontal-scroll strip ───────────────────────────────────────
export const HScroll = ({ children, gap = 8 }: { children: React.ReactNode; gap?: number }) => (
  <div className="hscroll-strip" style={{
    gap, paddingBottom: 2,
  } as React.CSSProperties}>
    {children}
  </div>
);

// ── Compact section row ───────────────────────────────────────────
export const Section = ({ label, children, action }: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.62)',
        textShadow: LABEL_SHADOW,
      }}>
        {label}
      </span>
      {action}
    </div>
    {children}
  </div>
);

// ── Chip button (horizontal pill) ─────────────────────────────────
export const Chip = ({ active, onClick, children, style }: {
  active: boolean; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties;
}) => (
  <button
    onClick={onClick}
    style={{
      flexShrink: 0, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.45)',
      border: active ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.18)',
      color: active ? '#0d0e0f' : 'rgba(255,255,255,0.82)',
      cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap', ...style,
    }}
  >
    {children}
  </button>
);

// ── Toggle switch ─────────────────────────────────────────────────
export const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button onClick={onToggle}
    style={{
      position: 'relative', width: 36, height: 20, borderRadius: 10, flexShrink: 0,
      background: enabled ? 'rgba(48,209,88,0.55)' : 'rgba(255,255,255,0.12)',
      border: 'none', cursor: 'pointer', transition: 'background 0.2s',
    }}>
    <div style={{
      position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%',
      background: enabled ? '#fff' : 'rgba(255,255,255,0.6)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.5)', transition: 'left 0.18s',
      left: enabled ? 18 : 2,
    }} />
  </button>
);

// ── Slider ────────────────────────────────────────────────────────
export const Slider = memo(function Slider({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const [local, setLocal] = useState(value);
  const isDragging  = useRef(false);
  const pending     = useRef<number | null>(null);
  const rafId       = useRef<number>(0);

  useEffect(() => {
    if (!isDragging.current) setLocal(value);
  }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onChange(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocal(v);
    scheduleFlush(v);
  };

  const handlePointerDown = () => { isDragging.current = true; };

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
    pending.current = null;
    onChange(Number(e.currentTarget.value));
  };

  const display = Number.isInteger(step) ? String(local) : local.toFixed(2);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', fontVariantNumeric: 'tabular-nums' }}>
          {display}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={local}
        className="ms-range w-full"
        aria-label={label}
        onChange={handleChange}
        onPointerDown={(e) => {
          handlePointerDown();
          if ('vibrate' in navigator) navigator.vibrate(2);
        }}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
});

// ── MiniSlider — compact 2-column variant of Slider ──────────────
export const MiniSlider = memo(function MiniSlider({ label, value, min, max, step = 1, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const [local, setLocal] = useState(value);
  const isDragging = useRef(false);
  const pending    = useRef<number | null>(null);
  const rafId      = useRef<number>(0);

  useEffect(() => { if (!isDragging.current) setLocal(value); }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onChange(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value); setLocal(v); scheduleFlush(v);
  };
  const handlePointerDown = () => { isDragging.current = true; };
  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
    pending.current = null;
    onChange(Number(e.currentTarget.value));
  };

  const display = Number.isInteger(step) ? String(local) : local.toFixed(2);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.38)' }}>{label}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.52)', fontVariantNumeric: 'tabular-nums' }}>{display}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={local}
        className="ms-range w-full"
        aria-label={label}
        onChange={handleChange}
        onPointerDown={(e) => {
          handlePointerDown();
          if ('vibrate' in navigator) navigator.vibrate(2);
        }}
        onPointerUp={handlePointerUp} />
    </div>
  );
});
