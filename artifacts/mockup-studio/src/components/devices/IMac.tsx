import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

export function IMac() {
  const W = 460;
  const H = 300;
  const bezelTop = 16;
  const bezelSide = 10;
  const bezelBottom = 30;
  const screenW = W - bezelSide * 2;
  const screenH = H - bezelTop - bezelBottom;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
      {/* Monitor body */}
      <div
        style={{
          width: W, height: H, position: 'relative', borderRadius: 16,
          background: 'linear-gradient(170deg, #f0f0f0 0%, #e2e2e2 40%, #d4d4d4 100%)',
          border: '1.5px solid #c0c0c0',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.1)',
        }}
      >
        {/* Front face highlight */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'linear-gradient(160deg, rgba(255,255,255,0.5) 0%, transparent 50%)', pointerEvents: 'none' }} />

        {/* Screen area */}
        <div
          style={{
            position: 'absolute', top: bezelTop, left: bezelSide,
            width: screenW, height: screenH, borderRadius: 6, overflow: 'hidden',
            background: '#080810', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)',
          }}
        >
          <ScreenContent accentColor="#60a5fa" iconBg="rgba(59,130,246,0.15)" />
        </div>

        {/* Chin dot */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.15)' }} />
      </div>

      {/* Stand neck */}
      <div
        style={{
          width: 14, height: 54,
          background: 'linear-gradient(90deg, #c0c0c0 0%, #e8e8e8 40%, #d0d0d0 100%)',
          borderRadius: '0 0 4px 4px', boxShadow: '1px 0 3px rgba(0,0,0,0.1)', position: 'relative', zIndex: 1,
        }}
      />

      {/* Base */}
      <div
        style={{
          width: 130, height: 14,
          background: 'linear-gradient(180deg, #d8d8d8 0%, #c0c0c0 100%)',
          borderRadius: '0 0 80px 80px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  );
}
