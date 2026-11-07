import type { CameraKeyframe } from '../../store';

export const TRACK_PADDING = 24;
export const PX_PER_SEC = 80; // fixed pixels per second at 1× zoom
export const MIN_SEGMENT_DURATION = 0.25;
export const TIMELINE_BG = '#161819';

export function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s - Math.floor(s)) * 10);
  return `${m > 0 ? `${m}:` : ''}${sec.toString().padStart(2, '0')}.${cs}`;
}

export function formatTime(s: number) {
  const sec = Math.floor(s);
  const ms = Math.floor((s - sec) * 100);
  return `${sec}.${ms.toString().padStart(2, '0')}s`;
}

export type TimelineScene = {
  index: number;
  startIndex: number;
  endIndex: number;
  start: CameraKeyframe;
  end: CameraKeyframe;
  keyframes: CameraKeyframe[];
  label: string;
  sceneId?: string;
};

export function sortKeyframesByTime<T extends { time: number }>(keyframes: T[]) {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

export function snapTimelineTime(time: number) {
  return Math.round(time * 20) / 20;
}

export function buildTimelineScenes(keyframes: CameraKeyframe[]) {
  const scenes: TimelineScene[] = [];
  let sceneNumber = 1;

  for (let i = 0; i < keyframes.length; i += 1) {
    const current = keyframes[i];

    if (current.sceneId) {
      let endIndex = i;
      while (endIndex + 1 < keyframes.length && keyframes[endIndex + 1].sceneId === current.sceneId) {
        endIndex += 1;
      }
      const sceneKeyframes = keyframes.slice(i, endIndex + 1);
      scenes.push({
        index: scenes.length,
        startIndex: i,
        endIndex,
        start: sceneKeyframes[0],
        end: sceneKeyframes[sceneKeyframes.length - 1],
        keyframes: sceneKeyframes,
        label: current.sceneLabel || current.label || `Escena ${sceneNumber}`,
        sceneId: current.sceneId,
      });
      sceneNumber += 1;
      i = endIndex;
      continue;
    }

    if (i < keyframes.length - 1) {
      const sceneKeyframes = keyframes.slice(i, i + 2);
      scenes.push({
        index: scenes.length,
        startIndex: i,
        endIndex: i + 1,
        start: sceneKeyframes[0],
        end: sceneKeyframes[1],
        keyframes: sceneKeyframes,
        label: current.sceneLabel || current.label || keyframes[i + 1].label || `Animación ${scenes.length + 1}`,
      });
      continue;
    }

    scenes.push({
      index: scenes.length,
      startIndex: i,
      endIndex: i,
      start: current,
      end: current,
      keyframes: [current],
      label: current.sceneLabel || current.label || `Escena ${sceneNumber}`,
      sceneId: current.sceneId,
    });
    sceneNumber += 1;
  }

  return scenes;
}
