import { useCallback, useRef, useState } from 'react';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
import { MIN_SEGMENT_DURATION, PX_PER_SEC, snapTimelineTime, sortKeyframesByTime } from './timelineUtils';

export type SegmentDrag = {
  start: (e: React.PointerEvent<HTMLDivElement>, startIndex: number, endIndex: number, mode: 'move' | 'resize-start' | 'resize-end') => void;
  move: (e: React.PointerEvent<HTMLDivElement>) => void;
  finish: () => void;
};

// Moving and resizing scene bars. The drag edits a local preview and commits
// the result to the store once, on pointer up.
export function useSegmentDrag({ effectivePxPerSec, seek, setActiveKfId }: {
  effectivePxPerSec: number;
  seek: (time: number) => void;
  setActiveKfId: (id: string | null) => void;
}) {
  const { state: { cameraKeyframes, movieDuration }, updateState } = useApp();
  const [dragPreviewKeyframes, setDragPreviewKeyframes] = useState<CameraKeyframe[] | null>(null);
  const segmentDragRef = useRef<{
    mode: 'move' | 'resize-start' | 'resize-end';
    startIndex: number;
    endIndex: number;
    startX: number;
    keyframes: CameraKeyframe[];
  } | null>(null);

  const startSegmentDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, startIndex: number, endIndex: number, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    segmentDragRef.current = {
      mode,
      startIndex,
      endIndex,
      startX: e.clientX,
      keyframes: sortKeyframesByTime(cameraKeyframes),
    };
    setDragPreviewKeyframes(sortKeyframesByTime(cameraKeyframes));
  }, [cameraKeyframes]);

  const handleSegmentPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!segmentDragRef.current) return;
    e.stopPropagation();

    const drag = segmentDragRef.current;
    const nextKeyframes = drag.keyframes.map(kf => ({ ...kf }));
    const deltaSeconds = (e.clientX - drag.startX) / effectivePxPerSec;
    const { startIndex, endIndex } = drag;
    const round = (value: number) => snapTimelineTime(value);
    const originalStart = drag.keyframes[startIndex].time;
    const originalEnd = drag.keyframes[endIndex].time;
    const originalDuration = Math.max(originalEnd - originalStart, MIN_SEGMENT_DURATION);

    if (drag.mode === 'move') {
      const prevBound = startIndex > 0 ? drag.keyframes[startIndex - 1].time + MIN_SEGMENT_DURATION : 0;
      const nextBound = endIndex < drag.keyframes.length - 1 ? drag.keyframes[endIndex + 1].time - MIN_SEGMENT_DURATION : movieDuration;
      const minDelta = prevBound - originalStart;
      const maxDelta = nextBound - originalEnd;
      const appliedDelta = Math.max(minDelta, Math.min(maxDelta, deltaSeconds));
      for (let i = startIndex; i <= endIndex; i += 1) {
        nextKeyframes[i].time = round(drag.keyframes[i].time + appliedDelta);
      }
      seek(nextKeyframes[startIndex].time);
    }

    if (drag.mode === 'resize-start') {
      const prevBound = startIndex > 0 ? drag.keyframes[startIndex - 1].time + MIN_SEGMENT_DURATION : 0;
      const nextBound = originalEnd - MIN_SEGMENT_DURATION;
      const newStart = round(Math.max(prevBound, Math.min(nextBound, originalStart + deltaSeconds)));
      const scale = (originalEnd - newStart) / originalDuration;
      for (let i = startIndex; i <= endIndex; i += 1) {
        const offset = drag.keyframes[i].time - originalStart;
        nextKeyframes[i].time = round(newStart + offset * scale);
      }
      seek(nextKeyframes[startIndex].time);
      setActiveKfId(nextKeyframes[startIndex].id);
    }

    if (drag.mode === 'resize-end') {
      const prevBound = originalStart + MIN_SEGMENT_DURATION;
      const nextBound = endIndex < drag.keyframes.length - 1 ? drag.keyframes[endIndex + 1].time - MIN_SEGMENT_DURATION : movieDuration;
      const newEnd = round(Math.max(prevBound, Math.min(nextBound, originalEnd + deltaSeconds)));
      const scale = (newEnd - originalStart) / originalDuration;
      for (let i = startIndex; i <= endIndex; i += 1) {
        const offset = drag.keyframes[i].time - originalStart;
        nextKeyframes[i].time = round(originalStart + offset * scale);
      }
      seek(nextKeyframes[endIndex].time);
      setActiveKfId(nextKeyframes[endIndex].id);
    }

    setDragPreviewKeyframes(sortKeyframesByTime(nextKeyframes));
  }, [effectivePxPerSec, movieDuration, seek, setActiveKfId]);

  const finishSegmentDrag = useCallback(() => {
    if (!segmentDragRef.current) return;
    const next = sortKeyframesByTime(dragPreviewKeyframes ?? segmentDragRef.current.keyframes);
    segmentDragRef.current = null;
    setDragPreviewKeyframes(null);
    updateState({ cameraKeyframes: next });
  }, [dragPreviewKeyframes, updateState]);

  const segmentDrag: SegmentDrag = { start: startSegmentDrag, move: handleSegmentPointerMove, finish: finishSegmentDrag };
  return { dragPreviewKeyframes, segmentDrag };
}

export type DurationDrag = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
};

// Dragging the end-cap to change the movie duration.
// visualDuration: local state used ONLY during drag for instant visual feedback.
// We avoid calling updateState (store) on every pixel move because that triggers
// a full re-render cascade that recreates the memoized handlers and breaks the drag.
// We commit the final value to the store only once, on pointerUp.
export function useDurationDrag({ timelineZoom, movieTimeRef, seek }: {
  timelineZoom: number;
  movieTimeRef: React.MutableRefObject<number>;
  seek: (time: number) => void;
}) {
  const { state: { movieDuration }, updateState } = useApp();
  const durationDragRef = useRef<{ startX: number; startDuration: number; pps: number; currentDuration: number } | null>(null);
  const [isDraggingDuration, setIsDraggingDuration] = useState(false);
  const [visualDuration, setVisualDuration] = useState<number | null>(null);

  const handleDurationPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    durationDragRef.current = {
      startX: e.clientX,
      startDuration: movieDuration,
      pps: PX_PER_SEC * timelineZoom,
      currentDuration: movieDuration,
    };
    setVisualDuration(movieDuration);
    setIsDraggingDuration(true);
  }, [movieDuration, timelineZoom]);

  const handleDurationPointerMove = useCallback((e: React.PointerEvent) => {
    if (!durationDragRef.current) return;
    const { startX, startDuration, pps } = durationDragRef.current;
    const delta = e.clientX - startX;
    const raw = startDuration + delta / pps;
    const snapped = Math.round(raw * 2) / 2;
    const newDuration = Math.max(1, Math.min(120, snapped));
    // Only update local visual state — no store update on every pixel
    durationDragRef.current.currentDuration = newDuration;
    setVisualDuration(newDuration);
    if (movieTimeRef.current > newDuration) seek(newDuration);
  }, [movieTimeRef, seek]);

  const handleDurationPointerUp = useCallback(() => {
    const final = durationDragRef.current?.currentDuration ?? movieDuration;
    durationDragRef.current = null;
    setVisualDuration(null);
    setIsDraggingDuration(false);
    // Commit final value to store (single history entry for the whole drag)
    updateState({ movieDuration: final });
  }, [movieDuration, updateState]);

  const durationDrag: DurationDrag = {
    onPointerDown: handleDurationPointerDown,
    onPointerMove: handleDurationPointerMove,
    onPointerUp: handleDurationPointerUp,
  };
  return { visualDuration, isDraggingDuration, durationDrag };
}
