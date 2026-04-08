import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Plus, Trash2, Circle, Film, X } from 'lucide-react';
import { useApp } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';

interface MovieTimelineProps {
  viewerRef: React.RefObject<Device3DViewerHandle | null>;
  movieTimeRef: React.MutableRefObject<number>;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

function formatTime(s: number) {
  const sec = Math.floor(s);
  const ms = Math.floor((s - sec) * 100);
  return `${sec}.${ms.toString().padStart(2, '0')}s`;
}

function Diamond({ active, onClick, onContextMenu }: { active?: boolean; onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void }) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      title="Right-click to delete"
      style={{
        width: 10, height: 10,
        background: active ? '#3b82f6' : '#94a3b8',
        transform: 'rotate(45deg)',
        cursor: 'pointer',
        flexShrink: 0,
        borderRadius: 1,
        transition: 'background 0.15s, transform 0.1s',
        boxShadow: active ? '0 0 6px rgba(59,130,246,0.7)' : undefined,
      }}
    />
  );
}

export function MovieTimeline({ viewerRef, movieTimeRef, onClose, onPlayingChange, canvasRef }: MovieTimelineProps) {
  const { state, updateState, addCameraKeyframe, removeCameraKeyframe, clearCameraKeyframes } = useApp();
  const { cameraKeyframes, movieDuration } = state;

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeKeyframeId, setActiveKeyframeId] = useState<string | null>(null);

  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef(false);

  const TRACK_PADDING = 24;

  const stopPlayback = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimestampRef.current = null;
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

  const startPlayback = useCallback(() => {
    if (isRecording) return;
    setIsPlaying(true);
    onPlayingChange?.(true);
    lastTimestampRef.current = null;

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp;
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      movieTimeRef.current = Math.min(movieTimeRef.current + delta, movieDuration);
      setCurrentTime(movieTimeRef.current);

      if (movieTimeRef.current >= movieDuration) {
        movieTimeRef.current = 0;
        setCurrentTime(0);
        lastTimestampRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isRecording, movieDuration, movieTimeRef]);

  const togglePlayback = () => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Seek when clicking on the track
  const handleTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    isDraggingPlayhead.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const ratio = Math.max(0, Math.min(1, x / (rect.width - TRACK_PADDING * 2)));
    const t = ratio * movieDuration;
    movieTimeRef.current = t;
    setCurrentTime(t);
  }, [movieDuration, movieTimeRef]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPlayhead.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - TRACK_PADDING;
    const ratio = Math.max(0, Math.min(1, x / (rect.width - TRACK_PADDING * 2)));
    const t = ratio * movieDuration;
    movieTimeRef.current = t;
    setCurrentTime(t);
  }, [movieDuration, movieTimeRef]);

  const handleTrackPointerUp = useCallback(() => {
    isDraggingPlayhead.current = false;
  }, []);

  const handleAddKeyframe = useCallback(() => {
    const camState = viewerRef.current?.getCameraState();
    if (!camState) return;
    addCameraKeyframe({
      time: movieTimeRef.current,
      position: camState.position,
      target: camState.target,
    });
  }, [addCameraKeyframe, movieTimeRef, viewerRef]);

  const handleRecordWebM = async () => {
    if (!canvasRef.current || cameraKeyframes.length < 2) return;
    setIsRecording(true);
    stopPlayback();

    try {
      const DURATION_MS = movieDuration * 1000;
      const FPS = 30;
      const el = canvasRef.current;
      const rect = el.getBoundingClientRect();
      const offscreen = document.createElement('canvas');
      offscreen.width = rect.width * 2;
      offscreen.height = rect.height * 2;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const stream = offscreen.captureStream(FPS);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.start(100);
      const startTime = performance.now();

      const html2canvas = (await import('html2canvas')).default;

      // Reset playhead and drive animation during recording
      movieTimeRef.current = 0;
      setCurrentTime(0);

      const drawLoop = async (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const t = Math.min(elapsed / 1000, movieDuration);
        movieTimeRef.current = t;
        setCurrentTime(t);

        try {
          const glEl = viewerRef.current?.getGLElement() ?? null;
          const snap = await html2canvas(el, {
            useCORS: true, allowTaint: true, scale: 2, backgroundColor: null,
            ignoreElements: (element) => element.tagName === 'CANVAS',
          });
          ctx.clearRect(0, 0, offscreen.width, offscreen.height);
          ctx.drawImage(snap, 0, 0);
          if (glEl) {
            ctx.drawImage(glEl, 0, 0, offscreen.width, offscreen.height);
          }
        } catch {}

        if (elapsed < DURATION_MS) {
          requestAnimationFrame(drawLoop);
        } else {
          recorder.stop();
        }
      };
      requestAnimationFrame(drawLoop);

      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movie-${Date.now()}.webm`;
      a.click();

      movieTimeRef.current = 0;
      setCurrentTime(0);
    } catch (err) {
      console.error('Movie record failed', err);
    } finally {
      setIsRecording(false);
    }
  };

  const playheadPercent = movieDuration > 0 ? (currentTime / movieDuration) * 100 : 0;

  const RULER_MARKS = Array.from({ length: Math.ceil(movieDuration) + 1 }, (_, i) => i);

  return (
    <div style={{
      width: '100%',
      background: 'rgba(8,10,22,0.98)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Play/Pause */}
        <button
          onClick={togglePlayback}
          disabled={isRecording}
          style={{
            background: isPlaying ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isPlaying ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isPlaying ? '#a78bfa' : '#9ca3af',
          }}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>

        {/* Add keyframe */}
        <button
          onClick={handleAddKeyframe}
          title="Add camera keyframe at current time"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 6, height: 28, padding: '0 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af',
            fontSize: 11, fontWeight: 600,
          }}
        >
          <Plus size={11} />
          Add keyframe
          <span style={{ color: '#4b5563', marginLeft: 2, fontSize: 10 }}>
            ({cameraKeyframes.length})
          </span>
        </button>

        {/* Clear keyframes */}
        {cameraKeyframes.length > 0 && (
          <button
            onClick={() => { clearCameraKeyframes(); setActiveKeyframeId(null); }}
            title="Clear all keyframes"
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

        {/* Duration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#a78bfa', fontWeight: 600 }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: 11, color: '#374151' }}>of</span>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4b5563' }}>
            {formatTime(movieDuration)}
          </span>

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
            {[3,5,8,10,15,20,30].map(d => (
              <option key={d} value={d}>{d}s</option>
            ))}
          </select>
        </div>

        {/* Record */}
        <button
          onClick={handleRecordWebM}
          disabled={isRecording || cameraKeyframes.length < 2}
          title={cameraKeyframes.length < 2 ? 'Add at least 2 keyframes to record' : 'Record movie as WebM'}
          style={{
            background: isRecording ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isRecording ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 6, height: 28, padding: '0 10px', cursor: cameraKeyframes.length < 2 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            color: isRecording ? '#ef4444' : (cameraKeyframes.length < 2 ? '#4b5563' : '#f87171'),
            fontSize: 11, fontWeight: 600, opacity: cameraKeyframes.length < 2 ? 0.5 : 1,
          }}
        >
          {isRecording ? (
            <>
              <Circle size={9} fill="#ef4444" color="#ef4444" style={{ animation: 'pulse 1s infinite' }} />
              Recording…
            </>
          ) : (
            <>
              <Film size={11} />
              Export WebM
            </>
          )}
        </button>

        {/* Close movie mode */}
        <button
          onClick={() => { stopPlayback(); onClose(); }}
          style={{
            background: 'none', border: 'none', color: '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Timeline track area */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        style={{ position: 'relative', padding: `6px ${TRACK_PADDING}px 8px`, cursor: 'crosshair' }}
      >
        {/* Ruler */}
        <div style={{ position: 'relative', height: 18, marginBottom: 4 }}>
          {RULER_MARKS.map(s => (
            <div key={s} style={{
              position: 'absolute',
              left: `${(s / movieDuration) * 100}%`,
              top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <div style={{ width: 1, height: 5, background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 9, color: '#374151', marginTop: 1, fontFamily: 'monospace' }}>
                {s}s
              </span>
            </div>
          ))}
          {/* Tick marks for 0.5s intervals */}
          {Array.from({ length: Math.ceil(movieDuration * 2) - 1 }, (_, i) => (i + 1) * 0.5).map(s => (
            <div key={s} style={{
              position: 'absolute',
              left: `${(s / movieDuration) * 100}%`,
              top: 0,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <div style={{ width: 1, height: 3, background: 'rgba(255,255,255,0.07)' }} />
            </div>
          ))}
        </div>

        {/* Camera track row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 28 }}>
          {/* Track label */}
          <div style={{
            fontSize: 10, color: '#4b5563', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', flexShrink: 0, width: 0, marginLeft: -TRACK_PADDING,
            paddingLeft: 0,
          }}>
          </div>

          {/* Track lane */}
          <div style={{
            flex: 1, position: 'relative', height: 28,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 4,
          }}>
            {/* Label inside track */}
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 9, color: '#374151', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', pointerEvents: 'none',
            }}>
              Camera
            </span>

            {/* Keyframe diamonds */}
            {cameraKeyframes.map(kf => (
              <div
                key={kf.id}
                style={{
                  position: 'absolute',
                  left: `${(kf.time / movieDuration) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                }}
                onClick={e => { e.stopPropagation(); setActiveKeyframeId(kf.id === activeKeyframeId ? null : kf.id); }}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(kf.id); }}
              >
                <Diamond active={kf.id === activeKeyframeId} />
              </div>
            ))}

            {/* Connecting line between keyframes */}
            {cameraKeyframes.length >= 2 && (
              <div style={{
                position: 'absolute',
                left: `${(cameraKeyframes[0].time / movieDuration) * 100}%`,
                right: `${100 - (cameraKeyframes[cameraKeyframes.length - 1].time / movieDuration) * 100}%`,
                top: '50%', height: 1,
                background: 'rgba(148,163,184,0.25)',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>

        {/* Playhead */}
        <div style={{
          position: 'absolute',
          left: `calc(${TRACK_PADDING}px + ${playheadPercent}% * (100% - ${TRACK_PADDING * 2}px) / 100)`,
          top: 0, bottom: 0,
          width: 1,
          background: '#f97316',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {/* Playhead handle */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 10, height: 10,
            background: '#f97316',
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          }} />
        </div>
      </div>

      {/* Step-by-step guide */}
      {cameraKeyframes.length < 2 && (
        <div style={{
          padding: '8px 14px 10px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', gap: 20, flexWrap: 'wrap',
        }}>
          {[
            { n: '1', label: 'Set start angle', desc: 'Drag the playhead to 0s, rotate the device to your starting position.' },
            { n: '2', label: 'Add keyframe', desc: 'Click "Add keyframe" to save that camera angle at this moment.' },
            { n: '3', label: 'Move & add more', desc: 'Drag the playhead forward (e.g. 2s), rotate to a new angle, add another keyframe.' },
            { n: '4', label: 'Preview & export', desc: 'Hit Play to preview the animation, then Export WebM to download the movie.' },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 160, flex: 1 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#a78bfa',
              }}>{step.n}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', marginBottom: 1 }}>{step.label}</div>
                <div style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status when ready */}
      {cameraKeyframes.length >= 2 && (
        <div style={{
          padding: '5px 14px 7px', fontSize: 9, color: '#4b5563',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
          {cameraKeyframes.length} keyframes · Press Play to preview, then Export WebM to download the animated movie.
          <span style={{ color: '#374151' }}> Right-click a diamond to delete it.</span>
        </div>
      )}
    </div>
  );
}
