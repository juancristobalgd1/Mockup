import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';
import { ANIMATION_TEMPLATES, buildPresetKeyframes, buildTemplateKeyframes } from './timelineAnimations';
import { PX_PER_SEC, TIMELINE_BG, buildTimelineScenes, sortKeyframesByTime } from './timelineUtils';
import { useTimelinePlayback } from './useTimelinePlayback';
import { useLiveRecording } from './useLiveRecording';
import { useDurationDrag, useSegmentDrag } from './useTimelineDrags';
import { TimelineCollapsedStrip, TimelineToolbar } from './TimelineToolbar';
import { TimelineTrack } from './TimelineTrack';
import { CameraTrack } from './CameraTrack';
import { KeyframeInspector } from './KeyframeInspector';

export interface MovieTimelineHandle {
  startPlayback: () => void;
  stopPlayback: () => void;
  resetTime: () => void;
}

interface MovieTimelineProps {
  viewerRef: React.RefObject<Device3DViewerHandle | null>;
  movieTimeRef: React.MutableRefObject<number>;
  onClose: () => void;
  onPlayingChange?: (playing: boolean) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  hideManualKeyframeButton?: boolean;
  forceCollapsed?: boolean;
}

export const MovieTimeline = forwardRef<MovieTimelineHandle, MovieTimelineProps>(function MovieTimeline({
  viewerRef, movieTimeRef, onClose, onPlayingChange, onCollapsedChange,
  hideManualKeyframeButton = false, forceCollapsed
}, ref) {
  const { state, updateState, addCameraKeyframe, removeCameraKeyframe, clearCameraKeyframes } = useApp();
  const { cameraKeyframes, movieDuration } = state;

  const [activeKfId, setActiveKfId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { onCollapsedChange?.(collapsed); }, [collapsed, onCollapsedChange]);
  useEffect(() => { if (forceCollapsed) setCollapsed(true); }, [forceCollapsed]);
  const [timelineZoom, setTimelineZoom] = useState(1);
  // Pixel-based scale (responds to zoom, NOT to duration)
  const effectivePxPerSec = PX_PER_SEC * timelineZoom;

  const { currentTime, isPlaying, seek, startPlayback, stopPlayback } =
    useTimelinePlayback({ movieTimeRef, movieDuration, onPlayingChange });
  const { liveRecording, liveTime, startLiveRec, stopLiveRec } = useLiveRecording({ viewerRef, seek });
  const { dragPreviewKeyframes, segmentDrag } = useSegmentDrag({ effectivePxPerSec, seek, setActiveKfId });
  const { visualDuration, isDraggingDuration, durationDrag } = useDurationDrag({ timelineZoom, movieTimeRef, seek });

  // displayDuration: what we render. Uses local visual state during drag, store value otherwise.
  const displayDuration = visualDuration ?? movieDuration;
  const timelineKeyframes = sortKeyframesByTime(dragPreviewKeyframes ?? cameraKeyframes);
  const activeKf = timelineKeyframes.find(k => k.id === activeKfId) ?? null;
  const cameraScenes = buildTimelineScenes(timelineKeyframes);

  // Soundtrack follows timeline playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!audioRef.current || !state.audioUrl) return;
    audioRef.current.volume = (state.audioVolume ?? 80) / 100;
    if (isPlaying) {
      audioRef.current.currentTime = movieTimeRef.current;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, state.audioUrl, state.audioVolume, movieTimeRef]);

  // Expose imperative handle so RightPanel can drive playback during export
  useImperativeHandle(ref, () => ({
    startPlayback,
    stopPlayback,
    resetTime: () => seek(0),
  }), [startPlayback, stopPlayback, seek]);

  const togglePlayback = () => { isPlaying ? stopPlayback() : startPlayback(); };

  const handleAddKeyframe = useCallback(() => {
    const cam = viewerRef.current?.getCameraState();
    if (!cam) return;
    addCameraKeyframe({ time: movieTimeRef.current, position: cam.position, target: cam.target });
  }, [addCameraKeyframe, movieTimeRef, viewerRef]);

  const handleDuplicateKeyframe = useCallback((kf: CameraKeyframe) => {
    const newTime = Math.min(kf.time + 0.5, movieDuration);
    addCameraKeyframe({ time: newTime, position: kf.position, target: kf.target, easing: kf.easing, label: kf.label ? `${kf.label} (copia)` : undefined });
  }, [addCameraKeyframe, movieDuration]);

  const handleApplyPreset = useCallback((presetId: string) => {
    const getCam = () => viewerRef.current?.getCameraState() ?? null;
    const keyframes = buildPresetKeyframes(presetId, getCam, movieDuration);
    if (keyframes.length === 0) return;

    if (cameraKeyframes.length === 0) {
      clearCameraKeyframes();
      keyframes.forEach(kf => addCameraKeyframe(kf));
      seek(0);
      setActiveKfId(null);
      return;
    }

    const APPEND_GAP = 0.15;
    const lastTime = cameraKeyframes[cameraKeyframes.length - 1]?.time ?? 0;
    const appendedKeyframes = keyframes.map(kf => ({
      ...kf,
      time: kf.time + lastTime + APPEND_GAP,
    }));
    const appendedEnd = appendedKeyframes[appendedKeyframes.length - 1]?.time ?? lastTime;
    const nextDuration = Math.max(movieDuration, Math.ceil(appendedEnd * 2) / 2);

    if (nextDuration !== movieDuration) {
      updateState({ movieDuration: nextDuration });
    }

    appendedKeyframes.forEach(kf => addCameraKeyframe(kf));
    seek(appendedKeyframes[0]?.time ?? lastTime);
    setActiveKfId(null);
  }, [addCameraKeyframe, cameraKeyframes, clearCameraKeyframes, movieDuration, seek, updateState, viewerRef]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const getCam = () => viewerRef.current?.getCameraState() ?? null;
    const { keyframes, duration } = buildTemplateKeyframes(templateId, getCam);
    if (keyframes.length === 0) return;
    const sceneId = Math.random().toString(36).substr(2, 9);
    const template = ANIMATION_TEMPLATES.find(t => t.id === templateId);
    const sceneLabel = template?.label ?? 'Template';
    const nextDuration = Math.max(movieDuration, Math.ceil(duration));
    const nextKeyframes = keyframes.map((kf, i) => ({
      ...kf,
      sceneId,
      sceneLabel,
      sceneSource: 'preset' as const,
      label: i === 0 ? sceneLabel : undefined,
      id: Math.random().toString(36).substr(2, 9),
    }));
    updateState({
      movieDuration: nextDuration,
      cameraKeyframes: nextKeyframes,
    });
    seek(0);
    setActiveKfId(null);
  }, [movieDuration, seek, updateState, viewerRef]);

  return (
    <div style={{
      width: '100%', background: TIMELINE_BG,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0, userSelect: 'none',
      transition: 'background 0.3s',
    }}>
      {state.audioUrl && <audio ref={audioRef} src={state.audioUrl} preload="auto" />}

      {collapsed ? (
        <TimelineCollapsedStrip
          keyframeCount={cameraKeyframes.length}
          isPlaying={isPlaying}
          liveRecording={liveRecording}
          currentTime={currentTime}
          displayDuration={displayDuration}
          onTogglePlayback={togglePlayback}
          onExpand={() => setCollapsed(false)}
        />
      ) : (
        <>
          <TimelineToolbar
            keyframeCount={cameraKeyframes.length}
            isPlaying={isPlaying}
            liveRecording={liveRecording}
            liveTime={liveTime}
            currentTime={currentTime}
            displayDuration={displayDuration}
            isDraggingDuration={isDraggingDuration}
            timelineZoom={timelineZoom}
            setTimelineZoom={setTimelineZoom}
            onTogglePlayback={togglePlayback}
            onStop={() => { stopPlayback(); seek(0); }}
            onStartRecording={startLiveRec}
            onStopRecording={stopLiveRec}
            onClearKeyframes={() => { stopPlayback(); clearCameraKeyframes(); setActiveKfId(null); }}
            onApplyPreset={handleApplyPreset}
            onApplyTemplate={handleApplyTemplate}
            onCollapse={() => setCollapsed(true)}
            onClose={() => { stopLiveRec(); stopPlayback(); onClose(); }}
          />

          <TimelineTrack
            currentTime={currentTime}
            displayDuration={displayDuration}
            movieDuration={movieDuration}
            effectivePxPerSec={effectivePxPerSec}
            isDraggingDuration={isDraggingDuration}
            seek={seek}
            durationDrag={durationDrag}
          >
            <CameraTrack
              scenes={cameraScenes}
              timelineKeyframes={timelineKeyframes}
              activeAreaPx={displayDuration * effectivePxPerSec}
              effectivePxPerSec={effectivePxPerSec}
              isDraggingDuration={isDraggingDuration}
              activeKfId={activeKfId}
              setActiveKfId={setActiveKfId}
              currentTime={currentTime}
              isPlaying={isPlaying}
              segmentDrag={segmentDrag}
            />
          </TimelineTrack>

          {activeKf && (
            <KeyframeInspector
              key={activeKf.id}
              activeKf={activeKf}
              showAddKeyframe={!liveRecording && !hideManualKeyframeButton}
              onAddKeyframe={handleAddKeyframe}
              onDuplicate={() => handleDuplicateKeyframe(activeKf)}
              onDelete={() => { removeCameraKeyframe(activeKf.id); setActiveKfId(null); }}
            />
          )}
        </>
      )}

      <style>{`
        @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .dur-end-cap:hover .dur-end-bar { background: rgba(6,182,212,0.75) !important; }
        .dur-end-cap:active .dur-end-bar { background: #06b6d4 !important; box-shadow: 0 0 10px rgba(6,182,212,0.7) !important; }
        @keyframes kf-pulse { 0% { transform: translate(-50%,-50%) rotate(45deg) scale(1); } 40% { transform: translate(-50%,-50%) rotate(45deg) scale(1.6); } 100% { transform: translate(-50%,-50%) rotate(45deg) scale(1); } }
        @keyframes kf-pulse-plain { 0% { transform: rotate(45deg) scale(1); } 40% { transform: rotate(45deg) scale(1.5); } 100% { transform: rotate(45deg) scale(1); } }
      `}</style>
    </div>
  );
});
