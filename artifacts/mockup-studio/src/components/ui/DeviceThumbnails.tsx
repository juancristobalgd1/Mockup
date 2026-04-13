import * as React from 'react';
import { getModelById } from '../../data/devices';

// ── Device thumbnail ──────────────────────────────────────────────
export function DeviceThumbnail({ modelId, isSelected }: { modelId: string; isSelected: boolean }) {
  const def = getModelById(modelId);
  if (!def) return null;
  const isPhone   = def.storeType === 'iphone' || def.storeType === 'android';
  const isTablet  = def.storeType === 'ipad';
  const isWatch   = def.storeType === 'watch';
  const isMac     = def.storeType === 'macbook';
  const isBrowser = def.storeType === 'browser';

  const accent = isSelected ? 'rgba(255,255,255,0.85)' : (def.accent ?? 'rgba(255,255,255,0.35)');
  const body   = isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';

  if (isPhone) {
    const r = def.storeType === 'android' ? 6 : 8;
    return (
      <svg width="24" height="40" viewBox="0 0 28 46" fill="none">
        <rect x="1" y="1" width="26" height="44" rx={r} fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        {def.camera === 'dynamic-island' ? <rect x="9" y="4" width="10" height="3" rx="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'punch-hole' ? <circle cx="14" cy="5.5" r="1.5" fill={accent} opacity="0.8" />
          : def.camera === 'notch' ? <rect x="7" y="0" width="14" height="4" rx="2" fill={body} stroke={accent} strokeWidth="1" />
          : null}
        <rect x="4" y="9" width="20" height="30" rx="2" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <rect x="27" y="14" width="2" height="8" rx="1" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isTablet) {
    return (
      <svg width="30" height="40" viewBox="0 0 36 46" fill="none">
        <rect x="1" y="1" width="34" height="44" rx="4" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="7" width="28" height="32" rx="2" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <circle cx="18" cy="42" r="2" fill={accent} opacity="0.6" />
      </svg>
    );
  }
  if (isWatch) {
    return (
      <svg width="24" height="34" viewBox="0 0 28 38" fill="none">
        <rect x="8" y="0" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="8" y="33" width="12" height="5" rx="2" fill={accent} opacity="0.4" />
        <rect x="1" y="6" width="26" height="26" rx="8" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="4" y="9" width="20" height="20" rx="6" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
      </svg>
    );
  }
  if (isMac) {
    return (
      <svg width="40" height="30" viewBox="0 0 44 36" fill="none">
        <rect x="4" y="1" width="36" height="24" rx="2" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="7" y="4" width="30" height="18" rx="1" fill={isSelected ? 'rgba(55,65,81,0.15)' : 'rgba(0,0,0,0.04)'} />
        <rect x="1" y="25" width="42" height="5" rx="1.5" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
      </svg>
    );
  }
  if (isBrowser) {
    return (
      <svg width="40" height="28" viewBox="0 0 44 30" fill="none">
        <rect x="1" y="1" width="42" height="28" rx="3" fill={body} stroke={accent} strokeWidth={isSelected ? 1.5 : 1} />
        <rect x="1" y="1" width="42" height="8" rx="3" fill={accent} opacity="0.18" />
        <rect x="4" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.5" />
        <rect x="10" y="3.5" width="4" height="3" rx="1.5" fill={accent} opacity="0.3" />
        <rect x="4" y="11" width="36" height="16" rx="1" fill={isSelected ? 'rgba(55,65,81,0.12)' : 'rgba(0,0,0,0.03)'} />
      </svg>
    );
  }
  return null;
}

// ── Rotato pose thumbnail ──────────────────────────────────────────
export function PoseThumbnail({ ry, rx, rz, active, mini }: {
  ry: number; rx: number; rz: number; active: boolean; mini?: boolean;
}) {
  const bodyColor   = active ? '#d0d0d0' : '#484848';
  const screenColor = active ? '#ffffff' : '#111111';
  const frameColor  = active ? '#b0b0b0' : '#333333';

  const s = mini ? 0.5 : 1;

  return (
    <div style={{
      width: 52 * s, height: 80 * s,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: 180 * s,
    }}>
      <div style={{
        width: 22 * s, height: 46 * s,
        transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg)`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
      }}>
        {/* Phone body */}
        <div style={{
          width: '100%', height: '100%',
          background: bodyColor,
          borderRadius: 5 * s,
          boxShadow: active
            ? `${3*s}px ${6*s}px ${20*s}px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(255,255,255,0.3)`
            : `${2*s}px ${4*s}px ${10*s}px rgba(0,0,0,0.7)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}>
          {/* Screen */}
          <div style={{
            width: '74%', height: '78%',
            background: screenColor,
            borderRadius: 2 * s,
            transition: 'background 0.3s',
          }} />
          {/* Dynamic island notch */}
          <div style={{
            position: 'absolute', top: 2 * s, left: '50%', transform: 'translateX(-50%)',
            width: 8 * s, height: 2 * s, borderRadius: 1 * s,
            background: frameColor,
            transition: 'background 0.3s',
          }} />
        </div>
        {/* Side button */}
        <div style={{
          position: 'absolute', right: -1 * s, top: '28%',
          width: 1.5 * s, height: 8 * s, borderRadius: 1 * s,
          background: frameColor,
          transition: 'background 0.3s',
        }} />
      </div>
    </div>
  );
}
