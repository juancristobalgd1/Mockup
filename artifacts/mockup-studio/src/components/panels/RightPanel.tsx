import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { Download, Copy, Image, Check, Video, Film, ChevronDown } from 'lucide-react';
import { useApp } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';
import { ANIMATED_BACKGROUNDS, GRADIENTS, MESH_GRADIENTS, WALLPAPERS, PATTERNS } from '../../data/backgrounds';
import type { AnimatedBackground } from '../../data/backgrounds';
import { LIGHT_OVERLAYS } from '../../data/lightOverlays';
import type { AppState } from '../../store';
import type { MovieTimelineHandle } from '../timeline/MovieTimeline';

// ── Background helpers ────────────────────────────────────────────────────────

/** Wait N animation frames — used to allow React state propagation before recording. */
function waitFrames(n: number): Promise<void> {
  return new Promise(resolve => {
    let count = 0;
    const tick = () => { if (++count >= n) resolve(); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}

/** Compute background CSS properties from store state (mirrors Canvas.tsx getBackground). */
function computeBgStyle(state: AppState): CSSProperties {
  const { bgType, bgColor, bgPattern, bgImage } = state;
  if (bgType === 'none') return { background: '#111113' };
  if (bgType === 'video') return { background: '#090b10' };
  if (bgType === 'transparent') return {
    backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    backgroundColor: '#1a1a1a',
  };
  if (bgType === 'solid') return { background: bgColor };
  if (bgType === 'gradient') {
    const g = GRADIENTS.find(g => g.id === bgColor);
    return { background: g ? g.css : GRADIENTS[0].css };
  }
  if (bgType === 'mesh') {
    const m = MESH_GRADIENTS.find(m => m.id === bgColor);
    return { background: m ? m.css : MESH_GRADIENTS[0].css };
  }
  if (bgType === 'pattern') {
    const p = PATTERNS.find(p => p.id === bgPattern);
    if (p) return p.bgStyle(bgColor);
    return { background: bgColor };
  }
  if (bgType === 'wallpaper') {
    const w = WALLPAPERS.find(w => w.id === bgColor);
    return { background: w ? w.css : GRADIENTS[0].css };
  }
  if (bgType === 'image' && bgImage) {
    return { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: GRADIENTS[0].css };
}

/**
 * Render a CSS background style onto an off-screen div and capture it
 * with html2canvas. Returns a canvas or null on failure.
 */
async function captureStyleToCanvas(style: CSSProperties, W: number, H: number): Promise<HTMLCanvasElement | null> {
  const div = document.createElement('div');
  div.style.width = `${W}px`;
  div.style.height = `${H}px`;
  div.style.position = 'fixed';
  div.style.left = '-99999px';
  div.style.top = '0';
  div.style.pointerEvents = 'none';
  div.style.zIndex = '-1';
  Object.assign(div.style, style);
  document.body.appendChild(div);
  try {
    const h2c = (await import('html2canvas')).default;
    const snap = await h2c(div, {
      useCORS: true, allowTaint: true, scale: 1,
      backgroundColor: null, width: W, height: H,
    });
    return snap.width > 0 && snap.height > 0 ? snap : null;
  } catch {
    return null;
  } finally {
    div.remove();
  }
}

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

  // ── canvas backgrounds → call their own render function directly ─────────
  if (bg.type === 'canvas' && bg.render) {
    bg.render(ctx, ts, W, H);
    return;
  }

  // ── iframe backgrounds (e.g. 3D Aura) → high-quality canvas approximation ──
  // Cross-origin iframes cannot be captured directly; we render a close visual
  // match using layered radial gradients with slow organic movement.
  if (bg.type === 'iframe') {
    // Parse accent colors from thumb; fall back to Aura palette
    const thumbStr = typeof bg.thumb.background === 'string' ? bg.thumb.background : '';
    const hexes = thumbStr.match(/#[0-9a-fA-F]{3,8}/g)?.map(expandHex) ?? [];
    const c0 = hexes[0] ?? '#7c3aed'; // purple
    const c1 = hexes[1] ?? '#3b82f6'; // blue
    const c2 = hexes[2] ?? '#06b6d4'; // cyan
    const base = hexes[hexes.length - 1] ?? '#0a0d1a';

    // Very dark base
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // Helper: draw one soft glow blob at (cx,cy) with radius r (in pixels)
    const drawBlob = (cx: number, cy: number, r: number, color: string, alpha: number) => {
      // Inner concentrated core
      const gCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.35);
      gCore.addColorStop(0, hexToRgba(color, alpha));
      gCore.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gCore;
      ctx.fillRect(0, 0, W, H);
      // Outer soft halo doubles the perceived size
      const gHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gHalo.addColorStop(0, hexToRgba(color, alpha * 0.45));
      gHalo.addColorStop(0.55, hexToRgba(color, alpha * 0.15));
      gHalo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gHalo;
      ctx.fillRect(0, 0, W, H);
    };

    // All glow layers composite via 'screen' — bright where blobs overlap
    ctx.globalCompositeOperation = 'screen';
    const S = Math.min(W, H);

    // Layer 1 – large purple blob, drifts slowly upper-left ↔ centre
    drawBlob(
      W * (0.28 + 0.14 * Math.sin(ts * 0.19)),
      H * (0.30 + 0.13 * Math.cos(ts * 0.15)),
      S * 0.72, c0, 0.82,
    );
    // Layer 2 – blue blob, upper-right, slight counter-drift
    drawBlob(
      W * (0.72 + 0.12 * Math.cos(ts * 0.23)),
      H * (0.22 + 0.14 * Math.sin(ts * 0.18)),
      S * 0.65, c1, 0.75,
    );
    // Layer 3 – cyan blob, lower-centre, slower drift
    drawBlob(
      W * (0.55 + 0.16 * Math.sin(ts * 0.27 + 1.1)),
      H * (0.74 + 0.10 * Math.cos(ts * 0.21)),
      S * 0.58, c2, 0.68,
    );
    // Layer 4 – secondary purple accent, centre, breathing scale
    drawBlob(
      W * (0.45 + 0.09 * Math.cos(ts * 0.34)),
      H * (0.48 + 0.09 * Math.sin(ts * 0.29)),
      S * (0.40 + 0.06 * Math.sin(ts * 0.41)), c0, 0.45,
    );
    // Layer 5 – tiny bright specular highlight — the "3D" glint
    drawBlob(
      W * (0.38 + 0.06 * Math.sin(ts * 0.53)),
      H * (0.28 + 0.06 * Math.cos(ts * 0.47)),
      S * 0.18, '#ffffff', 0.12,
    );

    ctx.globalCompositeOperation = 'source-over';

    // Subtle vignette darkens the very edges for depth
    const vignette = ctx.createRadialGradient(W / 2, H / 2, S * 0.28, W / 2, H / 2, S * 0.82);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
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
  movieTimelineRef?: React.RefObject<MovieTimelineHandle | null>;
  movieTimeRef?: React.MutableRefObject<number>;
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
    const bgVideoEl = el.querySelector('video[data-bg-video]') as HTMLVideoElement | null;
    if (bgVideoEl && bgVideoEl.videoWidth > 0 && bgVideoEl.videoHeight > 0) {
      ctx.drawImage(bgVideoEl, 0, 0, out.width, out.height);
    }
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

export function RightPanel({ canvasRef, viewerRef, movieTimelineRef, movieTimeRef, textOverlays, onUpdateText, onRemoveText }: RightPanelProps) {
  const { state } = useApp();
  // Ref that always holds the latest movieDuration — avoids stale-closure bugs
  // in async functions like handleRecordWebM that run across multiple renders.
  const movieDurationRef = useRef(state.movieDuration);
  movieDurationRef.current = state.movieDuration;
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);   // 0–100
  const [recordSecsLeft, setRecordSecsLeft] = useState(0);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedSize, setSelectedSize] = useState('ig-post');
  const [showSize, setShowSize] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Export quality settings
  const [exportScale, setExportScale] = useState<1|2|3>(2);    // 1×=native, 2×=2K, 3×=4K
  const [exportFps, setExportFps] = useState<30|60>(30);
  const [exportTransparent, setExportTransparent] = useState(false);

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
    // Read from ref — always the current duration even if state hasn't flushed yet
    const totalSecs = movieDurationRef.current ?? 4;
    const DURATION_MS = totalSecs * 1000;

    setRecording(true);
    setRecordProgress(0);
    setRecordSecsLeft(totalSecs);

    const recStart = performance.now();
    recordIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - recStart;
      setRecordProgress(Math.min(100, (elapsed / DURATION_MS) * 100));
      setRecordSecsLeft(Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000)));
    }, 100);

    const stopInterval = () => {
      if (recordIntervalRef.current) { clearInterval(recordIntervalRef.current); recordIntervalRef.current = null; }
    };

    try {
      const el = canvasRef.current;
      const glEl = viewerRef?.current?.getGLElement() ?? null;
      const timeline = movieTimelineRef?.current;
      const W = (el.offsetWidth || 800) * exportScale;
      const H = (el.offsetHeight || 600) * exportScale;

      // ── Timeline: stop any current playback, then start from t=0 ────
      // This handles the case where the user is mid-play or paused when
      // they click download — we always record from the beginning.
      if (timeline) {
        timeline.stopPlayback();
        timeline.resetTime();
        await waitFrames(2);
        timeline.startPlayback();
        await waitFrames(8);
      }

      // ── Pre-capture static layers (done once before the draw loop) ─
      const isAnimatedBg = state.bgType === 'animated';
      const isVideoBg = state.bgType === 'video' && !!state.bgVideo;
      const animatedBg = isAnimatedBg
        ? (ANIMATED_BACKGROUNDS.find(b => b.id === state.bgAnimated) ?? ANIMATED_BACKGROUNDS[0])
        : null;

      // 1. Static background (captured once; animated backgrounds are drawn per-frame)
      let bgCanvas: HTMLCanvasElement | null = null;
      if (!isAnimatedBg && !isVideoBg) {
        bgCanvas = await captureStyleToCanvas(computeBgStyle(state), W, H);
      }

      let bgVideoEl: HTMLVideoElement | null = null;
      if (isVideoBg && state.bgVideo) {
        bgVideoEl = document.createElement('video');
        bgVideoEl.src = state.bgVideo;
        bgVideoEl.muted = true;
        bgVideoEl.loop = true;
        bgVideoEl.playsInline = true;
        await new Promise<void>(resolve => {
          const onReady = () => {
            bgVideoEl?.removeEventListener('loadeddata', onReady);
            resolve();
          };
          bgVideoEl.addEventListener('loadeddata', onReady);
          void bgVideoEl.play().catch(() => resolve());
        });
      }

      // 2. Light overlay captured to canvas so we can drawImage it per-frame with blend mode
      let lightCanvas: HTMLCanvasElement | null = null;
      if (state.lightOverlay) {
        const preset = LIGHT_OVERLAYS.find(p => p.id === state.lightOverlay);
        if (preset) {
          lightCanvas = await captureStyleToCanvas({
            background: preset.background,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            ...(preset.filter ? { filter: preset.filter } : {}),
          } as CSSProperties, W, H);
        }
      }

      // 3. Annotation canvas (drawings on top of scene)
      const annotateEl = el.querySelector('canvas[data-annotate]') as HTMLCanvasElement | null;

      // ── Offscreen canvas + MediaRecorder ─────────────────────────
      const offscreen = document.createElement('canvas');
      offscreen.width = W; offscreen.height = H;
      const ctx = offscreen.getContext('2d')!;

      // 4. Film-grain noise pattern (SVG → offscreen canvas → tiled CanvasPattern)
      let grainPat: CanvasPattern | null = null;
      if (state.grain) {
        const svgStr = `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
        const grainImg = await new Promise<HTMLImageElement | null>(resolve => {
          const img = document.createElement('img') as HTMLImageElement;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
        });
        if (grainImg) {
          const gc = document.createElement('canvas');
          gc.width = 256; gc.height = 256;
          gc.getContext('2d')!.drawImage(grainImg, 0, 0, 256, 256);
          grainPat = ctx.createPattern(gc, 'repeat');
        }
      }

      // ── Sync animation clock exactly to recording start ───────────
      // All async prep above may take 200-500 ms. Reset the movie clock
      // now so that camera keyframe animation begins at t=0 when the
      // draw loop fires for the first time.
      if (timeline) timeline.resetTime();
      if (movieTimeRef) movieTimeRef.current = 0;

      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder = new MediaRecorder(
        offscreen.captureStream(exportFps),
        mimeType ? { mimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      // CSS mix-blend-mode → canvas globalCompositeOperation
      const toBlend = (m: string): GlobalCompositeOperation =>
        (m === 'normal' ? 'source-over' : m) as GlobalCompositeOperation;

      // ── Per-frame draw loop ───────────────────────────────────────
      const startTs = performance.now();
      const drawLoop = (ts: number) => {
        const elapsed = ts - startTs;

        // Sync the movie clock so live-preview HeroOrbitControls uses the same time
        if (movieTimeRef) movieTimeRef.current = elapsed / 1000;

        // Drive camera to the exact recording timestamp and re-render the WebGL
        // canvas synchronously — this guarantees every captured glEl frame shows
        // the device at exactly the right keyframe position regardless of rAF order.
        viewerRef?.current?.renderAt?.(elapsed / 1000);

        ctx.clearRect(0, 0, W, H);

        // Layer 1 — Background (skip when exporting transparent)
        if (!exportTransparent) {
          if (isAnimatedBg && animatedBg) {
            drawAnimatedBg(ctx, animatedBg, elapsed, W, H);
          } else if (bgVideoEl && bgVideoEl.videoWidth > 0 && bgVideoEl.videoHeight > 0) {
            if (Math.abs(bgVideoEl.currentTime - elapsed / 1000) > 0.08) bgVideoEl.currentTime = elapsed / 1000;
            ctx.drawImage(bgVideoEl, 0, 0, W, H);
          } else if (bgCanvas) {
            ctx.drawImage(bgCanvas, 0, 0, W, H);
          }
        }

        // Layer 2 — Vignette (radial dark edge, drawn directly)
        if (state.bgVignette) {
          const vi = (state.bgVignetteIntensity ?? 50) / 100;
          const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.sqrt(W * W + H * H) / 2);
          vig.addColorStop(0.35, 'rgba(0,0,0,0)');
          vig.addColorStop(1, `rgba(0,0,0,${vi.toFixed(3)})`);
          ctx.fillStyle = vig;
          ctx.fillRect(0, 0, W, H);
        }

        // Layer 3 — Color overlay (always behind device, zIndex 1)
        if (state.overlayEnabled) {
          ctx.save();
          ctx.globalAlpha = state.overlayOpacity / 100;
          ctx.fillStyle = state.overlayColor;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }

        // Layer 4 — Light overlay behind device (bgOnly mode)
        if (lightCanvas && state.lightOverlayBgOnly) {
          ctx.save();
          ctx.globalAlpha = state.lightOverlayOpacity / 100;
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(lightCanvas, 0, 0, W, H);
          ctx.restore();
        }

        // Layer 5 — Grain behind device (grainBgOnly mode)
        if (grainPat && state.grainBgOnly) {
          ctx.save();
          ctx.globalAlpha = state.grainIntensity / 100;
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = grainPat;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }

        // Layer 6 — 3D Device (live WebGL frame)
        if (glEl && glEl.width > 0 && glEl.height > 0) {
          ctx.drawImage(glEl, 0, 0, W, H);
        }

        // Layer 7 — Light overlay above device (non-bgOnly, with blend mode)
        if (lightCanvas && !state.lightOverlayBgOnly) {
          ctx.save();
          ctx.globalAlpha = state.lightOverlayOpacity / 100;
          ctx.globalCompositeOperation = toBlend(state.lightOverlayBlend);
          ctx.drawImage(lightCanvas, 0, 0, W, H);
          ctx.restore();
        }

        // Layer 8 — Grain above device (non-grainBgOnly, overlay blend)
        if (grainPat && !state.grainBgOnly) {
          ctx.save();
          ctx.globalAlpha = state.grainIntensity / 100;
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = grainPat;
          ctx.fillRect(0, 0, W, H);
          ctx.restore();
        }

        // Layer 9 — Annotation drawings (canvas strokes)
        if (annotateEl && annotateEl.width > 0 && annotateEl.height > 0) {
          ctx.drawImage(annotateEl, 0, 0, W, H);
        }

        // Layer 10 — Text overlays (drawn directly with canvas API)
        if (textOverlays.length > 0) {
          ctx.save();
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          for (const ov of textOverlays) {
            const weight = ov.isBold ? '700' : '400';
            const style = ov.isItalic ? 'italic ' : '';
            ctx.font = `${style}${weight} ${ov.fontSize}px Inter, sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = ov.color;
            ctx.fillText(ov.text, W * ov.x / 100, H * ov.y / 100);
          }
          ctx.restore();
        }

        if (elapsed < DURATION_MS) {
          requestAnimationFrame(drawLoop);
        } else {
          recorder.stop();
        }
      };
      requestAnimationFrame(drawLoop);

      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      stopInterval();
      timeline?.stopPlayback();
      setRecordProgress(100);

      const blob = new Blob(chunks, { type: 'video/webm' });
      downloadBlob(URL.createObjectURL(blob), `mockup-animated-${Date.now()}.webm`);
    } catch (err) {
      console.error('Record failed', err);
      stopInterval();
      movieTimelineRef?.current?.stopPlayback();
    } finally {
      const bgVideo = document.querySelector('video[data-bg-video]') as HTMLVideoElement | null;
      bgVideo?.play?.().catch(() => {});
      setRecording(false);
      setRecordProgress(0);
      setRecordSecsLeft(0);
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
              {/* Export quality controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {/* Resolution */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, width: 52, flexShrink: 0 }}>Resolución</span>
                  <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                    {([1, 2, 3] as const).map(s => (
                      <button key={s} onClick={() => setExportScale(s)} style={{
                        flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: exportScale === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                        color: exportScale === s ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                      }}>
                        {s === 1 ? '1×' : s === 2 ? '2× HD' : '3× 4K'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* FPS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, width: 52, flexShrink: 0 }}>FPS</span>
                  <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                    {([30, 60] as const).map(f => (
                      <button key={f} onClick={() => setExportFps(f)} style={{
                        flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        border: 'none', cursor: 'pointer',
                        background: exportFps === f ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                        color: exportFps === f ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                      }}>
                        {f} fps
                      </button>
                    ))}
                  </div>
                </div>
                {/* Transparent */}
                <button
                  onClick={() => setExportTransparent(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                    borderRadius: 6, border: 'none', cursor: 'pointer', width: '100%',
                    background: exportTransparent ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    color: exportTransparent ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                    fontSize: 10, fontWeight: 600,
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    border: `1.5px solid ${exportTransparent ? '#60a5fa' : 'rgba(255,255,255,0.2)'}`,
                    background: exportTransparent
                      ? '#60a5fa'
                      : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {exportTransparent && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                  </div>
                  Fondo transparente (alpha)
                </button>
              </div>

              {/* PRIMARY: record the live canvas and download as WebM — always available */}
              <div style={{ position: 'relative', width: '100%' }}>
                <button data-testid="export-video"
                  onClick={handleRecordWebM}
                  disabled={recording}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: recording ? 'rgba(30,12,8,0.85)' : 'rgba(255,255,255,0.9)',
                    color: recording ? '#fca5a5' : '#0d0e0f',
                    border: recording ? '1px solid rgba(239,68,68,0.35)' : 'none',
                    cursor: recording ? 'not-allowed' : 'pointer',
                    transition: 'background 0.3s, color 0.3s',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                  {/* Progress fill behind text */}
                  {recording && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${recordProgress}%`,
                      background: 'rgba(239,68,68,0.22)',
                      transition: 'width 0.1s linear',
                      borderRadius: '10px 0 0 10px',
                    }} />
                  )}
                  <span style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7 }}>
                    {recording ? <Film size={13} /> : <Download size={13} />}
                    {recording
                      ? `Renderizando… ${recordSecsLeft}s`
                      : `Descargar video ${exportScale > 1 ? (exportScale === 3 ? '4K' : 'HD') : ''} ${exportFps}fps`}
                  </span>
                </button>
              </div>

              {/* SECONDARY: download the raw source video if one was loaded */}
              {state.videoUrl && (
                <button
                  onClick={handleDownloadVideo}
                  style={{
                    width: '100%', padding: '8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.60)', cursor: 'pointer',
                  }}>
                  <Video size={12} />
                  Descargar video fuente
                </button>
              )}

              {/* TERTIARY: PNG snapshot */}
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
                {exporting ? 'Capturando…' : 'Snapshot PNG'}
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
