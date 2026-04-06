import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

export function MacBook() {
  const { state } = useApp();

  const W = 520;
  const screenH = 320;
  const baseH = 28;

  return (
    <div style={{ width: W, position: 'relative', flexShrink: 0 }}>
      {/* Lid / screen portion */}
      <div
        style={{
          width: W, height: screenH, position: 'relative',
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1c1c1e 60%, #111 100%)',
          border: '1.5px solid #3a3a3a', borderBottom: 'none',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06)`,
        }}
      >
        {/* Screen bezel */}
        <div
          style={{
            position: 'absolute', top: 14, left: 18, right: 18, bottom: 10,
            borderRadius: '6px', overflow: 'hidden', background: '#080810',
          }}
        >
          <ScreenContent accentColor="#facc15" iconBg="rgba(250,204,21,0.2)" />
        </div>

        {/* Webcam */}
        <div
          style={{
            position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)',
            width: 6, height: 6, background: '#1a1a1e', borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.15)',
          }}
        />

        {/* Gloss overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, borderRadius: '12px 12px 0 0',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Hinge */}
      <div style={{ width: W + 4, height: 4, marginLeft: -2, background: 'linear-gradient(180deg, #222 0%, #333 100%)', borderRadius: '0 0 2px 2px' }} />

      {/* Base */}
      <div
        style={{
          width: W + 20, height: baseH, marginLeft: -10, position: 'relative',
          borderRadius: '0 0 8px 8px',
          background: 'linear-gradient(180deg, #252525 0%, #1e1e1e 100%)',
          border: '1.5px solid #3a3a3a', borderTop: 'none',
        }}
      >
        {/* Trackpad */}
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: 90, height: 16, background: 'rgba(255,255,255,0.06)',
            borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>
    </div>
  );
}
