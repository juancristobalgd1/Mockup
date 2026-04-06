import { useApp } from '../../store';
import { ScreenContent } from './ScreenContent';

export function AppleWatch() {
  const { state } = useApp();

  const W = 175;
  const H = 210;

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Watch strap top */}
      <div
        style={{
          position: 'absolute', top: -48, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 60,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #222 100%)',
          borderRadius: '6px 6px 0 0',
        }}
      />

      {/* Watch body */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: '36%',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1c1c1e 60%, #111 100%)',
          border: '1.5px solid #3a3a3a',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08)`,
        }}
      />

      {/* Crown */}
      <div
        style={{
          position: 'absolute', right: -6, top: '38%', width: 6, height: 22,
          background: '#2a2a2a', borderRadius: '0 3px 3px 0',
          border: '1px solid #444', borderLeft: 'none',
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
          borderRadius: '30%', overflow: 'hidden', background: '#0a0a12',
        }}
      >
        <ScreenContent accentColor="#fb7185" iconBg="rgba(244,63,94,0.2)" />
      </div>

      {/* Gloss */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: '36%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Watch strap bottom */}
      <div
        style={{
          position: 'absolute', bottom: -48, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 60,
          background: 'linear-gradient(180deg, #222 0%, #1a1a1a 100%)',
          borderRadius: '0 0 6px 6px',
        }}
      />
    </div>
  );
}
