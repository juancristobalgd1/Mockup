import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

export function IPad() {
  const { state } = useApp();
  const isLandscape = state.deviceLandscape;

  const W = isLandscape ? 480 : 320;
  const H = isLandscape ? 320 : 480;

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: '1.5rem',
          background: 'linear-gradient(145deg, #2e2e2e 0%, #1c1c1e 60%, #0f0f10 100%)',
          border: '1.5px solid #3a3a3a',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      />

      {/* Side button */}
      {!isLandscape && (
        <div style={{ position: 'absolute', right: -3, top: 130, width: 3, height: 44, background: '#333', borderRadius: '0 2px 2px 0' }} />
      )}
      {isLandscape && (
        <div style={{ position: 'absolute', top: -3, right: 130, height: 3, width: 44, background: '#333', borderRadius: '2px 2px 0 0' }} />
      )}

      {/* Home button indicator */}
      <div
        style={{
          position: 'absolute',
          ...(isLandscape
            ? { left: 20, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28 }
            : { bottom: 20, left: '50%', transform: 'translateX(-50%)', width: 28, height: 28 }),
          background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)', zIndex: 5,
        }}
      />

      {/* Camera */}
      <div
        style={{
          position: 'absolute',
          ...(isLandscape
            ? { right: 20, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8 }
            : { top: 18, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8 }),
          background: '#1a1a1e', borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)', zIndex: 10,
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          top: isLandscape ? 14 : 52, left: isLandscape ? 52 : 14,
          right: isLandscape ? 52 : 14, bottom: isLandscape ? 14 : 56,
          borderRadius: '0.8rem', overflow: 'hidden', background: '#0a0a12',
        }}
      >
        <ScreenContent accentColor="#38bdf8" iconBg="rgba(14,165,233,0.2)" />
      </div>
    </div>
  );
}
