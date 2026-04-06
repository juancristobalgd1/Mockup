import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function IPad() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const isLandscape = state.deviceLandscape;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

  const W = isLandscape ? 480 : 320;
  const H = isLandscape ? 320 : 480;

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '1.5rem',
          background: 'linear-gradient(145deg, #2e2e2e 0%, #1c1c1e 60%, #0f0f10 100%)',
          border: '1.5px solid #3a3a3a',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 ${state.shadowIntensity * 0.5}px ${state.shadowIntensity}px rgba(0,0,0,${state.shadowIntensity * 0.01})`,
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
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          zIndex: 5,
        }}
      />

      {/* Camera */}
      <div
        style={{
          position: 'absolute',
          ...(isLandscape
            ? { right: 20, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8 }
            : { top: 18, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8 }),
          background: '#1a1a1e',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 10,
        }}
      />

      {/* Screen */}
      <div
        style={{
          position: 'absolute',
          top: isLandscape ? 14 : 52,
          left: isLandscape ? 52 : 14,
          right: isLandscape ? 52 : 14,
          bottom: isLandscape ? 14 : 56,
          borderRadius: '0.8rem',
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
              <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Replace</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.2)' }}>
              <Upload size={18} style={{ color: '#38bdf8' }} />
            </div>
            <span className="text-xs" style={{ color: '#6b7280' }}>Upload screenshot</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
