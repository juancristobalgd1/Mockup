import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';
import { getModelById } from '../../data/devices';

export function TabletDevice() {
  const { state } = useApp();
  const def = getModelById(state.deviceModel);
  const isLandscape = state.deviceLandscape;

  const W = isLandscape ? def.h : def.w;
  const H = isLandscape ? def.w : def.h;

  const insetTop    = isLandscape ? def.insetSide : def.insetTop;
  const insetBottom = isLandscape ? def.insetSide : def.insetBottom;
  const insetLeft   = isLandscape ? def.insetBottom : def.insetSide;
  const insetRight  = isLandscape ? def.insetTop : def.insetSide;

  const bodyBg = 'linear-gradient(145deg, #2e2e2e 0%, #1c1c1e 60%, #0f0f10 100%)';
  const bodyBorder = '#3a3a3a';

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: def.br,
        background: bodyBg, border: `1.5px solid ${bodyBorder}`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
      }} />

      {/* Camera */}
      <div style={{
        position: 'absolute',
        ...(isLandscape
          ? { right: Math.round(def.insetSide * 0.55), top: '50%', transform: 'translateY(-50%)' }
          : { top: Math.round(def.insetTop * 0.55), left: '50%', transform: 'translateX(-50%)' }),
        width: 7, height: 7, background: '#1a1a1e', borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.12)', zIndex: 10,
      }} />

      {/* Home button indicator (for older iPads) */}
      {def.insetBottom > 30 && (
        <div style={{
          position: 'absolute',
          ...(isLandscape
            ? { left: Math.round(insetLeft * 0.55), top: '50%', transform: 'translateY(-50%)' }
            : { bottom: Math.round(insetBottom * 0.55), left: '50%', transform: 'translateX(-50%)' }),
          width: 26, height: 26, background: 'rgba(255,255,255,0.07)', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)', zIndex: 5,
        }} />
      )}

      {/* Side button */}
      {!isLandscape && (
        <div style={{ position: 'absolute', right: -3, top: Math.round(H * 0.27), width: 3, height: Math.round(H * 0.1), background: '#333', borderRadius: '0 2px 2px 0' }} />
      )}

      {/* Screen */}
      <div style={{
        position: 'absolute',
        top: insetTop, left: insetLeft, right: insetRight, bottom: insetBottom,
        borderRadius: def.screenBr, overflow: 'hidden', background: '#0a0a12',
      }}>
        <ScreenContent accentColor="#38bdf8" iconBg="rgba(14,165,233,0.2)" />
      </div>

      {/* Gloss */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: def.br,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
