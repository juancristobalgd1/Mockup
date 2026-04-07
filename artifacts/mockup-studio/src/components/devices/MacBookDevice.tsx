import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';
import { getModelById } from '../../data/devices';

export function MacBookDevice() {
  const { state } = useApp();
  const def = getModelById(state.deviceModel);
  const W = def.w;
  const screenH = def.h;
  const baseH = 28;
  const isMacBookPro = state.deviceModel === 'macbook-pro-16';

  const bodyGradient = isMacBookPro
    ? 'linear-gradient(145deg, #282828 0%, #1c1c1e 60%, #111 100%)'
    : 'linear-gradient(145deg, #e8e4da 0%, #d4cfc5 60%, #c8c4ba 100%)';

  const bodyBorder = isMacBookPro ? '#3a3a3a' : '#b8b4aa';
  const baseBg = isMacBookPro
    ? 'linear-gradient(180deg, #252525 0%, #1e1e1e 100%)'
    : 'linear-gradient(180deg, #dcd8ce 0%, #ccc8be 100%)';
  const baseBorder = isMacBookPro ? '#3a3a3a' : '#b4b0a8';

  return (
    <div style={{ width: W, position: 'relative', flexShrink: 0 }}>
      {/* Lid */}
      <div style={{
        width: W, height: screenH, position: 'relative',
        borderRadius: '10px 10px 0 0',
        background: bodyGradient,
        border: `1.5px solid ${bodyBorder}`, borderBottom: 'none',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>
        {/* Screen bezel */}
        <div style={{
          position: 'absolute', top: def.insetTop, left: def.insetSide, right: def.insetSide, bottom: def.insetBottom,
          borderRadius: def.screenBr, overflow: 'hidden', background: '#080810',
        }}>
          <ScreenContent accentColor="#facc15" iconBg="rgba(250,204,21,0.2)" />
          {/* Notch for MacBook Pro 16 */}
          {isMacBookPro && (
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 100, height: 18, background: bodyGradient, borderRadius: '0 0 10px 10px',
              zIndex: 10, pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Webcam */}
        <div style={{
          position: 'absolute', top: def.insetTop * 0.45, left: '50%', transform: 'translateX(-50%)',
          width: 7, height: 7, background: isMacBookPro ? '#1a1a1e' : '#d4cfc5', borderRadius: '50%',
          border: '0.5px solid rgba(255,255,255,0.15)',
        }} />

        {/* Gloss */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '10px 10px 0 0',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 55%)', pointerEvents: 'none',
        }} />
      </div>

      {/* Hinge */}
      <div style={{ width: W + 4, height: 4, marginLeft: -2, background: 'linear-gradient(180deg, #222 0%, #333 100%)', borderRadius: '0 0 2px 2px' }} />

      {/* Base */}
      <div style={{
        width: W + 20, height: baseH, marginLeft: -10, position: 'relative',
        borderRadius: '0 0 8px 8px', background: baseBg, border: `1.5px solid ${baseBorder}`, borderTop: 'none',
      }}>
        {/* Trackpad */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          width: 90, height: 16, background: isMacBookPro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
          borderRadius: 4, border: `1px solid ${isMacBookPro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
        }} />
      </div>
    </div>
  );
}
