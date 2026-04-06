import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function AndroidPhone() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const isLandscape = state.deviceLandscape;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

  const W = isLandscape ? 440 : 210;
  const H = isLandscape ? 210 : 440;
  const BR = '1.8rem';

  return (
    <div style={{ width: W, height: H, position: 'relative', flexShrink: 0 }}>
      {/* Body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: BR,
          background: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 60%, #0f0f0f 100%)',
          border: '1.5px solid #404040',
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 ${state.shadowIntensity * 0.6}px ${state.shadowIntensity * 1.2}px rgba(0,0,0,${state.shadowIntensity * 0.01})`,
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
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          bottom: 10,
          borderRadius: '1.4rem',
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
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.2)' }}>
              <Upload size={16} style={{ color: '#4ade80' }} />
            </div>
            <span className="text-xs" style={{ color: '#6b7280' }}>Upload screenshot</span>
          </div>
        )}

        {/* Punch hole camera */}
        {!isLandscape && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 12,
              background: '#000',
              borderRadius: '50%',
              zIndex: 10,
            }}
          />
        )}
      </div>

      {/* Bottom bar */}
      {!isLandscape && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            zIndex: 5,
          }}
        />
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
