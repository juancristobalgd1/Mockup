import { useState, useRef, useEffect } from 'react';
import { Download, Copy, Image, Check, Video, Film, ChevronDown } from 'lucide-react';
import { useApp } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';
import { ANIMATED_BACKGROUNDS } from '../../data/backgrounds';
import type { AnimatedBackground } from '../../data/backgrounds';

// ── Animated background canvas drawing ───────────────────────────────────────

// Horizontal animation position (0–1) matching each CSS keyframe type
function animPosX(animStr: string, t: number): number {
  if (animStr.includes('bgShift2')) {
    if (t < 0.33) return t / 0.33;
    if (t < 0.66) return 1;
    return 1 - (t - 0.66) / 0.34;
  }
  if (animStr.includes('bgShift3')) {
    if (t < 0.25) return t / 0.25;
    if (t < 0.75) return 1;
    return 1 - (t - 0.75) / 0.25;
  }
  // bgShift or any unknown keyframe → smooth cosine oscillation
  return (1 - Math.cos(t * 2 * Math.PI)) / 2;
}

// Expand shorthand hex (#abc → #aabbcc)
function expandHex(hex: string): string {
  if (hex.length === 4) return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  return hex;
}
function hexToRgba(hex: string, alpha: number): string {
  const h = expandHex(hex).replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha.toFixed(3)})`;
}

// Main per-frame draw function — handles ALL AnimatedBackground types
function drawAnimatedBg(ctx: CanvasRenderingContext2D, bg: AnimatedBackground, elapsedMs: number, W: number, H: number) {
  const ts = elapsedMs / 1000; // seconds

  // ── iframe backgrounds (e.g. 3D Aura) → animated orbiting glows ──────────
  if (bg.type === 'iframe') {
    const thumbStr = typeof bg.thumb.background === 'string' ? bg.thumb.background : '';
    const colors = thumbStr.match(/#[0-9a-fA-F]{3,8}/g)?.map(expandHex) ?? ['#7c3aed', '#3b82f6', '#06b6d4', '#0f172a'];
    // Base fill (darkest color)
    ctx.fillStyle = colors[colors.length - 1];
    ctx.fillRect(0, 0, W, H);
    // Orbiting glow layers via 'screen' blend — creates beautiful 3D aura effect
    ctx.globalCompositeOperation = 'screen';
    const glows = [
      { x: 0.30 + 0.22 * Math.sin(ts * 0.47),        y: 0.28 + 0.18 * Math.cos(ts * 0.38),        r: 0.65, c: colors[0], a: 0.78 },
      { x: 0.68 + 0.18 * Math.cos(ts * 0.31),        y: 0.55 + 0.22 * Math.sin(ts * 0.55),        r: 0.58, c: colors[1], a: 0.68 },
      { x: 0.50 + 0.20 * Math.sin(ts * 0.63 + 1.2), y: 0.70 + 0.16 * Math.cos(ts * 0.42),        r: 0.50, c: colors[2] ?? colors[1], a: 0.58 },
    ];
    for (const g of glows) {
      const rg = ctx.createRadialGradient(g.x * W, g.y * H, 0, g.x * W, g.y * H, g.r * W);
      rg.addColorStop(0, hexToRgba(g.c, g.a));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  // ── CSS gradient backgrounds ──────────────────────────────────────────────
  const rawBg = bg.animStyle?.background;
  const bgCss = typeof rawBg === 'string' ? rawBg : (typeof bg.thumb.background === 'string' ? bg.thumb.background : '');
  const animStr = typeof bg.animStyle?.animation === 'string' ? bg.animStyle.animation : 'bgShift 12s';

  const periodMatch = animStr.match(/(\d+(?:\.\d+)?)s/);
  const period = periodMatch ? parseFloat(periodMatch[1]) : 12;
  const cycleT = (ts % period) / period;

  const posX = animPosX(animStr, cycleT);
  const posY = 0.5 + 0.07 * Math.sin(ts * 0.71); // gentle Y drift adds depth

  const colors = bgCss.match(/#[0-9a-fA-F]{3,8}/g)?.map(expandHex) ?? ['#111113', '#1e1b4b'];

  // Parse CSS angle (e.g. -45deg); convert to radians measured from canvas +Y axis
  const angleMatch = bgCss.match(/(-?\d+)deg/);
  const cssAngleDeg = angleMatch ? parseFloat(angleMatch[1]) : -45;
  const canvasAngleRad = (cssAngleDeg - 90) * Math.PI / 180;

  // Simulate background-size:400% 400% + background-position:X% Y%
  const bgW = W * 4;
  const bgH = H * 4;
  const xOff = posX * (bgW - W);
  const yOff = posY * (bgH - H);

  // Gradient axis through the center of the 4× tile (in canvas coords)
  const cx = bgW / 2 - xOff;
  const cy = bgH / 2 - yOff;
  const len = Math.sqrt(bgW * bgW + bgH * bgH) / 2;
  const gx1 = cx - Math.sin(canvasAngleRad) * len;
  const gy1 = cy + Math.cos(canvasAngleRad) * len;
  const gx2 = cx + Math.sin(canvasAngleRad) * len;
  const gy2 = cy - Math.cos(canvasAngleRad) * len;

  const gradient = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
  colors.forEach((c: string, i: number) => gradient.addColorStop(i / Math.max(colors.length - 1, 1), c));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Soft moving radial pulse — adds a "breathing" light source for excitement
  const pulseA = 0.05 + 0.04 * Math.sin(ts * 2.1);
  const px = W * (0.45 + 0.10 * Math.sin(ts * 0.33));
  const py = H * (0.40 + 0.10 * Math.cos(ts * 0.29));
  const pulse = ctx.createRadialGradient(px, py, 0, px, py, W * 0.72);
  pulse.addColorStop(0, `rgba(255,255,255,${pulseA.toFixed(3)})`);
  pulse.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pulse;
  ctx.fillRect(0, 0, W, H);
}

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
  const isMovieMode = state.creationMode === 'movie';

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
      const DURATION_MS = (state.movieDuration ?? 4) * 1000;
      const el = canvasRef.current;
      const glEl = viewerRef?.current?.getGLElement() ?? null;

      // 1. Determine output dimensions
      const W = el.offsetWidth || 800;
      const H = el.offsetHeight || 600;

      // 2. Check if background is animated — if so, draw it per-frame via canvas API
      const isAnimatedBg = state.bgType === 'animated';
      const animatedBg = isAnimatedBg
        ? (ANIMATED_BACKGROUNDS.find(b => b.id === state.bgAnimated) ?? ANIMATED_BACKGROUNDS[0])
        : null;

      // 3. For non-animated backgrounds, capture once with html2canvas
      let bgCanvas: HTMLCanvasElement | null = null;
      if (!isAnimatedBg) {
        try {
          const html2canvas = (await import('html2canvas')).default;
          const snap = await html2canvas(el, {
            useCORS: true, allowTaint: true, scale: 1, backgroundColor: null,
            width: W, height: H,
            ignoreElements: (element) => element.tagName === 'CANVAS',
          });
          if (snap.width > 0 && snap.height > 0) bgCanvas = snap;
        } catch { /* fall through — GL-only capture below */ }
      }

      // 4. Offscreen canvas → MediaRecorder stream
      const offscreen = document.createElement('canvas');
      offscreen.width = W; offscreen.height = H;
      const ctx = offscreen.getContext('2d')!;

      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder = new MediaRecorder(
        offscreen.captureStream(30),
        mimeType ? { mimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      // 5. Draw loop: animated bg drawn per-frame; static bg drawn once
      const startTs = performance.now();
      const drawLoop = (ts: number) => {
        const elapsed = ts - startTs;
        ctx.clearRect(0, 0, W, H);

        if (isAnimatedBg && animatedBg) {
          drawAnimatedBg(ctx, animatedBg, elapsed, W, H);
        } else if (bgCanvas) {
          ctx.drawImage(bgCanvas, 0, 0, W, H);
        }

        if (glEl && glEl.width > 0 && glEl.height > 0) {
          ctx.drawImage(glEl, 0, 0, W, H);
        }
        if (elapsed < DURATION_MS) {
          requestAnimationFrame(drawLoop);
        } else {
          recorder.stop();
        }
      };
      requestAnimationFrame(drawLoop);

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
          {isMovieMode ? (
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
                Descargar video
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
                {exporting ? 'Exporting…' : 'Descargar PNG'}
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
