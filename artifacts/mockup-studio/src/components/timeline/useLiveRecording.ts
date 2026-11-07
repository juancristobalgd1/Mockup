import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';

// GRABAR: samples the camera every frame while the user moves the device,
// then stores the take as one recorded scene.
export function useLiveRecording({ viewerRef, seek }: {
  viewerRef: React.RefObject<Device3DViewerHandle | null>;
  seek: (time: number) => void;
}) {
  const { state: { cameraKeyframes, movieDuration }, updateState } = useApp();
  const [liveRecording, setLiveRecording] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const liveStartRef = useRef<number>(0);
  const liveTimerRafRef = useRef<number | null>(null);
  const capturedFramesRef = useRef<Omit<CameraKeyframe, 'id'>[]>([]);

  useEffect(() => () => {
    if (liveTimerRafRef.current) cancelAnimationFrame(liveTimerRafRef.current);
  }, []);

  const startLiveRec = useCallback(() => {
    if (liveTimerRafRef.current) return; // Already recording
    capturedFramesRef.current = [];
    liveStartRef.current = performance.now();
    setLiveTime(0);
    setLiveRecording(true);
    
    const captureFrame = () => {
      const t = (performance.now() - liveStartRef.current) / 1000;
      setLiveTime(t);
      
      const cam = viewerRef.current?.getCameraState();
      if (cam) {
        capturedFramesRef.current.push({ time: t, position: cam.position, target: cam.target });
      }
      
      liveTimerRafRef.current = requestAnimationFrame(captureFrame);
    };
    
    liveTimerRafRef.current = requestAnimationFrame(captureFrame);
  }, [viewerRef]);

  const stopLiveRec = useCallback(() => {
    // Stop the RAF loop
    setLiveRecording(false);
    if (liveTimerRafRef.current) { 
      cancelAnimationFrame(liveTimerRafRef.current); 
      liveTimerRafRef.current = null; 
    }
    
    const frames = capturedFramesRef.current;
    if (frames.length === 0) return;

    const totalTime = frames[frames.length - 1].time;
    const sampled: Omit<CameraKeyframe, 'id'>[] = [];
    
    // Closer sampling (80ms) preserves the nuance of manual movement 
    // while keeping the keyframe count manageable for the spline.
    const STEP = 0.08; 
    let nextKeep = 0;

    for (const frame of frames) {
      if (frame.time >= nextKeep) {
        sampled.push(frame);
        nextKeep = frame.time + STEP;
      }
    }
    const last = frames[frames.length - 1];
    if (sampled.length === 0 || Math.abs(sampled[sampled.length - 1].time - last.time) > 0.05) {
      sampled.push(last);
    }
    const sceneId = Math.random().toString(36).substr(2, 9);
    const sceneNumber = new Set(cameraKeyframes.map(kf => kf.sceneId).filter(Boolean)).size + 1;
    const sceneLabel = `Scene ${sceneNumber}`;
    const newDuration = Math.max(movieDuration, Math.ceil(totalTime));
    const nextCameraKeyframes = [
      ...cameraKeyframes.filter(existing => sampled.every(frame => Math.abs(existing.time - frame.time) > 0.1)),
      ...sampled.map((frame, index) => ({
        ...frame,
        sceneId,
        sceneLabel,
        sceneSource: 'recording' as const,
        easing: 'smooth' as const,
        label: index === 0 ? sceneLabel : frame.label,
        id: Math.random().toString(36).substr(2, 9),
      })),
    ].sort((a, b) => a.time - b.time);

    updateState({
      movieDuration: newDuration,
      cameraKeyframes: nextCameraKeyframes,
    });
    seek(0);
    setLiveRecording(false);
    capturedFramesRef.current = [];
  }, [cameraKeyframes, movieDuration, seek, updateState]);

  return { liveRecording, liveTime, startLiveRec, stopLiveRec };
}
