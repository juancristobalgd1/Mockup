import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { TRACK_PADDING } from './timelineUtils';
import type { DurationDrag } from './useTimelineDrags';

// Scrollable time area: click/drag to seek, ruler, playhead and the duration end-cap.
export function TimelineTrack({
  currentTime, displayDuration, movieDuration, effectivePxPerSec, isDraggingDuration, seek, durationDrag, children,
}: {
  currentTime: number;
  displayDuration: number;
  movieDuration: number;
  effectivePxPerSec: number;
  isDraggingDuration: boolean;
  seek: (time: number) => void;
  durationDrag: DurationDrag;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Active region width in px (ruler + camera bar span only this width)
  const activeAreaPx = displayDuration * effectivePxPerSec;
  // Total track element width: at least fill the container (minWidth:'100%' handles that)
  const trackWidthPx = TRACK_PADDING * 2 + activeAreaPx;

  // Auto-scroll to keep playhead visible when playing or seeking
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    if (scrollWidth <= clientWidth) return;
    // Playhead absolute pixel position within the track
    const playheadPx = TRACK_PADDING + currentTime * effectivePxPerSec;
    const scrollTarget = playheadPx - clientWidth / 2;
    container.scrollLeft = Math.max(0, Math.min(scrollTarget, scrollWidth - clientWidth));
  }, [currentTime, movieDuration, effectivePxPerSec]);

  const seekToPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    seek(Math.max(0, Math.min(movieDuration, (px - TRACK_PADDING) / effectivePxPerSec)));
  }, [movieDuration, effectivePxPerSec, seek]);

  const handleTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekToPointer(e);
  }, [seekToPointer]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    seekToPointer(e);
  }, [seekToPointer]);

  const handleTrackPointerUp = useCallback(() => { isDragging.current = false; }, []);

  // Only show integer ticks that fall within the active area (≤ displayDuration)
  const RULERS = Array.from({ length: Math.ceil(displayDuration) + 1 }, (_, i) => i).filter(s => s <= displayDuration);

  return (
    <div
      ref={scrollContainerRef}
      style={{ overflowX: 'auto', overflowY: 'hidden' }}
    >
    {/* Inner track — width = fixed px/s × duration (minWidth fills container) */}
    <div
      ref={trackRef}
      onPointerDown={handleTrackPointerDown}
      onPointerMove={handleTrackPointerMove}
      onPointerUp={handleTrackPointerUp}
      style={{
        position: 'relative',
        padding: `12px ${TRACK_PADDING}px 12px`,
        cursor: 'crosshair',
        width: trackWidthPx,
        minWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Ruler — clipped strictly to active area */}
      <div style={{ position: 'relative', height: 18, marginBottom: 4, width: activeAreaPx, overflow: 'hidden' }}>
        {RULERS.map(s => (
          <div key={s} style={{
            position: 'absolute', left: s * effectivePxPerSec,
            top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
            transform: 'translateX(-50%)', pointerEvents: 'none',
          }}>
            <div style={{ width: 1, height: 5, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1, fontFamily: 'monospace' }}>{s}s</span>
          </div>
        ))}
        {/* 0.5s sub-ticks, filtered to within active area */}
        {Array.from({ length: Math.ceil(displayDuration * 2) - 1 }, (_, i) => (i + 1) * 0.5)
          .filter(s => s <= displayDuration && s % 1 !== 0)
          .map(s => (
          <div key={s} style={{
            position: 'absolute', left: s * effectivePxPerSec,
            top: 0, transform: 'translateX(-50%)', pointerEvents: 'none',
          }}>
            <div style={{ width: 1, height: 3, background: 'rgba(255,255,255,0.12)' }} />
          </div>
        ))}
        {/* End-of-duration mark (always visible, orange) */}
        <div style={{
          position: 'absolute', left: displayDuration * effectivePxPerSec,
          top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
          transform: 'translateX(-50%)', pointerEvents: 'none',
        }}>
          <div style={{ width: 1, height: 8, background: 'rgba(249,115,22,0.6)' }} />
        </div>
      </div>

      {children}

      {/* Playhead — absolute pixel position within active area */}
      <div style={{
        position: 'absolute',
        left: TRACK_PADDING + currentTime * effectivePxPerSec,
        top: 0, bottom: 0, width: 1,
        background: '#f97316', pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 9, height: 9, background: '#f97316',
          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
        }} />
      </div>

      {/* ── Duration end-cap drag handle — moves with duration ── */}
      <div
        className="dur-end-cap"
        onPointerDown={durationDrag.onPointerDown}
        onPointerMove={durationDrag.onPointerMove}
        onPointerUp={durationDrag.onPointerUp}
        title={`Duración: ${displayDuration % 1 === 0 ? displayDuration : displayDuration.toFixed(1)}s — Arrastra para cambiar`}
        style={{
          position: 'absolute',
          left: TRACK_PADDING + activeAreaPx - 7,
          top: 34, height: 44,
          width: 14,
          cursor: 'ew-resize',
          zIndex: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'none',
        }}
      >
        {/* Vertical bar with grip dots */}
        <div
          className="dur-end-bar"
          style={{
            width: 4,
            height: '100%',
            background: isDraggingDuration ? '#06b6d4' : 'rgba(6,182,212,0.45)',
            borderRadius: 3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            transition: isDraggingDuration ? 'none' : 'background 0.15s',
            boxShadow: isDraggingDuration ? '0 0 8px rgba(6,182,212,0.6)' : 'none',
          }}
        >
          <div style={{ width: 1.5, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.75)' }} />
          <div style={{ width: 1.5, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.75)' }} />
          <div style={{ width: 1.5, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.75)' }} />
        </div>

        {/* Tooltip shown while dragging */}
        {isDraggingDuration && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%', transform: 'translateX(-50%)',
            background: '#1a1d1f',
            border: '1px solid rgba(6,182,212,0.4)',
            borderRadius: 5, padding: '3px 8px',
            fontSize: 11, fontFamily: 'monospace', color: '#06b6d4', fontWeight: 700,
            whiteSpace: 'nowrap', pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            {displayDuration % 1 === 0 ? `${displayDuration}s` : `${displayDuration.toFixed(1)}s`}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
