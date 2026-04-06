import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function AppleWatch() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

  const W = 175;
  const H = 210;

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Watch strap top */}
      <div
        style={{
          position: 'absolute',
          top: -48,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 60,
          background: 'linear-gradient(180deg, #1a1a1a 0%, #222 100%)',
          borderRadius: '6px 6px 0 0',
        }}
      />

      {/* Watch body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '36%',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1c1c1e 60%, #111 100%)',
          border: '1.5px solid #3a3a3a',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 ${state.shadowIntensity * 0.4}px ${state.shadowIntensity}px rgba(0,0,0,${state.shadowIntensity * 0.01})`,
        }}
      />

      {/* Crown */}
      <div
        style={{
          position: 'absolute',
          right: -6,
          top: '38%',
          width: 6,
          height: 22,
          background: '#2a2a2a',
          borderRadius: '0 3px 3px 0',
          border: '1px solid #444',
          borderLeft: 'none',
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          borderRadius: '30%',
          overflow: 'hidden',
          background: state.screenshotUrl ? 'transparent' : '#0a0a12',
          cursor: 'pointer',
        }}
        onClick={() => !state.screenshotUrl && fileRef.current?.click()}
      >
        {state.screenshotUrl ? (
          <div className="relative w-full h-full group" onClick={() => fileRef.current?.click()}>
            <img src={state.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[9px] font-medium bg-black/50 px-2 py-1 rounded-full">Replace</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.2)' }}>
              <Upload size={12} style={{ color: '#fb7185' }} />
            </div>
            <span className="text-[9px]" style={{ color: '#6b7280' }}>Upload</span>
          </div>
        )}
      </div>

      {/* Gloss */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '36%',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Watch strap bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: -48,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 60,
          background: 'linear-gradient(180deg, #222 0%, #1a1a1a 100%)',
          borderRadius: '0 0 6px 6px',
        }}
      />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
