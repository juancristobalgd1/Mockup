import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Image, Check, Video, Film, ChevronDown } from 'lucide-react';
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
    useCORS: true, allowTaint: true, scale: 2, backgroundColor: null,
    width: el.offsetWidth, height: el.offsetHeight,
    ignoreElements: (element) => element.tagName === 'CANVAS',
  });
  if (glEl) {
    const out = document.createElement('canvas');
    out.width = bgCanvas.width; out.height = bgCanvas.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(bgCanvas, 0, 0);
    ctx.drawImage(glEl, 0, 0, out.width, out.height);
    return out;
  }
  return bgCanvas;
}

function downloadBlob(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
}

// ── Font-size slider with rAF throttle ───────────────────────────
function FontSizeSlider({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(value);
  const isDragging = useRef(false);
  const pending = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => { if (!isDragging.current) setLocal(value); }, [value]);

  const scheduleFlush = (v: number) => {
    pending.current = v;
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(() => {
        if (pending.current !== null) { onCommit(pending.current); pending.current = null; }
        rafId.current = 0;
      });
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 28 }}>Size</span>
      <input type="range" min={10} max={80} value={local}
        className="flex-1 ms-range"
        onChange={e => { const v = Number(e.target.value); setLocal(v); scheduleFlush(v); }}
        onPointerDown={() => { isDragging.current = true; }}
        onPointerUp={e => {
          isDragging.current = false;
          if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
          pending.current = null;
          onCommit(Number(e.currentTarget.value));
        }}
      />
      <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)', minWidth: 20 }}>{local}</span>
    </div>
  );
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '9px 0', cursor: 'pointer', border: 'none',
      background: 'transparent', borderBottom: `1px solid rgba(255,255,255,0.065)`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
        {label}
      </span>
      <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.28)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
    </button>
  );
}

export function RightPanel({ canvasRef, viewerRef, textOverlays, onUpdateText, onRemoveText }: RightPanelProps) {
  const { state } = useApp();
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [selectedSize, setSelectedSize] = useState('ig-post');
  const [showSize, setShowSize] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  const isVideo = state.contentType === 'video';

  const handleDownloadPNG = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const glEl = viewerRef?.current?.getGLElement() ?? null;
      const canvas = await captureCanvas(canvasRef.current, glEl);
      downloadBlob(canvas.toDataURL('image/png'), `mockup-${Date.now()}.png`);
    } catch (err) { console.error('Export failed', err); }
    finally { setExporting(false); }
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
      offscreen.width = rect.width * 2; offscreen.height = rect.height * 2;
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
        } else { recorder.stop(); }
      };
      drawLoop();
      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      const blob = new Blob(chunks, { type: 'video/webm' });
      downloadBlob(URL.createObjectURL(blob), `mockup-animated-${Date.now()}.webm`);
    } catch (err) { console.error('Record failed', err); }
    finally { setRecording(false); }
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
    } catch (err) { console.error('Copy failed', err); }
    finally { setCopying(false); }
  };

  return (
    <div className="right-panel flex flex-col h-full"
      style={{ width: 210, background: 'var(--rt-panel)', borderLeft: '1px solid var(--rt-border)', flexShrink: 0 }}>

      {/* Header */}
      <div style={{
        padding: '11px 14px 9px', flexShrink: 0,
        borderBottom: '1px solid var(--rt-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>Export</span>
        {isVideo && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 20,
            background: 'rgba(48,209,88,0.12)', color: 'var(--rt-accent-green)',
            border: '1px solid rgba(48,209,88,0.2)',
          }}>Video</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto styled-scroll" style={{ padding: '12px 14px 20px' }}>

        {/* Primary export buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {isVideo ? (
            <>
              <button data-testid="export-video"
                onClick={handleDownloadVideo}
                disabled={!state.videoUrl}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: state.videoUrl ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)',
                  color: state.videoUrl ? '#0d0e0f' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: state.videoUrl ? 'pointer' : 'not-allowed',
                }}>
                <Download size={13} />
                Download Video
              </button>
              <button
                onClick={handleRecordWebM}
                disabled={recording}
                style={{
                  width: '100%', padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.60)', cursor: recording ? 'not-allowed' : 'pointer',
                }}>
                <Film size={12} />
                {recording ? 'Recording 4s…' : 'Record Scene (WebM)'}
              </button>
              <button
                onClick={handleDownloadPNG}
                disabled={exporting}
                style={{
                  width: '100%', padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.38)', cursor: exporting ? 'not-allowed' : 'pointer',
                }}>
                <Image size={12} />
                {exporting ? 'Capturing…' : 'Snapshot as PNG'}
              </button>
            </>
          ) : (
            <>
              <button data-testid="export-png"
                onClick={handleDownloadPNG}
                disabled={exporting}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: exporting ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                  color: exporting ? 'rgba(255,255,255,0.3)' : '#0d0e0f',
                  border: 'none',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                }}>
                <Download size={13} />
                {exporting ? 'Exporting…' : 'Download PNG'}
              </button>
              <button data-testid="copy-clipboard"
                onClick={handleCopy}
                disabled={copying || copied}
                style={{
                  width: '100%', padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: copied ? 'rgba(48,209,88,0.10)' : 'rgba(255,255,255,0.06)',
                  border: copied ? '1px solid rgba(48,209,88,0.2)' : '1px solid rgba(255,255,255,0.09)',
                  color: copied ? 'var(--rt-accent-green)' : 'rgba(255,255,255,0.55)',
                  cursor: copying ? 'not-allowed' : 'pointer',
                }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : copying ? 'Copying…' : 'Copy to Clipboard'}
              </button>
            </>
          )}
        </div>

        {/* Export size — collapsible */}
        {!isVideo && (
          <>
            <SectionHeader label="Export Size" open={showSize} onToggle={() => setShowSize(!showSize)} />
            {showSize && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, marginBottom: 12 }}>
                {EXPORT_SIZES.map(s => (
                  <button key={s.id} data-testid={`export-size-${s.id}`}
                    onClick={() => setSelectedSize(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: selectedSize === s.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                      transition: 'background 0.12s',
                    }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)' }}>{s.platform}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: selectedSize === s.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.50)' }}>
                        {s.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.25)' }}>
                      {s.w}×{s.h}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Text layers — collapsible */}
        {textOverlays.length > 0 && (
          <>
            <SectionHeader label={`Text Layers (${textOverlays.length})`} open={showLayers} onToggle={() => setShowLayers(!showLayers)} />
            {showLayers && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, marginBottom: 12 }}>
                {textOverlays.map(overlay => (
                  <div key={overlay.id}
                    style={{ borderRadius: 10, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <input type="text" value={overlay.text}
                      onChange={e => onUpdateText(overlay.id, { text: e.target.value })}
                      className="rt-input w-full"
                      style={{ marginBottom: 8 }}
                      data-testid={`text-input-${overlay.id}`} />
                    <FontSizeSlider
                      value={overlay.fontSize}
                      onCommit={v => onUpdateText(overlay.id, { fontSize: v })}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 28 }}>Color</span>
                      <input type="color" value={overlay.color}
                        onChange={e => onUpdateText(overlay.id, { color: e.target.value })}
                        style={{ width: 22, height: 22, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'none' }} />
                      <button onClick={() => onUpdateText(overlay.id, { isBold: !overlay.isBold })}
                        style={{
                          width: 22, height: 22, borderRadius: 5, fontSize: 11, fontWeight: 900,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: overlay.isBold ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                          color: overlay.isBold ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                        }}>B</button>
                      <button onClick={() => onUpdateText(overlay.id, { isItalic: !overlay.isItalic })}
                        style={{
                          width: 22, height: 22, borderRadius: 5, fontSize: 11, fontStyle: 'italic',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: overlay.isItalic ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                          color: overlay.isItalic ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                        }}>I</button>
                      <button onClick={() => onRemoveText(overlay.id)}
                        data-testid={`remove-text-${overlay.id}`}
                        style={{
                          marginLeft: 'auto', fontSize: 10, color: 'rgba(255,69,58,0.7)',
                          background: 'none', border: 'none', cursor: 'pointer',
                        }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tips */}
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', lineHeight: 1.7 }}>
            Drop image/video on the device screen. Paste a URL to capture a screenshot. Drag text overlays on canvas.
          </p>
        </div>
      </div>
    </div>
  );
}
