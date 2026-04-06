import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function IMac() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

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
          width: W,
          height: H,
          position: 'relative',
          borderRadius: 16,
          background: 'linear-gradient(170deg, #f0f0f0 0%, #e2e2e2 40%, #d4d4d4 100%)',
          border: '1.5px solid #c0c0c0',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.1)',
        }}
      >
        {/* Front face highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen area */}
        <div
          style={{
            position: 'absolute',
            top: bezelTop,
            left: bezelSide,
            width: screenW,
            height: screenH,
            borderRadius: 6,
            overflow: 'hidden',
            background: state.screenshotUrl ? 'transparent' : '#080810',
            cursor: 'pointer',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.3)',
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
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Upload size={18} style={{ color: '#60a5fa' }} />
              </div>
              <span className="text-xs" style={{ color: '#6b7280' }}>Upload screenshot</span>
            </div>
          )}
        </div>

        {/* Chin with subtle Apple-style logo dot */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {/* Stand neck */}
      <div
        style={{
          width: 14,
          height: 54,
          background: 'linear-gradient(90deg, #c0c0c0 0%, #e8e8e8 40%, #d0d0d0 100%)',
          borderRadius: '0 0 4px 4px',
          boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* Base */}
      <div
        style={{
          width: 130,
          height: 14,
          background: 'linear-gradient(180deg, #d8d8d8 0%, #c0c0c0 100%)',
          borderRadius: '0 0 80px 80px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
