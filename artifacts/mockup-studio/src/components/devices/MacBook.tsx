import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function MacBook() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

  const W = 520;
  const screenH = 320;
  const baseH = 28;

  return (
    <div style={{ width: W, position: 'relative', flexShrink: 0 }}>
      {/* Lid / screen portion */}
      <div
        style={{
          width: W,
          height: screenH,
          position: 'relative',
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1c1c1e 60%, #111 100%)',
          border: '1.5px solid #3a3a3a',
          borderBottom: 'none',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 ${state.shadowIntensity * 0.6}px ${state.shadowIntensity * 1.5}px rgba(0,0,0,${state.shadowIntensity * 0.012})`,
        }}
      >
        {/* Screen bezel */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            right: 18,
            bottom: 10,
            borderRadius: '6px',
            overflow: 'hidden',
            background: state.screenshotUrl ? 'transparent' : '#080810',
            cursor: 'pointer',
          }}
          onClick={() => !state.screenshotUrl && fileRef.current?.click()}
        >
          {state.screenshotUrl ? (
            <div className="relative w-full h-full group" onClick={() => fileRef.current?.click()}>
              <img src={state.screenshotUrl} alt="Screenshot" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Replace</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(250,204,21,0.2)' }}>
                <Upload size={18} style={{ color: '#facc15' }} />
              </div>
              <span className="text-xs" style={{ color: '#6b7280' }}>Upload screenshot</span>
            </div>
          )}
        </div>

        {/* Webcam */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            background: '#1a1a1e',
            borderRadius: '50%',
            border: '0.5px solid rgba(255,255,255,0.15)',
          }}
        />

        {/* Gloss overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px 12px 0 0',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Hinge */}
      <div
        style={{
          width: W + 4,
          height: 4,
          marginLeft: -2,
          background: 'linear-gradient(180deg, #222 0%, #333 100%)',
          borderRadius: '0 0 2px 2px',
        }}
      />

      {/* Base */}
      <div
        style={{
          width: W + 20,
          height: baseH,
          marginLeft: -10,
          position: 'relative',
          borderRadius: '0 0 8px 8px',
          background: 'linear-gradient(180deg, #252525 0%, #1e1e1e 100%)',
          border: '1.5px solid #3a3a3a',
          borderTop: 'none',
        }}
      >
        {/* Trackpad */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 90,
            height: 16,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
