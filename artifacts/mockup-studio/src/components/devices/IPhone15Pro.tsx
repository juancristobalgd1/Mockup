import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

const COLOR_FRAMES: Record<string, { body: string; border: string; button: string }> = {
  titanium: {
    body: 'linear-gradient(145deg, #3a3a3a 0%, #1e1e1e 50%, #111 100%)',
    border: '#4a4a4a',
    button: '#3a3a3a',
  },
  black: {
    body: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 50%, #050505 100%)',
    border: '#2a2a2a',
    button: '#1a1a1a',
  },
  white: {
    body: 'linear-gradient(145deg, #d8d8d8 0%, #c4c4c4 50%, #b0b0b0 100%)',
    border: '#b8b8b8',
    button: '#c8c8c8',
  },
  blue: {
    body: 'linear-gradient(145deg, #2a3f6f 0%, #1a2f5f 50%, #0f1e40 100%)',
    border: '#3a5080',
    button: '#2a3f6f',
  },
};

export function IPhone15Pro() {
  const { state } = useApp();
  const isLandscape = state.deviceLandscape;
  const frame = COLOR_FRAMES[state.deviceColor] ?? COLOR_FRAMES.titanium;

  const W = isLandscape ? 430 : 220;
  const H = isLandscape ? 220 : 430;
  const BR = isLandscape ? '2.2rem' : '2.8rem';

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Main body */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: BR,
          background: frame.body,
          border: `1.5px solid ${frame.border}`,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      />
      {/* Frame highlight */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: BR, background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)', pointerEvents: 'none' }} />

      {/* Side buttons portrait */}
      {!isLandscape && (
        <>
          <div style={{ position: 'absolute', left: -3, top: 96, width: 3, height: 32, background: frame.button, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: 140, width: 3, height: 32, background: frame.button, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', left: -3, top: 68, width: 3, height: 20, background: frame.button, borderRadius: '2px 0 0 2px' }} />
          <div style={{ position: 'absolute', right: -3, top: 104, width: 3, height: 56, background: frame.button, borderRadius: '0 2px 2px 0' }} />
        </>
      )}
      {isLandscape && (
        <>
          <div style={{ position: 'absolute', top: -3, left: 80, height: 3, width: 28, background: frame.button, borderRadius: '2px 2px 0 0' }} />
          <div style={{ position: 'absolute', top: -3, left: 120, height: 3, width: 28, background: frame.button, borderRadius: '2px 2px 0 0' }} />
          <div style={{ position: 'absolute', top: -3, left: 58, height: 3, width: 16, background: frame.button, borderRadius: '2px 2px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -3, right: 80, height: 3, width: 48, background: frame.button, borderRadius: '0 0 2px 2px' }} />
        </>
      )}

      {/* Screen */}
      <div
        style={{
          position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
          borderRadius: isLandscape ? '1.8rem' : '2.2rem',
          overflow: 'hidden',
          background: '#0a0a12',
        }}
        data-testid="iphone-screen"
      >
        <ScreenContent accentColor="#374151" iconBg="rgba(55,65,81,0.1)" />

        {/* Dynamic island */}
        {!isLandscape && (
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 82, height: 20, background: '#000', borderRadius: 10, zIndex: 10, pointerEvents: 'none' }} />
        )}
        {isLandscape && (
          <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 10, width: 16, height: 42, background: '#000', borderRadius: 8, zIndex: 10, pointerEvents: 'none' }} />
        )}
      </div>
    </div>
  );
}
