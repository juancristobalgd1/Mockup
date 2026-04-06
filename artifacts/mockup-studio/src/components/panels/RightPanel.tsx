import { useState } from 'react';
import { Download, Copy, Image, Check } from 'lucide-react';
import { useApp } from '../../store';

interface RightPanelProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  textOverlays: import('../../store').TextOverlay[];
  onUpdateText: (id: string, updates: Partial<import('../../store').TextOverlay>) => void;
  onRemoveText: (id: string) => void;
}

type ExportSizeOption = { id: string; label: string; w: number; h: number };

const EXPORT_SIZES: ExportSizeOption[] = [
  { id: '1:1', label: '1:1 Square', w: 1080, h: 1080 },
  { id: '4:5', label: '4:5 Portrait', w: 1080, h: 1350 },
  { id: '16:9', label: '16:9 Wide', w: 1920, h: 1080 },
  { id: '9:16', label: '9:16 Story', w: 1080, h: 1920 },
];

async function captureCanvas(el: HTMLDivElement) {
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: null,
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
}

export function RightPanel({ canvasRef, textOverlays, onUpdateText, onRemoveText }: RightPanelProps) {
  const { state } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSize, setSelectedSize] = useState('1:1');

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const canvas = await captureCanvas(canvasRef.current);
      const link = document.createElement('a');
      link.download = `mockup-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    setCopying(true);
    try {
      const canvas = await captureCanvas(canvasRef.current);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error('Copy failed', err);
    } finally {
      setCopying(false);
    }
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>
      {children}
    </div>
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{
        width: 220,
        background: 'rgba(10,12,22,0.92)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <Download size={14} style={{ color: '#a78bfa' }} />
          <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Export</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SectionLabel>Export Size</SectionLabel>
        <div className="flex flex-col gap-1.5 mb-5">
          {EXPORT_SIZES.map(s => (
            <button
              key={s.id}
              data-testid={`export-size-${s.id}`}
              onClick={() => setSelectedSize(s.id)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all"
              style={{
                background: selectedSize === s.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                border: selectedSize === s.id ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-xs font-medium" style={{ color: selectedSize === s.id ? '#c4b5fd' : '#6b7280' }}>
                {s.label}
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#4b5563' }}>
                {s.w}×{s.h}
              </span>
            </button>
          ))}
        </div>

        {/* Download PNG */}
        <button
          data-testid="export-png"
          onClick={handleDownload}
          disabled={exporting}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mb-2"
          style={{
            background: exporting
              ? 'rgba(124,58,237,0.3)'
              : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: exporting ? '#9ca3af' : '#fff',
            border: 'none',
            cursor: exporting ? 'not-allowed' : 'pointer',
            boxShadow: exporting ? 'none' : '0 4px 16px rgba(124,58,237,0.4)',
          }}
        >
          <Download size={15} />
          {exporting ? 'Exporting...' : 'Download PNG'}
        </button>

        {/* Copy to Clipboard */}
        <button
          data-testid="copy-clipboard"
          onClick={handleCopy}
          disabled={copying || copied}
          className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 mb-5"
          style={{
            background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
            color: copied ? '#4ade80' : '#9ca3af',
            border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
            cursor: copying ? 'not-allowed' : 'pointer',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : copying ? 'Copying...' : 'Copy to Clipboard'}
        </button>

        {/* Text overlays manager */}
        {textOverlays.length > 0 && (
          <div className="mb-4">
            <SectionLabel>Text Layers ({textOverlays.length})</SectionLabel>
            <div className="flex flex-col gap-2">
              {textOverlays.map(overlay => (
                <div
                  key={overlay.id}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <input
                    type="text"
                    value={overlay.text}
                    onChange={e => onUpdateText(overlay.id, { text: e.target.value })}
                    className="w-full bg-transparent text-xs mb-2 outline-none"
                    style={{ color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 4 }}
                    data-testid={`text-input-${overlay.id}`}
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>Size</span>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      value={overlay.fontSize}
                      onChange={e => onUpdateText(overlay.id, { fontSize: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-[10px] font-mono" style={{ color: '#4b5563' }}>{overlay.fontSize}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>Color</span>
                    <input
                      type="color"
                      value={overlay.color}
                      onChange={e => onUpdateText(overlay.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0"
                    />
                    <button
                      onClick={() => onUpdateText(overlay.id, { isBold: !overlay.isBold })}
                      className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                      style={{
                        background: overlay.isBold ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                        color: overlay.isBold ? '#c4b5fd' : '#6b7280',
                        border: '1px solid transparent',
                      }}
                    >B</button>
                    <button
                      onClick={() => onUpdateText(overlay.id, { isItalic: !overlay.isItalic })}
                      className="w-6 h-6 rounded text-xs italic flex items-center justify-center"
                      style={{
                        background: overlay.isItalic ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                        color: overlay.isItalic ? '#c4b5fd' : '#6b7280',
                        border: '1px solid transparent',
                      }}
                    >I</button>
                  </div>
                  <button
                    onClick={() => onRemoveText(overlay.id)}
                    data-testid={`remove-text-${overlay.id}`}
                    className="text-[10px] transition-colors hover:text-red-400"
                    style={{ color: '#4b5563' }}
                  >
                    Remove layer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Image size={12} style={{ color: '#6b7280' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#6b7280' }}>Tips</span>
          </div>
          <ul className="text-[10px] space-y-1" style={{ color: '#4b5563' }}>
            <li>Click device screen to upload</li>
            <li>Drag text overlays on canvas</li>
            <li>Shuffle picks a random background</li>
            <li>Canvas ratio shows export frame</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
