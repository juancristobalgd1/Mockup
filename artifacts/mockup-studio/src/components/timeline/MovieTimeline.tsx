import { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Circle, Film, X, Square } from 'lucide-react';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
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

  // ── Live Rec ──────────────────────────────────────────────────────
  const [liveRecording, setLiveRecording] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const liveStartRef = useRef<number>(0);
  const liveTimerRafRef = useRef<number | null>(null);
  // Captured frames during recording: {time, position, target}
  const capturedFramesRef = useRef<Omit<CameraKeyframe, 'id'>[]>([]);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Keyframe timeline ─────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeKfId, setActiveKfId] = useState<string | null>(null);

  const kfRafRef = useRef<number | null>(null);
  const kfLastTsRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const TRACK_PADDING = 24;

  useEffect(() => {
    return () => {
      if (liveTimerRafRef.current) cancelAnimationFrame(liveTimerRafRef.current);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (kfRafRef.current) cancelAnimationFrame(kfRafRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // LIVE RECORD: captura posiciones de cámara → keyframes en timeline
  // ─────────────────────────────────────────────────────────────────
  const startLiveRec = useCallback(() => {
    capturedFramesRef.current = [];
    liveStartRef.current = performance.now();
    setLiveTime(0);
    setLiveRecording(true);

    // Timer display
    const timerLoop = () => {
      setLiveTime((performance.now() - liveStartRef.current) / 1000);
      liveTimerRafRef.current = requestAnimationFrame(timerLoop);
    };
    liveTimerRafRef.current = requestAnimationFrame(timerLoop);

    // Capture camera every 200ms → ~5 keyframes/second
    captureIntervalRef.current = setInterval(() => {
      const cam = viewerRef.current?.getCameraState();
      if (!cam) return;
      const t = (performance.now() - liveStartRef.current) / 1000;
      capturedFramesRef.current.push({ time: t, position: cam.position, target: cam.target });
    }, 200);
  }, [viewerRef]);

  const stopLiveRec = useCallback(() => {
    if (liveTimerRafRef.current) { cancelAnimationFrame(liveTimerRafRef.current); liveTimerRafRef.current = null; }
    if (captureIntervalRef.current) { clearInterval(captureIntervalRef.current); captureIntervalRef.current = null; }

    const frames = capturedFramesRef.current;
    if (frames.length === 0) { setLiveRecording(false); return; }

    const totalTime = frames[frames.length - 1].time;

    // Subsample: keep max 1 keyframe every 500ms to keep the timeline clean
    const STEP = 0.5;
    const sampled: Omit<CameraKeyframe, 'id'>[] = [];
    let nextKeep = 0;
    for (const f of frames) {
      if (f.time >= nextKeep) {
        sampled.push(f);
        nextKeep = f.time + STEP;
      }
    }
    // Always include the last frame
    const last = frames[frames.length - 1];
    if (sampled.length === 0 || Math.abs(sampled[sampled.length - 1].time - last.time) > 0.05) {
      sampled.push(last);
    }

    // Adjust duration if the recording is longer
    const newDuration = Math.max(movieDuration, Math.ceil(totalTime));
    if (newDuration !== movieDuration) updateState({ movieDuration: newDuration });

    // Add all sampled frames as keyframes
    sampled.forEach(f => addCameraKeyframe(f));

    // Move playhead to start
    movieTimeRef.current = 0;
    setCurrentTime(0);

    setLiveRecording(false);
    capturedFramesRef.current = [];
  }, [addCameraKeyframe, movieDuration, movieTimeRef, updateState]);

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
    if (isExporting) return;
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
  }, [isExporting, movieDuration, movieTimeRef, onPlayingChange]);

  const togglePlayback = () => { isPlaying ? stopPlayback() : startPlayback(); };

  // Track scrubbing
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

  // Add manual keyframe
  const handleAddKeyframe = useCallback(() => {
    const cam = viewerRef.current?.getCameraState();
    if (!cam) return;
    addCameraKeyframe({ time: movieTimeRef.current, position: cam.position, target: cam.target });
  }, [addCameraKeyframe, movieTimeRef, viewerRef]);

  // Export keyframe animation as WebM
  const handleExport = async () => {
    if (!canvasRef.current || cameraKeyframes.length < 2) return;
    setIsExporting(true);
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
      a.href = url; a.download = `movie-${Date.now()}.webm`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      movieTimeRef.current = 0; setCurrentTime(0);
    } catch (err) { console.error(err); }
    finally { setIsExporting(false); }
  };

  const playheadPct = movieDuration > 0 ? (currentTime / movieDuration) * 100 : 0;
  const RULERS = Array.from({ length: Math.ceil(movieDuration) + 1 }, (_, i) => i);

  return (
    <div style={{
      width: '100%', background: 'rgba(8,10,22,0.99)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0, userSelect: 'none',
    }}>

      {/* ── Top controls bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexWrap: 'wrap',
      }}>

        {/* Play / Pause */}
        <button
          onClick={togglePlayback}
          disabled={isExporting || liveRecording}
          title={isPlaying ? 'Pausar' : 'Reproducir animación'}
          style={{
            background: isPlaying ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isPlaying ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isPlaying ? '#a78bfa' : '#9ca3af',
            opacity: (isExporting || liveRecording) ? 0.4 : 1,
          }}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>

        {/* REC / STOP button */}
        {!liveRecording ? (
          <button
            onClick={startLiveRec}
            disabled={isPlaying || isExporting}
            title="Grabar movimiento del dispositivo como keyframes"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px', height: 28, borderRadius: 6, cursor: 'pointer',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171', fontSize: 11, fontWeight: 700,
              opacity: (isPlaying || isExporting) ? 0.4 : 1,
            }}
          >
            <Circle size={9} fill="#f87171" color="#f87171" />
            GRABAR
          </button>
        ) : (
          <button
            onClick={stopLiveRec}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px', height: 28, borderRadius: 6, cursor: 'pointer',
              background: 'rgba(220,38,38,0.3)',
              border: '1px solid rgba(239,68,68,0.6)',
              color: '#fca5a5', fontSize: 11, fontWeight: 700,
            }}
          >
            <Square size={9} fill="#fca5a5" color="#fca5a5" />
            PARAR
          </button>
        )}

        {/* Recording timer */}
        {liveRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'recBlink 1s step-start infinite' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f87171' }}>
              {formatTimer(liveTime)}
            </span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              — Mueve el dispositivo con el ratón...
            </span>
          </div>
        )}

        {/* Add keyframe manually */}
        {!liveRecording && (
          <button
            onClick={handleAddKeyframe}
            title="Añadir keyframe manual en la posición actual del playhead"
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 6, height: 28, padding: '0 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: '#9ca3af', fontSize: 11, fontWeight: 600,
            }}
          >
            <Plus size={11} />
            Añadir keyframe
            {cameraKeyframes.length > 0 && (
              <span style={{ color: '#4b5563', fontSize: 10 }}>({cameraKeyframes.length})</span>
            )}
          </button>
        )}

        {/* Clear all */}
        {cameraKeyframes.length > 0 && !liveRecording && (
          <button
            onClick={() => { clearCameraKeyframes(); setActiveKfId(null); }}
            title="Eliminar todos los keyframes"
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171',
            }}
          >
            <Trash2 size={12} />
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Time display */}
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>
          {formatTime(currentTime)}
        </span>
        <span style={{ fontSize: 10, color: '#374151' }}>de</span>

        {/* Duration selector */}
        <select
          value={movieDuration}
          onChange={e => {
            const d = Number(e.target.value);
            updateState({ movieDuration: d });
            if (movieTimeRef.current > d) { movieTimeRef.current = d; setCurrentTime(d); }
          }}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, color: '#6b7280', fontSize: 11, padding: '2px 6px', cursor: 'pointer',
          }}
        >
          {[3, 5, 8, 10, 15, 20, 30].map(d => <option key={d} value={d}>{d}s</option>)}
        </select>

        {/* Export WebM */}
        <button
          onClick={handleExport}
          disabled={isExporting || cameraKeyframes.length < 2 || liveRecording}
          title={cameraKeyframes.length < 2 ? 'Necesitas al menos 2 keyframes para exportar' : 'Exportar animación como WebM'}
          style={{
            background: isExporting ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 6, height: 28, padding: '0 10px',
            cursor: (cameraKeyframes.length < 2 || isExporting || liveRecording) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: (cameraKeyframes.length < 2 || liveRecording) ? '#4b5563' : '#f87171',
            fontSize: 11, fontWeight: 600,
            opacity: (cameraKeyframes.length < 2 || liveRecording) ? 0.45 : 1,
          }}
        >
          <Film size={11} />
          {isExporting ? 'Exportando…' : 'Exportar WebM'}
        </button>

        {/* Close */}
        <button
          onClick={() => { stopLiveRec(); stopPlayback(); onClose(); }}
          style={{
            background: 'none', border: 'none', color: '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Timeline track ───────────────────────────────────────── */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        style={{ position: 'relative', padding: `5px ${TRACK_PADDING}px 8px`, cursor: 'crosshair' }}
      >
        {/* Ruler */}
        <div style={{ position: 'relative', height: 18, marginBottom: 4 }}>
          {RULERS.map(s => (
            <div key={s} style={{
              position: 'absolute', left: `${(s / movieDuration) * 100}%`,
              top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: 'translateX(-50%)', pointerEvents: 'none',
            }}>
              <div style={{ width: 1, height: 5, background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 9, color: '#374151', marginTop: 1, fontFamily: 'monospace' }}>{s}s</span>
            </div>
          ))}
          {/* Half-second ticks */}
          {Array.from({ length: Math.ceil(movieDuration * 2) - 1 }, (_, i) => (i + 1) * 0.5).map(s => (
            <div key={s} style={{
              position: 'absolute', left: `${(s / movieDuration) * 100}%`,
              top: 0, transform: 'translateX(-50%)', pointerEvents: 'none',
            }}>
              <div style={{ width: 1, height: 3, background: 'rgba(255,255,255,0.07)' }} />
            </div>
          ))}
        </div>

        {/* Camera track row */}
        <div style={{ height: 28, position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4,
          }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 9, color: '#374151', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none',
            }}>Camera</span>

            {/* Connecting line between keyframes */}
            {cameraKeyframes.length >= 2 && (
              <div style={{
                position: 'absolute',
                left: `${(cameraKeyframes[0].time / movieDuration) * 100}%`,
                right: `${100 - (cameraKeyframes[cameraKeyframes.length - 1].time / movieDuration) * 100}%`,
                top: '50%', height: 1,
                background: 'rgba(148,163,184,0.25)', transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
            )}

            {/* Keyframe diamonds */}
            {cameraKeyframes.map(kf => (
              <div
                key={kf.id}
                style={{
                  position: 'absolute', left: `${(kf.time / movieDuration) * 100}%`,
                  top: '50%', transform: 'translate(-50%,-50%)', zIndex: 2,
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
            width: 9, height: 9, background: '#f97316',
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          }} />
        </div>
      </div>

      {/* ── Instrucciones / estado ───────────────────────────────── */}
      {cameraKeyframes.length === 0 && !liveRecording && (
        <div style={{
          padding: '7px 14px 9px', borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', gap: 18, flexWrap: 'wrap',
        }}>
          {[
            { n: '1', t: 'Graba movimiento', d: 'Presiona GRABAR y mueve el dispositivo con el ratón. Al parar se guardan los keyframes.' },
            { n: '2', t: 'O añade manualmente', d: 'Mueve el playhead al tiempo deseado, rota el dispositivo y haz clic en "Añadir keyframe".' },
            { n: '3', t: 'Edita y combina', d: 'Añade, ajusta o borra keyframes (clic derecho en el diamante). Usa Play para previsualizar.' },
            { n: '4', t: 'Exporta', d: 'Con 2+ keyframes, pulsa "Exportar WebM" para descargar el video final.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 140, alignItems: 'flex-start' }}>
              <div style={{
                width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#a78bfa',
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>{s.t}</div>
                <div style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cameraKeyframes.length > 0 && !liveRecording && (
        <div style={{
          padding: '5px 14px 7px', fontSize: 9, color: '#4b5563',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
          <span>{cameraKeyframes.length} keyframes en la línea de tiempo.</span>
          <span>Puedes seguir grabando o añadiendo más keyframes.</span>
          <span style={{ color: '#374151' }}>Clic derecho en un diamante para eliminarlo.</span>
        </div>
      )}

      {liveRecording && (
        <div style={{
          padding: '5px 14px 7px', fontSize: 9,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 6, color: '#f87171',
        }}>
          <Circle size={7} fill="#f87171" color="#f87171" style={{ animation: 'recBlink 1s step-start infinite' }} />
          Grabando — capturando posición de cámara cada 200ms. Mueve el dispositivo ahora.
          Al presionar PARAR los movimientos aparecerán como keyframes en la línea de tiempo.
        </div>
      )}

      <style>{`
        @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
