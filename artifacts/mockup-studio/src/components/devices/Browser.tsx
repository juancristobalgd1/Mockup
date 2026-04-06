import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { useApp } from '../../store';

export function Browser() {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const isDark = state.browserMode === 'dark';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateState({ screenshotUrl: URL.createObjectURL(file) });
  };

  const W = 540;
  const H = 360;
  const chromeH = 46;

  const chrome = isDark
    ? { bar: 'linear-gradient(180deg, #2a2a2e 0%, #222226 100%)', border: '#3a3a3a', body: '#1a1a1e', urlBg: 'rgba(255,255,255,0.05)', urlBorder: 'rgba(255,255,255,0.08)', tabText: '#9ca3af', urlText: '#6b7280', tabActive: '#1a1a1e', tabBorder: '#3a3a3a' }
    : { bar: 'linear-gradient(180deg, #f0f0f0 0%, #e4e4e4 100%)', border: '#d0d0d0', body: '#ffffff', urlBg: 'rgba(0,0,0,0.04)', urlBorder: 'rgba(0,0,0,0.12)', tabText: '#374151', urlText: '#4b5563', tabActive: '#ffffff', tabBorder: '#d0d0d0' };

  return (
    <div
      style={{
        width: W,
        height: H,
        position: 'relative',
        flexShrink: 0,
        borderRadius: 10,
        overflow: 'hidden',
        background: chrome.body,
        border: `1.5px solid ${chrome.border}`,
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          width: '100%',
          height: chromeH,
          background: chrome.bar,
          borderBottom: `1px solid ${chrome.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>

        {/* Active tab */}
        <div
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: '6px 6px 0 0',
            background: chrome.tabActive,
            border: `1px solid ${chrome.tabBorder}`,
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            fontSize: 11,
            color: chrome.tabText,
            whiteSpace: 'nowrap',
            maxWidth: 140,
            overflow: 'hidden',
            gap: 6,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(139,92,246,0.5)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>My App — Dashboard</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* URL bar */}
        <div
          style={{
            flex: 3,
            height: 26,
            borderRadius: 6,
            background: chrome.urlBg,
            border: `1px solid ${chrome.urlBorder}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: 6,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: chrome.urlText, userSelect: 'none' }}>myapp.com/dashboard</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Action icons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }} />
          ))}
        </div>
      </div>

      {/* Page content */}
      <div
        style={{
          flex: 1,
          height: H - chromeH,
          overflow: 'hidden',
          background: state.screenshotUrl ? 'transparent' : (isDark ? '#080810' : '#f8fafc'),
          cursor: 'pointer',
          position: 'relative',
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
            <span className="text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>Upload screenshot</span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
