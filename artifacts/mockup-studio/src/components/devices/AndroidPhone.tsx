import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

export function AndroidPhone() {
  const { state } = useApp();
  const isLandscape = state.deviceLandscape;

  const W = isLandscape ? 440 : 210;
  const H = isLandscape ? 210 : 440;
  const BR = '1.8rem';

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: BR,
          background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 60%, #0f0f0f 100%)',
          border: '1.5px solid #404040',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
        }}
      />

      {/* Side buttons */}
      {!isLandscape && (
        <>
          <div style={{ position: 'absolute', right: -3, top: 120, width: 3, height: 48, background: '#333', borderRadius: '0 2px 2px 0' }} />
          <div style={{ position: 'absolute', left: -3, top: 100, width: 3, height: 32, background: '#333', borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: 144, width: 3, height: 32, background: '#333', borderRadius: '2px 0 0 2px' }} />
        </>
      )}

      {/* Screen */}
      <div
        style={{
          position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
          borderRadius: '1.4rem', overflow: 'hidden', background: '#080810',
        }}
      >
        <ScreenContent accentColor="#4ade80" iconBg="rgba(34,197,94,0.2)" />

        {/* Punch hole camera */}
        {!isLandscape && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, background: '#000', borderRadius: '50%', zIndex: 10, pointerEvents: 'none' }} />
        )}
      </div>

      {/* Bottom bar */}
      {!isLandscape && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 80, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, zIndex: 5 }} />
      )}
    </div>
  );
}
