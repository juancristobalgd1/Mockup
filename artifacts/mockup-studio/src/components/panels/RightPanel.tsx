import { useState } from 'react';
import { Download, Copy, Image, Check, Video, Film, Info } from 'lucide-react';
import { useApp } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';

interface RightPanelProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  viewerRef?: React.RefObject<Device3DViewerHandle | null>;
  textOverlays: import('../../store').TextOverlay[];
  onUpdateText: (id: string, updates: Partial<import('../../store').TextOverlay>) => void;
  onRemoveText: (id: string) => void;
}

type ExportSizeOption = { id: string; label: string; platform: string; w: number; h: number };

const EXPORT_SIZES: ExportSizeOption[] = [
  { id: 'ig-post',  label: 'Post',    platform: 'Instagram', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Story',   platform: 'Instagram', w: 1080, h: 1920 },
  { id: 'ig-port',  label: 'Portrait',platform: 'Instagram', w: 1080, h: 1350 },
  { id: 'twitter',  label: 'Card',    platform: 'X / Twitter', w: 1200, h: 675  },
  { id: 'linkedin', label: 'Post',    platform: 'LinkedIn',  w: 1200, h: 628  },
  { id: 'wide',     label: 'Wide',    platform: 'YouTube / Slides', w: 1920, h: 1080 },
];

async function captureCanvas(el: HTMLDivElement, glEl?: HTMLCanvasElement | null) {
  const html2canvas = (await import('html2canvas')).default;

  const bgCanvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: null,
    width: el.offsetWidth,
    height: el.offsetHeight,
    ignoreElements: (element) => element.tagName === 'CANVAS',
  });

  if (glEl) {
    const out = document.createElement('canvas');
    out.width = bgCanvas.width;
    out.height = bgCanvas.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(glEl, 0, 0, out.width, out.height);
    return out;
  }
  return bgCanvas;
}

function downloadBlob(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function RightPanel({ canvasRef, viewerRef, textOverlays, onUpdateText, onRemoveText }: RightPanelProps) {
  const { state } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedSize, setSelectedSize] = useState('ig-post');

  const isVideo = state.contentType === 'video';

  const handleDownloadPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const glEl = viewerRef?.current?.getGLElement() ?? null;
      const canvas = await captureCanvas(canvasRef.current, glEl);
      downloadBlob(canvas.toDataURL('image/png'), `mockup-${Date.now()}.png`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!state.videoUrl) return;
    downloadBlob(state.videoUrl, `mockup-video-${Date.now()}.mp4`);
  };

  const handleRecordWebM = async () => {
    if (!canvasRef.current) return;
    setRecording(true);
    try {
      const DURATION_MS = 4000;
      const el = canvasRef.current;
      const rect = el.getBoundingClientRect();
      const offscreen = document.createElement('canvas');
      offscreen.width = rect.width * 2;
      offscreen.height = rect.height * 2;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const stream = offscreen.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.start(100);
      const startTime = Date.now();

      const html2canvas = (await import('html2canvas')).default;
      const drawLoop = async () => {
        if (Date.now() - startTime < DURATION_MS) {
          const snap = await html2canvas(el, { useCORS: true, allowTaint: true, scale: 2, backgroundColor: null });
          ctx.clearRect(0, 0, offscreen.width, offscreen.height);
          ctx.drawImage(snap, 0, 0);
          requestAnimationFrame(drawLoop);
        } else {
          recorder.stop();
        }
      };
      drawLoop();

      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      const blob = new Blob(chunks, { type: 'video/webm' });
      downloadBlob(URL.createObjectURL(blob), `mockup-animated-${Date.now()}.webm`);
    } catch (err) {
      console.error('Record failed', err);
    } finally {
      setRecording(false);
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    setCopying(true);
    try {
      const canvas = await captureCanvas(canvasRef.current);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
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
    <div className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#6b7280', letterSpacing: '0.08em' }}>
      {children}
    </div>
  );

  return (
    <div className="right-panel flex flex-col h-full"
      style={{ width: 220, background: '#ffffff', borderLeft: '1px solid #e5e7eb', flexShrink: 0 }}>

      {/* Header */}
      <div className="px-4 py-3.5 flex-shrink-0 flex items-center gap-2"
        style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Download size={14} style={{ color: '#374151' }} />
        <span className="text-sm font-bold" style={{ color: '#111827' }}>Export</span>
        {isVideo && (
          <span className="ml-auto flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.08)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}>
            <Video size={9} /> Video
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 styled-scroll">

        {/* Format indicator */}
        <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5"
          style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          {isVideo
            ? <Film size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
            : <Image size={14} style={{ color: '#374151', flexShrink: 0, marginTop: 1 }} />}
          <div>
            <p className="text-xs font-semibold" style={{ color: isVideo ? '#16a34a' : '#374151' }}>
              {isVideo ? 'Video mode' : 'Image mode'}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
              {isVideo ? 'Export as WebM or download original MP4' : 'Export as PNG or copy to clipboard'}
            </p>
          </div>
        </div>

        {/* Size (PNG only) */}
        {!isVideo && (
          <>
            <SectionLabel>Export Size</SectionLabel>
            <div className="flex flex-col gap-1.5 mb-4">
              {EXPORT_SIZES.map(s => (
                <button key={s.id} data-testid={`export-size-${s.id}`}
                  onClick={() => setSelectedSize(s.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all"
                  style={{
                    background: selectedSize === s.id ? '#f3f4f6' : '#ffffff',
                    border: selectedSize === s.id ? '1px solid #9ca3af' : '1px solid #e5e7eb',
                  }}>
                  <div className="flex flex-col">
                    <span className="text-[10px]" style={{ color: selectedSize === s.id ? '#374151' : '#6b7280' }}>
                      {s.platform}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: selectedSize === s.id ? '#111827' : '#9ca3af' }}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>
                    {s.w}×{s.h}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Primary export button */}
        {isVideo ? (
          <div className="flex flex-col gap-2 mb-4">
            {/* Download original video */}
            <button
              onClick={handleDownloadVideo}
              disabled={!state.videoUrl}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(22,163,74,0.2)',
                cursor: state.videoUrl ? 'pointer' : 'not-allowed',
                opacity: state.videoUrl ? 1 : 0.5,
              }}>
              <Download size={14} />
              Download Video
            </button>

            {/* Record animated WebM */}
            <button
              onClick={handleRecordWebM}
              disabled={recording}
              data-testid="export-video"
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                color: '#374151',
                cursor: recording ? 'not-allowed' : 'pointer',
              }}>
              <Film size={13} />
              {recording ? 'Recording 4s...' : 'Record Scene (WebM)'}
            </button>

            {/* Snapshot PNG of video frame */}
            <button
              onClick={handleDownloadPNG}
              disabled={exporting}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                cursor: exporting ? 'not-allowed' : 'pointer',
              }}>
              <Image size={13} />
              {exporting ? 'Capturing...' : 'Snapshot as PNG'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            <button
              data-testid="export-png"
              onClick={handleDownloadPNG}
              disabled={exporting}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: exporting ? '#e5e7eb' : '#374151',
                color: exporting ? '#9ca3af' : '#fff',
                boxShadow: exporting ? 'none' : '0 2px 8px rgba(55,65,81,0.2)',
                cursor: exporting ? 'not-allowed' : 'pointer',
              }}>
              <Download size={14} />
              {exporting ? 'Exporting...' : 'Download PNG'}
            </button>

            <button
              data-testid="copy-clipboard"
              onClick={handleCopy}
              disabled={copying || copied}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: copied ? 'rgba(22,163,74,0.08)' : '#f9fafb',
                color: copied ? '#16a34a' : '#6b7280',
                border: copied ? '1px solid rgba(22,163,74,0.25)' : '1px solid #e5e7eb',
                cursor: copying ? 'not-allowed' : 'pointer',
              }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : copying ? 'Copying...' : 'Copy to Clipboard'}
            </button>
          </div>
        )}

        {/* Text overlays */}
        {textOverlays.length > 0 && (
          <div className="mb-4">
            <SectionLabel>Text Layers ({textOverlays.length})</SectionLabel>
            <div className="flex flex-col gap-2">
              {textOverlays.map(overlay => (
                <div key={overlay.id} className="rounded-xl p-3"
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <input type="text" value={overlay.text}
                    onChange={e => onUpdateText(overlay.id, { text: e.target.value })}
                    className="w-full bg-transparent text-xs mb-2 outline-none"
                    style={{ color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: 4 }}
                    data-testid={`text-input-${overlay.id}`} />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>Size</span>
                    <input type="range" min={10} max={80} value={overlay.fontSize}
                      onChange={e => onUpdateText(overlay.id, { fontSize: Number(e.target.value) })}
                      className="flex-1 ms-range" />
                    <span className="text-[10px] font-mono" style={{ color: '#9ca3af' }}>{overlay.fontSize}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px]" style={{ color: '#6b7280' }}>Color</span>
                    <input type="color" value={overlay.color}
                      onChange={e => onUpdateText(overlay.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0" />
                    <button onClick={() => onUpdateText(overlay.id, { isBold: !overlay.isBold })}
                      className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                      style={{ background: overlay.isBold ? '#374151' : '#f3f4f6', color: overlay.isBold ? '#ffffff' : '#6b7280', border: '1px solid #e5e7eb' }}>B</button>
                    <button onClick={() => onUpdateText(overlay.id, { isItalic: !overlay.isItalic })}
                      className="w-6 h-6 rounded text-xs italic flex items-center justify-center"
                      style={{ background: overlay.isItalic ? '#374151' : '#f3f4f6', color: overlay.isItalic ? '#ffffff' : '#6b7280', border: '1px solid #e5e7eb' }}>I</button>
                  </div>
                  <button onClick={() => onRemoveText(overlay.id)}
                    data-testid={`remove-text-${overlay.id}`}
                    className="text-[10px] transition-colors hover:text-red-500"
                    style={{ color: '#9ca3af' }}>
                    Remove layer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2 mb-2">
            <Info size={11} style={{ color: '#9ca3af' }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Tips</span>
          </div>
          <ul className="text-[10px] space-y-1" style={{ color: '#9ca3af' }}>
            <li>Drop image/video on device screen</li>
            <li>Paste a URL to capture screenshot</li>
            <li>Drag text overlays on canvas</li>
            <li>Record Scene exports animated WebM</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
