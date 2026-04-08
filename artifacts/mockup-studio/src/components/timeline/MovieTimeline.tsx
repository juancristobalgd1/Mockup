import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Circle, Film, X, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';

interface MovieTimelineProps {
  viewerRef: React.RefObject<Device3DViewerHandle | null>;
  movieTimeRef: React.MutableRefObject<number>;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s - Math.floor(s)) * 10);
  return `${m > 0 ? `${m}:` : ''}${sec.toString().padStart(2, '0')}.${cs}`;
}

function formatTime(s: number) {
  const sec = Math.floor(s);
  const ms = Math.floor((s - sec) * 100);
  return `${sec}.${ms.toString().padStart(2, '0')}s`;
}

function Diamond({ active, onClick, onContextMenu }: {
  active?: boolean;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      title="Clic derecho para eliminar"
      style={{
        width: 10, height: 10,
        background: active ? '#3b82f6' : '#94a3b8',
        transform: 'rotate(45deg)',
        cursor: 'pointer', flexShrink: 0, borderRadius: 1,
        transition: 'background 0.15s',
        boxShadow: active ? '0 0 6px rgba(59,130,246,0.7)' : undefined,
      }}
    />
  );
}

export function MovieTimeline({ viewerRef, movieTimeRef, onClose, onPlayingChange, canvasRef }: MovieTimelineProps) {
  const { state, updateState, addCameraKeyframe, removeCameraKeyframe, clearCameraKeyframes } = useApp();
  const { cameraKeyframes, movieDuration } = state;

  // ── Live Rec state ────────────────────────────────────────────────
  const [liveRecording, setLiveRecording] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const [liveError, setLiveError] = useState<string | null>(null);

  const liveRecorderRef = useRef<MediaRecorder | null>(null);
  const liveChunksRef = useRef<BlobPart[]>([]);
  const liveRafRef = useRef<number | null>(null);
  const liveStartRef = useRef<number>(0);
  const liveTimerRafRef = useRef<number | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const bgSnapshotRef = useRef<HTMLCanvasElement | null>(null);

  // ── Keyframe / timeline state ─────────────────────────────────────
  const [kfExpanded, setKfExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isKfRecording, setIsKfRecording] = useState(false);
  const [activeKfId, setActiveKfId] = useState<string | null>(null);

  const kfRafRef = useRef<number | null>(null);
  const kfLastTsRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const TRACK_PADDING = 20;

  // ── Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (liveRafRef.current) cancelAnimationFrame(liveRafRef.current);
      if (liveTimerRafRef.current) cancelAnimationFrame(liveTimerRafRef.current);
      if (kfRafRef.current) cancelAnimationFrame(kfRafRef.current);
      liveRecorderRef.current?.stop();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // LIVE RECORD
  // ─────────────────────────────────────────────────────────────────
  const startLiveRec = useCallback(async () => {
    if (!canvasRef.current) return;
    setLiveError(null);

    const el = canvasRef.current;
    const glEl = viewerRef.current?.getGLElement() ?? null;

    // Capture background once (static — no WebGL canvas)
    let bgCanvas: HTMLCanvasElement | null = null;
    try {
      const html2canvas = (await import('html2canvas')).default;
      bgCanvas = await html2canvas(el, {
        useCORS: true, allowTaint: true, scale: 1,
        backgroundColor: null,
        ignoreElements: (element) => element.tagName === 'CANVAS',
      });
    } catch {
      // If html2canvas fails, proceed without background capture
    }
    bgSnapshotRef.current = bgCanvas;

    const W = glEl ? glEl.width : el.offsetWidth;
    const H = glEl ? glEl.height : el.offsetHeight;

    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    offscreenRef.current = offscreen;

    const ctx = offscreen.getContext('2d');
    if (!ctx) { setLiveError('No se pudo crear el canvas de grabación'); return; }

    // Pick best supported mime type
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(m => MediaRecorder.isTypeSupported(m)) ?? '';

    let recorder: MediaRecorder;
    try {
      const stream = offscreen.captureStream(30);
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (e) {
      setLiveError('Tu navegador no soporta grabación de video.');
      return;
    }

    liveChunksRef.current = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) liveChunksRef.current.push(e.data); };
    recorder.start(100);
    liveRecorderRef.current = recorder;
    liveStartRef.current = performance.now();
    setLiveTime(0);
    setLiveRecording(true);

    // Timer display loop
    const timerLoop = () => {
      setLiveTime((performance.now() - liveStartRef.current) / 1000);
      liveTimerRafRef.current = requestAnimationFrame(timerLoop);
    };
    liveTimerRafRef.current = requestAnimationFrame(timerLoop);

    // Frame compositing loop: background + WebGL
    const drawLoop = () => {
      ctx.clearRect(0, 0, W, H);
      // Draw background
      if (bgSnapshotRef.current) {
        ctx.drawImage(bgSnapshotRef.current, 0, 0, W, H);
      }
      // Draw live WebGL on top
      if (glEl) {
        ctx.drawImage(glEl, 0, 0, W, H);
      }
      liveRafRef.current = requestAnimationFrame(drawLoop);
    };
    liveRafRef.current = requestAnimationFrame(drawLoop);
  }, [canvasRef, viewerRef]);

  const stopLiveRec = useCallback(() => {
    // Stop compositing loops
    if (liveRafRef.current) { cancelAnimationFrame(liveRafRef.current); liveRafRef.current = null; }
    if (liveTimerRafRef.current) { cancelAnimationFrame(liveTimerRafRef.current); liveTimerRafRef.current = null; }

    const recorder = liveRecorderRef.current;
    if (!recorder) { setLiveRecording(false); return; }

    recorder.onstop = () => {
      const blob = new Blob(liveChunksRef.current, { type: 'video/webm' });
      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movie-${Date.now()}.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      setLiveRecording(false);
    };
    recorder.stop();
    liveRecorderRef.current = null;
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // KEYFRAME PLAYBACK
  // ─────────────────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (kfRafRef.current) { cancelAnimationFrame(kfRafRef.current); kfRafRef.current = null; }
    kfLastTsRef.current = null;
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

  const startPlayback = useCallback(() => {
    if (isKfRecording) return;
    setIsPlaying(true);
    onPlayingChange?.(true);
    kfLastTsRef.current = null;
    const tick = (ts: number) => {
      if (kfLastTsRef.current === null) kfLastTsRef.current = ts;
      const delta = (ts - kfLastTsRef.current) / 1000;
      kfLastTsRef.current = ts;
      movieTimeRef.current = Math.min(movieTimeRef.current + delta, movieDuration);
      setCurrentTime(movieTimeRef.current);
      if (movieTimeRef.current >= movieDuration) {
        movieTimeRef.current = 0; setCurrentTime(0); kfLastTsRef.current = null;
      }
      kfRafRef.current = requestAnimationFrame(tick);
    };
    kfRafRef.current = requestAnimationFrame(tick);
  }, [isKfRecording, movieDuration, movieTimeRef, onPlayingChange]);

  const togglePlayback = () => { isPlaying ? stopPlayback() : startPlayback(); };

  // Seek by clicking/dragging the track
  const handleTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const t = Math.max(0, Math.min(1, x / (rect.width - TRACK_PADDING * 2))) * movieDuration;
    movieTimeRef.current = t; setCurrentTime(t);
  }, [movieDuration, movieTimeRef]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const t = Math.max(0, Math.min(1, x / (rect.width - TRACK_PADDING * 2))) * movieDuration;
    movieTimeRef.current = t; setCurrentTime(t);
  }, [movieDuration, movieTimeRef]);

  const handleTrackPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const handleAddKeyframe = useCallback(() => {
    const cam = viewerRef.current?.getCameraState();
    if (!cam) return;
    addCameraKeyframe({ time: movieTimeRef.current, position: cam.position, target: cam.target });
  }, [addCameraKeyframe, movieTimeRef, viewerRef]);

  const handleKfExport = async () => {
    if (!canvasRef.current || cameraKeyframes.length < 2) return;
    setIsKfRecording(true);
    stopPlayback();
    try {
      const DURATION_MS = movieDuration * 1000;
      const el = canvasRef.current;
      const glEl = viewerRef.current?.getGLElement() ?? null;
      const html2canvas = (await import('html2canvas')).default;
      const bgCanvas = await html2canvas(el, {
        useCORS: true, allowTaint: true, scale: 1, backgroundColor: null,
        ignoreElements: (element) => element.tagName === 'CANVAS',
      });
      const W = bgCanvas.width, H = bgCanvas.height;
      const offscreen = document.createElement('canvas');
      offscreen.width = W; offscreen.height = H;
      const ctx = offscreen.getContext('2d')!;
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder = new MediaRecorder(offscreen.captureStream(30), mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);
      const startTs = performance.now();
      movieTimeRef.current = 0; setCurrentTime(0);
      const drawLoop = (ts: number) => {
        const elapsed = ts - startTs;
        const t = Math.min(elapsed / 1000, movieDuration);
        movieTimeRef.current = t; setCurrentTime(t);
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(bgCanvas, 0, 0);
        if (glEl) ctx.drawImage(glEl, 0, 0, W, H);
        if (elapsed < DURATION_MS) requestAnimationFrame(drawLoop);
        else recorder.stop();
      };
      requestAnimationFrame(drawLoop);
      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `movie-keyframes-${Date.now()}.webm`; a.click();
      movieTimeRef.current = 0; setCurrentTime(0);
    } catch (err) { console.error(err); }
    finally { setIsKfRecording(false); }
  };

  const playheadPct = movieDuration > 0 ? (currentTime / movieDuration) * 100 : 0;
  const RULERS = Array.from({ length: Math.ceil(movieDuration) + 1 }, (_, i) => i);

  return (
    <div style={{
      width: '100%', background: 'rgba(8,10,22,0.99)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0, userSelect: 'none',
    }}>

      {/* ── LIVE REC section ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>

        {/* REC / STOP button */}
        {!liveRecording ? (
          <button
            onClick={startLiveRec}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              border: '1px solid rgba(239,68,68,0.5)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              boxShadow: '0 4px 14px rgba(220,38,38,0.4)',
              flexShrink: 0,
            }}
          >
            <Circle size={11} fill="#fff" color="#fff" />
            GRABAR
          </button>
        ) : (
          <button
            onClick={stopLiveRec}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.5)',
              color: '#f87171', fontSize: 12, fontWeight: 700,
              flexShrink: 0, animation: 'recPulse 1s ease-in-out infinite',
            }}
          >
            <Square size={11} fill="#f87171" color="#f87171" />
            PARAR Y GUARDAR
          </button>
        )}

        {/* Timer / status */}
        {liveRecording ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Blinking dot */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
              animation: 'recBlink 1s step-start infinite',
            }} />
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#f87171', letterSpacing: 1 }}>
              {formatTimer(liveTime)}
            </span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              Mueve el dispositivo con el ratón...
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>Cómo funciona: </span>
            Presiona GRABAR, luego arrastra el dispositivo 3D para rotarlo.<br />
            Cuando termines, presiona PARAR Y GUARDAR para descargar el video.
          </div>
        )}

        {/* Error */}
        {liveError && (
          <span style={{ fontSize: 10, color: '#f87171', marginLeft: 8 }}>{liveError}</span>
        )}

        {/* Close */}
        <button
          onClick={() => { stopLiveRec(); stopPlayback(); onClose(); }}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#374151', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 4, flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── KEYFRAMES (modo avanzado, colapsable) ────────────────── */}
      <div>
        {/* Toggle header */}
        <button
          onClick={() => setKfExpanded(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', background: 'none', border: 'none',
            cursor: 'pointer', color: '#4b5563', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            borderBottom: kfExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          {kfExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Animación con Keyframes
          {cameraKeyframes.length > 0 && (
            <span style={{
              marginLeft: 4, background: 'rgba(124,58,237,0.25)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#a78bfa', borderRadius: 10, padding: '0 6px', fontSize: 9,
            }}>
              {cameraKeyframes.length} keyframes
            </span>
          )}
        </button>

        {kfExpanded && (
          <div>
            {/* Controls row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {/* Play/Pause */}
              <button
                onClick={togglePlayback}
                disabled={isKfRecording}
                style={{
                  background: isPlaying ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isPlaying ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isPlaying ? '#a78bfa' : '#9ca3af',
                }}
              >
                {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              </button>

              {/* Add keyframe */}
              <button
                onClick={handleAddKeyframe}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 6, height: 26, padding: '0 8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af',
                  fontSize: 10, fontWeight: 600,
                }}
              >
                <Plus size={10} /> Añadir keyframe
              </button>

              {/* Clear */}
              {cameraKeyframes.length > 0 && (
                <button
                  onClick={() => { clearCameraKeyframes(); setActiveKfId(null); }}
                  style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f87171',
                  }}
                >
                  <Trash2 size={11} />
                </button>
              )}

              {/* Time / Duration */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>
                  {formatTime(currentTime)}
                </span>
                <span style={{ fontSize: 10, color: '#374151' }}>de</span>
                <select
                  value={movieDuration}
                  onChange={e => {
                    const d = Number(e.target.value);
                    updateState({ movieDuration: d });
                    if (movieTimeRef.current > d) { movieTimeRef.current = d; setCurrentTime(d); }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 5, color: '#6b7280', fontSize: 10, padding: '2px 5px', cursor: 'pointer',
                  }}
                >
                  {[3, 5, 8, 10, 15, 20, 30].map(d => <option key={d} value={d}>{d}s</option>)}
                </select>
              </div>

              {/* Export keyframe animation */}
              <button
                onClick={handleKfExport}
                disabled={isKfRecording || cameraKeyframes.length < 2}
                style={{
                  background: isKfRecording ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 6, height: 26, padding: '0 9px', cursor: cameraKeyframes.length < 2 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: cameraKeyframes.length < 2 ? '#4b5563' : '#f87171',
                  fontSize: 10, fontWeight: 600, opacity: cameraKeyframes.length < 2 ? 0.5 : 1,
                }}
              >
                <Film size={10} />
                {isKfRecording ? 'Exportando…' : 'Exportar WebM'}
              </button>
            </div>

            {/* Timeline track */}
            <div
              ref={trackRef}
              onPointerDown={handleTrackPointerDown}
              onPointerMove={handleTrackPointerMove}
              onPointerUp={handleTrackPointerUp}
              style={{ position: 'relative', padding: `5px ${TRACK_PADDING}px 8px`, cursor: 'crosshair' }}
            >
              {/* Ruler */}
              <div style={{ position: 'relative', height: 16, marginBottom: 4 }}>
                {RULERS.map(s => (
                  <div key={s} style={{
                    position: 'absolute', left: `${(s / movieDuration) * 100}%`,
                    top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    transform: 'translateX(-50%)', pointerEvents: 'none',
                  }}>
                    <div style={{ width: 1, height: 4, background: 'rgba(255,255,255,0.12)' }} />
                    <span style={{ fontSize: 8, color: '#374151', marginTop: 1, fontFamily: 'monospace' }}>{s}s</span>
                  </div>
                ))}
              </div>

              {/* Camera track */}
              <div style={{ height: 26, position: 'relative', flex: 1 }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4,
                }}>
                  <span style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 8, color: '#374151', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', pointerEvents: 'none',
                  }}>Camera</span>

                  {/* Connecting line */}
                  {cameraKeyframes.length >= 2 && (
                    <div style={{
                      position: 'absolute',
                      left: `${(cameraKeyframes[0].time / movieDuration) * 100}%`,
                      right: `${100 - (cameraKeyframes[cameraKeyframes.length - 1].time / movieDuration) * 100}%`,
                      top: '50%', height: 1,
                      background: 'rgba(148,163,184,0.2)', transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* Keyframe diamonds */}
                  {cameraKeyframes.map(kf => (
                    <div
                      key={kf.id}
                      style={{
                        position: 'absolute', left: `${(kf.time / movieDuration) * 100}%`,
                        top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2,
                      }}
                      onClick={e => { e.stopPropagation(); setActiveKfId(kf.id === activeKfId ? null : kf.id); }}
                      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(kf.id); }}
                    >
                      <Diamond active={kf.id === activeKfId} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Playhead */}
              <div style={{
                position: 'absolute',
                left: `calc(${TRACK_PADDING}px + ${playheadPct}% * (100% - ${TRACK_PADDING * 2}px) / 100)`,
                top: 0, bottom: 0, width: 1,
                background: '#f97316', pointerEvents: 'none', zIndex: 10,
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 8, height: 8, background: '#f97316',
                  clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                }} />
              </div>
            </div>

            {/* Keyframes help */}
            {cameraKeyframes.length < 2 && (
              <div style={{
                padding: '6px 14px 8px', borderTop: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', gap: 16, flexWrap: 'wrap',
              }}>
                {[
                  { n: '1', t: 'Coloca la cámara', d: 'Arrastra el playhead a 0s y rota el dispositivo.' },
                  { n: '2', t: 'Añade keyframe', d: 'Clic en "Añadir keyframe" para guardar esa posición.' },
                  { n: '3', t: 'Mueve y repite', d: 'Avanza el playhead, rota a otro ángulo, añade otro keyframe.' },
                  { n: '4', t: 'Exportar', d: 'Dale a Play para previsualizar y luego Exportar WebM.' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: 5, flex: 1, minWidth: 130, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontWeight: 700, color: '#a78bfa',
                    }}>{s.n}</div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#6b7280' }}>{s.t}</div>
                      <div style={{ fontSize: 8, color: '#374151', lineHeight: 1.4 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cameraKeyframes.length >= 2 && (
              <div style={{
                padding: '5px 14px 6px', fontSize: 9, color: '#4b5563',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                {cameraKeyframes.length} keyframes listos · Previsualiza y luego exporta.
                <span style={{ color: '#374151' }}>Clic derecho en un diamante para eliminarlo.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes recPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
      `}</style>
    </div>
  );
}
