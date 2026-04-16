import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Plus, Trash2, Circle, X, Square, Sparkles, Copy, ChevronDown, ChevronUp, Palette, ZoomIn, ZoomOut, Volume2, VolumeX, Music } from 'lucide-react';
import { useApp } from '../../store';
import type { CameraKeyframe, EasingType } from '../../store';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';

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

const EASING_OPTIONS: { value: EasingType; label: string; desc: string }[] = [
  { value: 'smooth',      label: 'Suave',      desc: 'Entrada y salida suave (curva clásica)' },
  { value: 'expo-in-out',  label: 'Exponencial', desc: 'Aceleración y frenada ultra agresiva' },
  { value: 'back-out',     label: 'Overshoot',   desc: 'Efecto elástico que se pasa del destino' },
  { value: 'linear',      label: 'Lineal',     desc: 'Velocidad constante' },
  { value: 'ease-in',     label: 'Acelerar',   desc: 'Empieza lento, termina rápido' },
  { value: 'ease-out',    label: 'Frenar',     desc: 'Empieza rápido, termina lento' },
  { value: 'elastic',     label: 'Elástico',   desc: 'Rebote elástico al final' },
  { value: 'bounce',      label: 'Rebote',     desc: 'Rebote físico al llegar' },
  { value: 'bezier',      label: 'Cubic Bezier', desc: 'Control total de la curva' },
];


function buildPresetKeyframes(preset: string, getCam: () => { position: [number,number,number]; target: [number,number,number] } | null, duration: number): Omit<CameraKeyframe, 'id'>[] {
  const cam = getCam();
  if (!cam) return [];

  const [px, py, pz] = cam.position;
  const [tx, ty, tz] = cam.target;
  const dist = Math.sqrt(px*px + py*py + pz*pz);
  const nx = dist > 0 ? px / dist : 0;
  const ny = dist > 0 ? py / dist : 1;
  const nz = dist > 0 ? pz / dist : 0;
  const dirX = tx - px;
  const dirY = ty - py;
  const dirZ = tz - pz;
  const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
  const fx = dirX / dirLen;
  const fy = dirY / dirLen;
  const fz = dirZ / dirLen;
  const rawRightX = fz;
  const rawRightZ = -fx;
  const rawRightLen = Math.sqrt(rawRightX * rawRightX + rawRightZ * rawRightZ) || 1;
  const rx = rawRightX / rawRightLen;
  const ry = 0;
  const rz = rawRightZ / rawRightLen;

  switch (preset) {
    case 'zoom-in': return [
      { time: 0, position: [px * 1.9, py * 1.9, pz * 1.9], target: [tx, ty, tz], easing: 'ease-out' },
      { time: duration, position: [px * 0.85, py * 0.85, pz * 0.85], target: [tx, ty, tz], easing: 'ease-out' },
    ];
    case 'zoom-out': return [
      { time: 0, position: [px * 0.85, py * 0.85, pz * 0.85], target: [tx, ty, tz], easing: 'ease-in' },
      { time: duration, position: [px * 1.9, py * 1.9, pz * 1.9], target: [tx, ty, tz], easing: 'ease-in' },
    ];
    case 'orbit': {
      const steps = 5;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const angle = (i / steps) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rpx = px * cos - pz * sin;
        const rpz = px * sin + pz * cos;
        return { time: (i / steps) * duration, position: [rpx, py, rpz] as [number,number,number], target: [tx, ty, tz], easing: 'linear' as EasingType };
      });
    }
    case 'reveal-below': {
      const belowDist = dist * 1.3;
      return [
        { time: 0, position: [nx * belowDist * 0.4, -belowDist * 0.8, nz * belowDist] as [number,number,number], target: [tx, ty, tz], easing: 'ease-out' },
        { time: duration * 0.7, position: [px, py, pz], target: [tx, ty, tz], easing: 'ease-out' },
        { time: duration, position: [px * 0.9, py * 0.9, pz * 0.9], target: [tx, ty, tz], easing: 'ease-out' },
      ];
    }
    case 'overhead': return [
      { time: 0, position: [nx * dist * 0.2, dist * 1.4, nz * dist * 0.2] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration * 0.55, position: [px, py, pz], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration, position: [px * 0.9, py * 0.9, pz * 0.9], target: [tx, ty, tz], easing: 'ease-out' },
    ];
    case 'cinematic-push': return [
      { time: 0, position: [px + nx * 2.5, py + ny * 2.5, pz + nz * 2.5] as [number,number,number], target: [tx, ty, tz], easing: 'ease-out' },
      { time: duration, position: [px - nx * 0.3, py - ny * 0.3, pz - nz * 0.3] as [number,number,number], target: [tx, ty, tz], easing: 'ease-out' },
    ];
    case 'side-sweep': return [
      { time: 0, position: [-Math.abs(dist), py, pz * 0.3] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration * 0.5, position: [px, py, pz] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration, position: [Math.abs(dist), py, pz * 0.3] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
    ];
    case 'hero-arc': return [
      { time: 0, position: [px - rx * dist * 0.95, py + dist * 0.42, pz - rz * dist * 0.95] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration * 0.55, position: [px - rx * dist * 0.18, py + dist * 0.12, pz - rz * dist * 0.18] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration, position: [px * 0.9, py * 0.96, pz * 0.9] as [number,number,number], target: [tx, ty, tz], easing: 'ease-out' },
    ];
    case 'spiral-in': {
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const angle = Math.PI * 1.35 * (1 - t);
        const radius = dist * (1.9 - t * 1.05);
        const y = py + (0.55 - t * 0.42) * dist;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const spiralX = px * cos - pz * sin;
        const spiralZ = px * sin + pz * cos;
        return {
          time: t * duration,
          position: [spiralX * (radius / Math.max(dist, 0.001)), y, spiralZ * (radius / Math.max(dist, 0.001))] as [number, number, number],
          target: [tx, ty, tz],
          easing: 'smooth' as EasingType,
        };
      });
    }
    case 'whip-pan': return [
      { time: 0, position: [px - rx * dist * 1.5, py + dist * 0.1, pz - rz * dist * 1.5] as [number,number,number], target: [tx, ty, tz], easing: 'expo-in-out' },
      { time: duration * 0.45, position: [px + rx * dist * 0.9, py - dist * 0.05, pz + rz * dist * 0.9] as [number,number,number], target: [tx, ty, tz], easing: 'back-out' },
      { time: duration, position: [px + rx * dist * 0.18, py, pz + rz * dist * 0.18] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
    ];
    case 'macro-float': return [
      { time: 0, position: [px * 0.5, py * 0.5, pz * 0.5], target: [tx + 0.1, ty + 0.1, tz], easing: 'smooth' },
      { time: duration, position: [px * 0.42, py * 0.42, pz * 0.42], target: [tx - 0.1, ty - 0.1, tz], easing: 'smooth' },
    ];
    case 'top-down-orbit': {
      const steps = 4;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const angle = t * Math.PI * 0.5;
        const radius = dist * 0.5;
        return {
          time: t * duration,
          position: [radius * Math.cos(angle), dist * 1.2, radius * Math.sin(angle)] as [number, number, number],
          target: [0, 0, 0],
          easing: 'smooth' as EasingType,
        };
      });
    }

    case 'float-rise': return [
      { time: 0, position: [px - rx * dist * 0.22, py + dist * 0.3, pz - rz * dist * 0.22] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration * 0.6, position: [px + rx * dist * 0.15, py - dist * 0.08, pz + rz * dist * 0.15] as [number,number,number], target: [tx, ty, tz], easing: 'smooth' },
      { time: duration, position: [px * 0.92, py * 0.92, pz * 0.92] as [number,number,number], target: [tx, ty, tz], easing: 'ease-out' },
    ];
    default: return [];
  }
}

const ANIMATION_PRESETS = [
  { id: 'zoom-in',        label: 'Zoom In',          desc: 'Acercamiento suave' },
  { id: 'zoom-out',       label: 'Zoom Out',          desc: 'Alejamiento suave' },
  { id: 'orbit',          label: 'Órbita 360°',       desc: 'Gira alrededor del dispositivo' },
  { id: 'reveal-below',   label: 'Revelar desde abajo', desc: 'Surge desde el suelo' },
  { id: 'overhead',       label: 'Vista aérea',       desc: 'Desde arriba hacia frente' },
  { id: 'cinematic-push', label: 'Dolly Push',        desc: 'Empuje cinematográfico' },
  { id: 'side-sweep',     label: 'Barrido lateral',   desc: 'Izquierda → centro → derecha' },
  { id: 'hero-arc',       label: 'Hero Arc',          desc: 'Arco diagonal con llegada hero' },
  { id: 'spiral-in',      label: 'Espiral In',        desc: 'Entrada en espiral hacia el producto' },
  { id: 'whip-pan',       label: 'Whip Pan',          desc: 'Barrido veloz con overshoot' },
  { id: 'float-rise',     label: 'Float Rise',        desc: 'Flota y asciende con suavidad' },
  { id: 'macro-float',    label: 'Macro Detail',      desc: 'Primer plano lento y elegante' },
  { id: 'top-down-orbit', label: 'Cenital Orbit',     desc: 'Órbita desde vista superior' },
];


// ── Complete animation templates (multi-scene) ────────────────────
const ANIMATION_TEMPLATES = [
  { id: 'product-showcase', label: 'Product Showcase', desc: 'Reveal + spin + zoom hero', icon: '🎬', duration: 8 },
  { id: 'app-store-preview', label: 'App Store Preview', desc: 'Perfecto para App Store videos', icon: '📱', duration: 6 },
  { id: 'social-spin',     label: 'Social Spin',       desc: 'Giro rápido ideal para reels', icon: '🔄', duration: 4 },
  { id: 'hero-landing',    label: 'Hero Landing',      desc: 'Caída dramática desde arriba', icon: '🦸', duration: 5 },
  { id: 'presentation',    label: 'Presentation',      desc: 'Elegante para slides y decks', icon: '📊', duration: 7 },
];

function buildTemplateKeyframes(
  templateId: string,
  getCam: () => { position: [number, number, number]; target: [number, number, number] } | null,
): { keyframes: Omit<CameraKeyframe, 'id'>[]; duration: number } {
  const cam = getCam();
  if (!cam) return { keyframes: [], duration: 5 };
  const [px, py, pz] = cam.position;
  const [tx, ty, tz] = cam.target;
  const dist = Math.sqrt(px * px + py * py + pz * pz);

  const template = ANIMATION_TEMPLATES.find(t => t.id === templateId);
  const dur = template?.duration ?? 5;

  switch (templateId) {
    case 'product-showcase': return {
      duration: dur,
      keyframes: [
        { time: 0,       position: [px * 2.2, py + dist * 0.8, pz * 2.2], target: [tx, ty, tz], easing: 'ease-out' },
        { time: dur*0.25, position: [px, py, pz],                          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.5,  position: [-pz * 1.1, py * 0.95, px * 1.1],     target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.75, position: [pz * 1.1, py * 0.95, -px * 1.1],     target: [tx, ty, tz], easing: 'smooth' },
        { time: dur,      position: [px * 0.85, py * 0.9, pz * 0.85],     target: [tx, ty, tz], easing: 'ease-out' },
      ],
    };
    case 'app-store-preview': return {
      duration: dur,
      keyframes: [
        { time: 0,       position: [px * 0.6, py * 0.6, pz * 0.6],       target: [tx, ty, tz], easing: 'ease-out' },
        { time: dur*0.3, position: [px * 1.1, py * 1.1, pz * 1.1],       target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.5, position: [-pz * 0.9, py, px * 0.9],            target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.7, position: [px, py, pz],                          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur,     position: [px * 0.8, py * 0.8, pz * 0.8],       target: [tx, ty, tz], easing: 'ease-out' },
      ],
    };
    case 'social-spin': {
      const steps = 8;
      return {
        duration: dur,
        keyframes: Array.from({ length: steps + 1 }, (_, i) => {
          const t = i / steps;
          const angle = t * Math.PI * 2;
          const rpx = px * Math.cos(angle) - pz * Math.sin(angle);
          const rpz = px * Math.sin(angle) + pz * Math.cos(angle);
          const rd = 1 - 0.15 * Math.sin(t * Math.PI);
          return { time: t * dur, position: [rpx * rd, py * (1 - 0.08 * Math.sin(t * Math.PI)), rpz * rd] as [number, number, number], target: [tx, ty, tz], easing: 'linear' as EasingType };
        }),
      };
    }
    case 'hero-landing': return {
      duration: dur,
      keyframes: [
        { time: 0,        position: [0, dist * 2.5, 0.1],                  target: [tx, ty, tz], easing: 'ease-out' },
        { time: dur*0.4,  position: [px * 0.5, py + dist * 0.3, pz * 0.5], target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.7,  position: [px * 1.05, py * 1.05, pz * 1.05],    target: [tx, ty, tz], easing: 'smooth' },
        { time: dur,      position: [px * 0.9, py * 0.9, pz * 0.9],       target: [tx, ty, tz], easing: 'ease-out' },
      ],
    };
    case 'presentation': return {
      duration: dur,
      keyframes: [
        { time: 0,       position: [px * 1.3, py * 1.3, pz * 1.3],       target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.2, position: [px, py, pz],                          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.4, position: [px, py, pz],                          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.55, position: [-pz * 0.95, py, px * 0.95],          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.75, position: [-pz * 0.95, py, px * 0.95],          target: [tx, ty, tz], easing: 'smooth' },
        { time: dur*0.9, position: [px * 0.85, py * 0.85, pz * 0.85],    target: [tx, ty, tz], easing: 'smooth' },
        { time: dur,     position: [px * 0.85, py * 0.85, pz * 0.85],    target: [tx, ty, tz], easing: 'ease-out' },
      ],
    };
    default: return { keyframes: [], duration: dur };
  }
}
const MIN_SEGMENT_DURATION = 0.25;

type TimelineScene = {
  index: number;
  startIndex: number;
  endIndex: number;
  start: CameraKeyframe;
  end: CameraKeyframe;
  keyframes: CameraKeyframe[];
  label: string;
  sceneId?: string;
};

function sortKeyframesByTime<T extends { time: number }>(keyframes: T[]) {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

function snapTimelineTime(time: number) {
  return Math.round(time * 20) / 20;
}

function buildTimelineScenes(keyframes: CameraKeyframe[]) {
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

const PRESET_PREVIEW_KEYFRAMES = `
@keyframes preset-preview-zoom-in {
  0% { transform: translate(-24px, 14px) rotate(-22deg) scale(0.68); }
  100% { transform: translate(4px, 4px) rotate(-8deg) scale(1.06); }
}
@keyframes preset-preview-zoom-out {
  0% { transform: translate(2px, 2px) rotate(-8deg) scale(1.05); }
  100% { transform: translate(-30px, 18px) rotate(-24deg) scale(0.6); }
}
@keyframes preset-preview-orbit {
  0% { transform: translate(-28px, 8px) rotate(-24deg) scale(0.82); }
  25% { transform: translate(6px, -6px) rotate(-8deg) scale(0.98); }
  50% { transform: translate(26px, 6px) rotate(8deg) scale(0.82); }
  75% { transform: translate(2px, 16px) rotate(16deg) scale(0.72); }
  100% { transform: translate(-28px, 8px) rotate(-24deg) scale(0.82); }
}
@keyframes preset-preview-reveal-below {
  0% { transform: translate(-8px, 68px) rotate(-8deg) scale(0.78); opacity: 0.25; }
  55% { transform: translate(-2px, 8px) rotate(-6deg) scale(0.94); opacity: 1; }
  100% { transform: translate(6px, 2px) rotate(-4deg) scale(1.04); opacity: 1; }
}
@keyframes preset-preview-overhead {
  0% { transform: translate(0px, -34px) rotate(-2deg) scale(0.55); }
  55% { transform: translate(0px, -6px) rotate(-3deg) scale(0.82); }
  100% { transform: translate(0px, 6px) rotate(-4deg) scale(1.02); }
}
@keyframes preset-preview-cinematic-push {
  0% { transform: translate(-18px, 12px) rotate(-16deg) scale(0.74); }
  100% { transform: translate(18px, -2px) rotate(-6deg) scale(1.08); }
}
@keyframes preset-preview-side-sweep {
  0% { transform: translate(-58px, 8px) rotate(-18deg) scale(0.88); }
  50% { transform: translate(0px, 0px) rotate(-10deg) scale(1); }
  100% { transform: translate(58px, 8px) rotate(-2deg) scale(0.88); }
}
@keyframes preset-preview-hero-arc {
  0% { transform: translate(-44px, -18px) rotate(-24deg) scale(0.72); }
  55% { transform: translate(-10px, 2px) rotate(-11deg) scale(0.92); }
  100% { transform: translate(10px, 10px) rotate(-3deg) scale(1.04); }
}
@keyframes preset-preview-spiral-in {
  0% { transform: translate(34px, -18px) rotate(18deg) scale(0.58); }
  25% { transform: translate(-24px, -14px) rotate(-18deg) scale(0.72); }
  50% { transform: translate(16px, 8px) rotate(10deg) scale(0.84); }
  75% { transform: translate(-10px, 4px) rotate(-8deg) scale(0.95); }
  100% { transform: translate(2px, 3px) rotate(-4deg) scale(1.04); }
}
@keyframes preset-preview-whip-pan {
  0% { transform: translate(-66px, 6px) rotate(-24deg) scale(0.94); }
  55% { transform: translate(38px, 2px) rotate(4deg) scale(0.92); }
  100% { transform: translate(10px, 4px) rotate(-6deg) scale(1.02); }
}
@keyframes preset-preview-float-rise {
  0% { transform: translate(-18px, 22px) rotate(-14deg) scale(0.84); }
  50% { transform: translate(8px, -2px) rotate(-7deg) scale(0.96); }
  100% { transform: translate(-4px, -14px) rotate(-2deg) scale(1.03); }
}
@keyframes preset-preview-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.15); }
}
@keyframes tpl-product-showcase {
  0%   { transform: translate(-22px, 20px) rotate(-20deg) scale(0.55); }
  25%  { transform: translate(0px, 0px) rotate(-8deg) scale(1); }
  50%  { transform: translate(22px, -4px) rotate(6deg) scale(0.92); }
  75%  { transform: translate(-18px, -2px) rotate(-14deg) scale(0.9); }
  100% { transform: translate(4px, 4px) rotate(-6deg) scale(0.96); }
}
@keyframes tpl-app-store-preview {
  0%   { transform: translate(0px, 4px) rotate(-6deg) scale(0.58); }
  30%  { transform: translate(2px, 0px) rotate(-8deg) scale(1.08); }
  55%  { transform: translate(24px, 2px) rotate(6deg) scale(0.88); }
  75%  { transform: translate(-4px, -2px) rotate(-6deg) scale(1); }
  100% { transform: translate(0px, 2px) rotate(-4deg) scale(0.82); }
}
@keyframes tpl-social-spin {
  0%   { transform: translate(-26px, 4px) rotate(-22deg) scale(0.82); }
  25%  { transform: translate(4px, -6px) rotate(-6deg) scale(0.98); }
  50%  { transform: translate(26px, 4px) rotate(10deg) scale(0.82); }
  75%  { transform: translate(2px, 12px) rotate(18deg) scale(0.72); }
  100% { transform: translate(-26px, 4px) rotate(-22deg) scale(0.82); }
}
@keyframes tpl-hero-landing {
  0%   { transform: translate(0px, -48px) rotate(-2deg) scale(0.45); opacity: 0.3; }
  40%  { transform: translate(-6px, 2px) rotate(-6deg) scale(0.9); opacity: 1; }
  70%  { transform: translate(4px, 4px) rotate(-4deg) scale(1.06); opacity: 1; }
  100% { transform: translate(2px, 6px) rotate(-4deg) scale(0.94); opacity: 1; }
}
@keyframes tpl-presentation {
  0%   { transform: translate(-2px, 2px) rotate(-10deg) scale(1.14); }
  20%  { transform: translate(0px, 0px) rotate(-6deg) scale(1); }
  45%  { transform: translate(0px, 0px) rotate(-6deg) scale(1); }
  60%  { transform: translate(24px, 2px) rotate(5deg) scale(0.92); }
  80%  { transform: translate(24px, 2px) rotate(5deg) scale(0.92); }
  95%  { transform: translate(4px, 2px) rotate(-4deg) scale(0.88); }
  100% { transform: translate(4px, 2px) rotate(-4deg) scale(0.88); }
}
`;

function PresetPreview({ presetId }: { presetId: string }) {
  const animationName = `preset-preview-${presetId}`;
  const showPath = presetId === 'side-sweep' || presetId === 'orbit' || presetId === 'cinematic-push' || presetId === 'whip-pan' || presetId === 'hero-arc' || presetId === 'spiral-in';
  const showVerticalGuide = presetId === 'reveal-below' || presetId === 'overhead' || presetId === 'float-rise';

  return (
    <div
      aria-hidden="true"
      style={{
        width: 128,
        height: 72,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #b7b7b7 0%, #a9a9a9 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,0.14) 43%, rgba(0,0,0,0.14) 100%)',
        }}
      />
      {showPath && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: presetId === 'orbit' ? 16 : presetId === 'hero-arc' ? 22 : presetId === 'spiral-in' ? 18 : 36,
            height: presetId === 'orbit' ? 24 : presetId === 'hero-arc' ? 18 : presetId === 'spiral-in' ? 28 : 1,
            border: presetId === 'orbit' || presetId === 'hero-arc' || presetId === 'spiral-in' ? '1px dashed rgba(255,255,255,0.22)' : 'none',
            borderTop: presetId !== 'orbit' && presetId !== 'hero-arc' && presetId !== 'spiral-in' ? '1px dashed rgba(255,255,255,0.22)' : undefined,
            borderRadius: presetId === 'orbit' || presetId === 'hero-arc' || presetId === 'spiral-in' ? 999 : 0,
          }}
        />
      )}
      {showVerticalGuide && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 10,
            bottom: 10,
            width: 1,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 56,
          height: 108,
          marginLeft: -28,
          marginTop: -54,
          borderRadius: 14,
          border: '4px solid #171717',
          background: '#f6f6f6',
          boxShadow: '0 7px 16px rgba(0,0,0,0.3)',
          transformOrigin: '50% 50%',
          animation: `${animationName} 2.6s cubic-bezier(0.45, 0.05, 0.2, 1) infinite alternate`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 7,
            left: '50%',
            width: 18,
            height: 4,
            borderRadius: 999,
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.16)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 0 10px rgba(255,255,255,0.25)',
          animation: 'preset-preview-dot 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

const TPL_COLORS: Record<string, { bg: string; accent: string }> = {
  'product-showcase':  { bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', accent: 'rgba(139,92,246,0.35)' },
  'app-store-preview': { bg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', accent: 'rgba(59,130,246,0.35)' },
  'social-spin':       { bg: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', accent: 'rgba(244,63,94,0.35)' },
  'hero-landing':      { bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', accent: 'rgba(245,158,11,0.35)' },
  'presentation':      { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', accent: 'rgba(16,185,129,0.35)' },
};

function TemplatePreview({ templateId }: { templateId: string }) {
  const colors = TPL_COLORS[templateId] ?? { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', accent: 'rgba(139,92,246,0.35)' };
  const isSpin = templateId === 'social-spin';
  const isLanding = templateId === 'hero-landing';
  const isPresentation = templateId === 'presentation';

  return (
    <div
      aria-hidden="true"
      style={{
        width: 128,
        height: 72,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        background: colors.bg,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.18) 100%)' }} />
      {/* Guide path */}
      {isSpin && (
        <div style={{
          position: 'absolute', left: 14, right: 14, top: 16, height: 24,
          border: '1px dashed rgba(255,255,255,0.25)', borderRadius: 999,
        }} />
      )}
      {isLanding && (
        <div style={{
          position: 'absolute', left: '50%', top: 6, bottom: 10, width: 1,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))',
        }} />
      )}
      {isPresentation && (
        <div style={{
          position: 'absolute', left: 14, right: 14, top: 36, height: 1,
          borderTop: '1px dashed rgba(255,255,255,0.2)',
        }} />
      )}
      {/* Animated phone */}
      <div
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: 56, height: 108,
          marginLeft: -28, marginTop: -54,
          borderRadius: 14,
          border: '4px solid #171717',
          background: '#f6f6f6',
          boxShadow: '0 7px 16px rgba(0,0,0,0.3)',
          transformOrigin: '50% 50%',
          animation: `tpl-${templateId} ${isSpin ? '2.2s' : '3s'} cubic-bezier(0.45, 0.05, 0.2, 1) infinite ${isSpin ? 'linear' : 'alternate'}`,
        }}
      >
        <div style={{
          position: 'absolute', top: 7, left: '50%', width: 18, height: 4,
          borderRadius: 999, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.16)',
        }} />
      </div>
      {/* Pulsing dot */}
      <div style={{
        position: 'absolute', right: 12, top: 12, width: 7, height: 7,
        borderRadius: '50%', background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 0 10px rgba(255,255,255,0.25)',
        animation: 'preset-preview-dot 1.8s ease-in-out infinite',
      }} />
      {/* Duration badge */}
    </div>
  );
}

function Diamond({ active, label, onClick, onContextMenu }: {
  active?: boolean;
  label?: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {label && (
        <span style={{
          fontSize: 8, color: active ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          lineHeight: 1, marginBottom: 1,
        }}>{label}</span>
      )}
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        title="Clic: editar · Clic derecho: eliminar"
        style={{
          width: 10, height: 10,
          background: active ? '#3b82f6' : '#94a3b8',
          transform: 'rotate(45deg)',
          cursor: 'pointer', flexShrink: 0, borderRadius: 1,
          transition: 'background 0.15s',
          boxShadow: active ? '0 0 6px rgba(59,130,246,0.7)' : undefined,
        }}
      />
    </div>
  );
}

export const MovieTimeline = forwardRef<MovieTimelineHandle, MovieTimelineProps>(function MovieTimeline({ 
  viewerRef, movieTimeRef, onClose, onPlayingChange, onCollapsedChange, 
  canvasRef, hideManualKeyframeButton = false, forceCollapsed 
}, ref) {
  const { state, updateState, addCameraKeyframe, removeCameraKeyframe, updateCameraKeyframe, clearCameraKeyframes } = useApp();
  const { cameraKeyframes, movieDuration } = state;

  const [liveRecording, setLiveRecording] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const liveStartRef = useRef<number>(0);
  const liveTimerRafRef = useRef<number | null>(null);
  const capturedFramesRef = useRef<Omit<CameraKeyframe, 'id'>[]>([]);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeKfId, setActiveKfId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { onCollapsedChange?.(collapsed); }, [collapsed, onCollapsedChange]);
  useEffect(() => { if (forceCollapsed) setCollapsed(true); }, [forceCollapsed]);
  const [accentColor, setAccentColor] = useState('#161819');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  // Sync audio play/pause with timeline playback
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

  const handleAudioFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateState({ audioUrl: url });
    e.target.value = '';
  }, [updateState]);

  const [timelineZoom, setTimelineZoom] = useState(1);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.5;

  const kfRafRef = useRef<number | null>(null);
  const kfLastTsRef = useRef<number | null>(null);
  // Always-current ref so the rAF tick never reads a stale movieDuration closure
  const movieDurationRef = useRef(movieDuration);
  movieDurationRef.current = movieDuration;
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const TRACK_PADDING = 24;
  const PX_PER_SEC = 80; // fixed pixels per second at 1× zoom

  // Duration drag handle
  // visualDuration: local state used ONLY during drag for instant visual feedback.
  // We avoid calling updateState (store) on every pixel move because that triggers
  // a full re-render cascade that recreates the memoized handlers and breaks the drag.
  // We commit the final value to the store only once, on pointerUp.
  const durationDragRef = useRef<{ startX: number; startDuration: number; pps: number; currentDuration: number } | null>(null);
  const [isDraggingDuration, setIsDraggingDuration] = useState(false);
  const [visualDuration, setVisualDuration] = useState<number | null>(null);
  const [dragPreviewKeyframes, setDragPreviewKeyframes] = useState<CameraKeyframe[] | null>(null);
  const segmentDragRef = useRef<{
    mode: 'move' | 'resize-start' | 'resize-end';
    startIndex: number;
    endIndex: number;
    startX: number;
    keyframes: CameraKeyframe[];
  } | null>(null);

  // displayDuration: what we render. Uses local visual state during drag, store value otherwise.
  const displayDuration = visualDuration ?? movieDuration;

  const timelineKeyframes = sortKeyframesByTime(dragPreviewKeyframes ?? cameraKeyframes);

  const activeKf = timelineKeyframes.find(k => k.id === activeKfId) ?? null;
  const cameraScenes = buildTimelineScenes(timelineKeyframes);

  // Pixel-based scale (responds to zoom, NOT to duration)
  const effectivePxPerSec = PX_PER_SEC * timelineZoom;
  // Active region width in px (ruler + camera bar span only this width)
  const activeAreaPx = displayDuration * effectivePxPerSec;
  // Total track element width: at least fill the container (minWidth:'100%' handles that)
  const trackWidthPx = TRACK_PADDING * 2 + activeAreaPx;

  // (zoom is intentionally NOT reset when duration changes — user keeps their zoom level)

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
  }, [currentTime, movieDuration, timelineZoom, effectivePxPerSec]);

  useEffect(() => {
    return () => {
      if (liveTimerRafRef.current) cancelAnimationFrame(liveTimerRafRef.current);
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (kfRafRef.current) cancelAnimationFrame(kfRafRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClick = () => { setShowPresets(false); setShowColorPicker(false); };
    if (showPresets || showColorPicker) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showPresets, showColorPicker]);

  const BAR_COLORS = [
    { value: '#161819', label: 'Oscuro (por defecto)' },
    { value: '#0f172a', label: 'Medianoche' },
    { value: '#1a0a2e', label: 'Púrpura oscuro' },
    { value: '#0a1628', label: 'Azul marino' },
    { value: '#0d1f1a', label: 'Verde bosque' },
    { value: '#1f0d0d', label: 'Rojo sangre' },
    { value: '#1a1200', label: 'Ámbar oscuro' },
    { value: '#111827', label: 'Pizarra' },
  ];

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
    movieTimeRef.current = 0;
    setCurrentTime(0);
    setLiveRecording(false);
    capturedFramesRef.current = [];
  }, [cameraKeyframes, movieDuration, movieTimeRef, updateState]);

  const stopPlayback = useCallback(() => {
    if (kfRafRef.current) { cancelAnimationFrame(kfRafRef.current); kfRafRef.current = null; }
    kfLastTsRef.current = null;
    setIsPlaying(false);
    onPlayingChange?.(false);
  }, [onPlayingChange]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    onPlayingChange?.(true);
    kfLastTsRef.current = null;
    const tick = (ts: number) => {
      if (kfLastTsRef.current === null) kfLastTsRef.current = ts;
      const delta = (ts - kfLastTsRef.current) / 1000;
      kfLastTsRef.current = ts;
      // Read through the ref so changes to movieDuration are always respected,
      // even if they happen while this rAF loop is already running.
      const dur = movieDurationRef.current;
      movieTimeRef.current = Math.min(movieTimeRef.current + delta, dur);
      setCurrentTime(movieTimeRef.current);
      if (movieTimeRef.current >= dur) {
        movieTimeRef.current = 0; setCurrentTime(0); kfLastTsRef.current = null;
      }
      kfRafRef.current = requestAnimationFrame(tick);
    };
    kfRafRef.current = requestAnimationFrame(tick);
  }, [movieDurationRef, movieTimeRef, onPlayingChange]);

  // Expose imperative handle so RightPanel can drive playback during export
  useImperativeHandle(ref, () => ({
    startPlayback,
    stopPlayback,
    resetTime: () => { movieTimeRef.current = 0; setCurrentTime(0); },
  }), [startPlayback, stopPlayback, movieTimeRef]);

  const togglePlayback = () => { isPlaying ? stopPlayback() : startPlayback(); };

  const handleTrackPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = trackRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const t = Math.max(0, Math.min(movieDuration, (px - TRACK_PADDING) / effectivePxPerSec));
    movieTimeRef.current = t; setCurrentTime(t);
  }, [movieDuration, movieTimeRef, effectivePxPerSec]);

  const handleTrackPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const t = Math.max(0, Math.min(movieDuration, (px - TRACK_PADDING) / effectivePxPerSec));
    movieTimeRef.current = t; setCurrentTime(t);
  }, [movieDuration, movieTimeRef, effectivePxPerSec]);

  const handleTrackPointerUp = useCallback(() => { isDragging.current = false; }, []);

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
      movieTimeRef.current = nextKeyframes[startIndex].time;
      setCurrentTime(nextKeyframes[startIndex].time);
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
      movieTimeRef.current = nextKeyframes[startIndex].time;
      setCurrentTime(nextKeyframes[startIndex].time);
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
      movieTimeRef.current = nextKeyframes[endIndex].time;
      setCurrentTime(nextKeyframes[endIndex].time);
      setActiveKfId(nextKeyframes[endIndex].id);
    }

    setDragPreviewKeyframes(sortKeyframesByTime(nextKeyframes));
  }, [effectivePxPerSec, movieDuration, movieTimeRef]);

  const finishSegmentDrag = useCallback(() => {
    if (!segmentDragRef.current) return;
    const next = sortKeyframesByTime(dragPreviewKeyframes ?? segmentDragRef.current.keyframes);
    segmentDragRef.current = null;
    setDragPreviewKeyframes(null);
    updateState({ cameraKeyframes: next });
  }, [dragPreviewKeyframes, updateState]);

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
    if (movieTimeRef.current > newDuration) {
      movieTimeRef.current = newDuration;
      setCurrentTime(newDuration);
    }
  }, [movieTimeRef]);

  const handleDurationPointerUp = useCallback(() => {
    const final = durationDragRef.current?.currentDuration ?? movieDuration;
    durationDragRef.current = null;
    setVisualDuration(null);
    setIsDraggingDuration(false);
    // Commit final value to store (single history entry for the whole drag)
    updateState({ movieDuration: final });
  }, [movieDuration, updateState]);

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
    setShowPresets(false);
    const getCam = () => viewerRef.current?.getCameraState() ?? null;
    const keyframes = buildPresetKeyframes(presetId, getCam, movieDuration);
    if (keyframes.length === 0) return;

    if (cameraKeyframes.length === 0) {
      clearCameraKeyframes();
      keyframes.forEach(kf => addCameraKeyframe(kf));
      movieTimeRef.current = 0;
      setCurrentTime(0);
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
    movieTimeRef.current = appendedKeyframes[0]?.time ?? lastTime;
    setCurrentTime(movieTimeRef.current);
    setActiveKfId(null);
  }, [addCameraKeyframe, cameraKeyframes, clearCameraKeyframes, movieDuration, movieTimeRef, updateState, viewerRef]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    setShowPresets(false);
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
    movieTimeRef.current = 0;
    setCurrentTime(0);
    setActiveKfId(null);
  }, [movieDuration, movieTimeRef, updateState, viewerRef]);

  // Only show integer ticks that fall within the active area (≤ displayDuration)
  const RULERS = Array.from({ length: Math.ceil(displayDuration) + 1 }, (_, i) => i).filter(s => s <= displayDuration);

  return (
    <div style={{
      width: '100%', background: accentColor,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0, userSelect: 'none',
      transition: 'background 0.3s',
    }}>
      <style>{PRESET_PREVIEW_KEYFRAMES}</style>

      {/* ── Collapsed strip ───────────────────────────────────────── */}
      {collapsed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 14px',
          background: `linear-gradient(90deg, ${accentColor}, rgba(255,255,255,0.03) 60%, ${accentColor})`,
        }}>
          <button
            onClick={togglePlayback}
            disabled={liveRecording}
            style={{
              background: isPlaying ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 5, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
            }}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
            {formatTime(currentTime)} / {displayDuration}s
          </span>
          {cameraKeyframes.length > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
              · {cameraKeyframes.length} keyframes
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setCollapsed(false)}
            title="Expandir editor"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, padding: '2px 6px',
            }}
          >
            <ChevronUp size={13} />
            <span>Expandir</span>
          </button>
        </div>
      )}

      {/* ── Top controls bar ─────────────────────────────────────── */}
      {!collapsed && <div style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
      {/* Row 1: playback + keyframe controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 6px', flexWrap: 'wrap' }}>

        {/* Play / Pause */}
        {(() => {
          const noScene = cameraKeyframes.length < 2;
          const dis = liveRecording || noScene;
          return (
            <button
              onClick={togglePlayback}
              disabled={dis}
              title={noScene ? 'Añade al menos 2 keyframes para reproducir' : isPlaying ? 'Pausar' : 'Reproducir animación'}
              style={{
                background: isPlaying ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isPlaying ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 6, width: 28, height: 28,
                cursor: dis ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isPlaying ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                opacity: dis ? 0.3 : 1,
              }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
          );
        })()}

        {/* Stop — resets playhead to 0 */}
        {(() => {
          const noScene = cameraKeyframes.length < 2;
          const dis = liveRecording || noScene;
          return (
            <button
              onClick={() => { stopPlayback(); movieTimeRef.current = 0; setCurrentTime(0); }}
              disabled={dis}
              title={noScene ? 'Añade al menos 2 keyframes para usar stop' : 'Detener y volver al inicio'}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6, width: 28, height: 28,
                cursor: dis ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
                opacity: dis ? 0.3 : 1,
              }}
            >
              <Square size={10} />
            </button>
          );
        })()}

        {/* REC / STOP button */}
        {!liveRecording ? (
          <button
            onClick={startLiveRec}
            disabled={isPlaying}
            title="Grabar movimiento del dispositivo como keyframes"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 12px', height: 28, borderRadius: 6, cursor: 'pointer',
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171', fontSize: 11, fontWeight: 700,
              opacity: isPlaying ? 0.35 : 1,
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
              background: 'rgba(220,38,38,0.3)', border: '1px solid rgba(239,68,68,0.6)',
              color: '#fca5a5', fontSize: 11, fontWeight: 700,
            }}
          >
            <Square size={9} fill="#fca5a5" color="#fca5a5" />
            PARAR
          </button>
        )}

        {liveRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'recBlink 1s step-start infinite' }} />
            <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f87171' }}>
              {formatTimer(liveTime)}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              — Mueve el dispositivo con el ratón...
            </span>
          </div>
        )}

        {/* Add keyframe manually */}
        {!liveRecording && !hideManualKeyframeButton && (
          <button
            onClick={handleAddKeyframe}
            title="Añadir keyframe manual en la posición actual del playhead"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, height: 28, padding: '0 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600,
            }}
          >
            <Plus size={11} />
            Keyframe
            {cameraKeyframes.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>({cameraKeyframes.length})</span>
            )}
          </button>
        )}

        {/* Presets dropdown */}
        {!liveRecording && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowPresets(v => !v); }}
              title="Aplicar preset de animación"
              style={{
                background: showPresets ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.08)',
                border: `1px solid ${showPresets ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.25)'}`,
                borderRadius: 6, height: 28, padding: '0 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                color: '#a78bfa', fontSize: 11, fontWeight: 600,
              }}
            >
              <Sparkles size={11} />
              Presets
              <ChevronDown size={10} style={{ transform: showPresets ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {showPresets && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
                  background: '#1e2022', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8, overflow: 'hidden', zIndex: 100,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  width: 'min(360px, calc(100vw - 32px))',
                  maxHeight: 'min(420px, 60vh)',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Presets de animación
                  </span>
                </div>
                {ANIMATION_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.12s', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <PresetPreview presetId={preset.id} />
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 700, lineHeight: 1.2 }}>{preset.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{preset.desc}</span>
                      <span style={{ fontSize: 9, color: 'rgba(167,139,250,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 3 }}>
                        Vista previa
                      </span>
                    </div>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.14)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <Plus size={18} />
                    </div>
                  </button>
                ))}

                {/* Templates section */}
                <div style={{ padding: '6px 10px 4px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Templates completos
                  </span>
                </div>
                {ANIMATION_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.12s', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <TemplatePreview templateId={tpl.id} />
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.88)', fontWeight: 700, lineHeight: 1.2 }}>{tpl.label}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.35 }}>{tpl.desc}</span>
                      <span style={{ fontSize: 9, color: 'rgba(59,130,246,0.9)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 3 }}>
                        {tpl.duration}s · Template
                      </span>
                    </div>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.14)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <Plus size={18} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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

        {/* Audio controls */}
        {!liveRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input ref={audioFileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioFile} />
            {state.audioUrl ? (
              <>
                <button
                  onClick={() => updateState({ audioUrl: null })}
                  title="Quitar audio"
                  style={{
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                    borderRadius: 6, height: 28, padding: '0 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: '#4ade80', fontSize: 11, fontWeight: 600,
                  }}
                >
                  <Music size={11} />
                  <VolumeX size={10} />
                </button>
                <input
                  type="range" min={0} max={100} step={5}
                  value={state.audioVolume ?? 80}
                  onChange={e => updateState({ audioVolume: Number(e.target.value) })}
                  title={`Volumen: ${state.audioVolume ?? 80}%`}
                  style={{ width: 48, height: 3, accentColor: '#4ade80', cursor: 'pointer' }}
                />
              </>
            ) : (
              <button
                onClick={() => audioFileRef.current?.click()}
                title="Añadir audio/soundtrack"
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, height: 28, padding: '0 8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600,
                }}
              >
                <Music size={11} />
                Audio
              </button>
            )}
            {state.audioUrl && <audio ref={audioRef} src={state.audioUrl} preload="auto" />}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Minimize button */}
        <button
          onClick={() => setCollapsed(true)}
          title="Minimizar editor"
          aria-label="Minimizar editor de video"
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, width: 26, height: 26, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <ChevronDown size={13} />
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button
          onClick={() => { stopLiveRec(); stopPlayback(); onClose(); }}
          title="Cerrar editor de video"
          aria-label="Cerrar editor de video"
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Row 2: time display + zoom controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 14px 6px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          {formatTime(currentTime)}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>/</span>
        <span
          title="Arrastra el borde derecho del timeline para cambiar la duración"
          style={{
            fontFamily: 'monospace', fontSize: 11,
            color: isDraggingDuration ? '#f97316' : 'rgba(255,255,255,0.45)',
            fontWeight: 600, transition: 'color 0.15s', userSelect: 'none',
          }}
        >
          {displayDuration % 1 === 0 ? `${displayDuration}s` : `${displayDuration.toFixed(1)}s`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Curva
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round((state.movieCurveTension ?? 0.45) * 100)}
            onChange={e => updateState({ movieCurveTension: Number(e.target.value) / 100 }, true)}
            title="Tensión de curva: menor valor = más fluido, mayor valor = más rígido"
            style={{ width: 88, accentColor: '#a78bfa' }}
          />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', minWidth: 30 }}>
            {Math.round((state.movieCurveTension ?? 0.45) * 100)}%
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Zoom Out */}
        <button
          onClick={() => setTimelineZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
          disabled={timelineZoom <= MIN_ZOOM}
          title="Zoom out de la línea de tiempo"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, width: 22, height: 22, cursor: timelineZoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', opacity: timelineZoom <= MIN_ZOOM ? 0.35 : 1,
          }}
        >
          <ZoomOut size={11} />
        </button>

        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', minWidth: 26, textAlign: 'center' }}>
          {timelineZoom}×
        </span>

        {/* Zoom In */}
        <button
          onClick={() => setTimelineZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
          disabled={timelineZoom >= MAX_ZOOM}
          title="Zoom in de la línea de tiempo"
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, width: 22, height: 22, cursor: timelineZoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', opacity: timelineZoom >= MAX_ZOOM ? 0.35 : 1,
          }}
        >
          <ZoomIn size={11} />
        </button>
      </div>
      </div>}

      {/* ── Timeline track ───────────────────────────────────────── */}
      {!collapsed && <>
      {/* Scrollable container */}
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

        {/* Camera track row — full width of the timeline */}
        <div style={{ height: 44, position: 'relative', width: '100%' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0,
            width: activeAreaPx,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)', borderRadius: 4,
            transition: isDraggingDuration ? 'none' : 'width 0.15s ease',
          }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', pointerEvents: 'none',
            }}>Camera</span>

            {cameraScenes.map(scene => {
              const leftPx = scene.start.time * effectivePxPerSec;
              const widthPx = Math.max((scene.end.time - scene.start.time) * effectivePxPerSec, 18);
              const isActive = scene.keyframes.some(kf => kf.id === activeKfId);

              return (
                <div
                  key={`${scene.start.id}-${scene.end.id}-${scene.index}`}
                  style={{
                    position: 'absolute',
                    left: leftPx,
                    top: '50%',
                    width: widthPx,
                    height: 24,
                    transform: 'translateY(-50%)',
                    zIndex: isActive ? 3 : 2,
                  }}
                >
                  <div
                    onPointerDown={e => startSegmentDrag(e, scene.startIndex, scene.endIndex, 'move')}
                    onPointerMove={handleSegmentPointerMove}
                    onPointerUp={finishSegmentDrag}
                    onPointerCancel={finishSegmentDrag}
                    onClick={e => {
                      e.stopPropagation();
                      setActiveKfId(scene.end.id);
                      setEditingLabel(null);
                    }}
                    style={{
                      position: 'absolute',
                      left: 9,
                      right: 9,
                      top: 0,
                      bottom: 0,
                      borderRadius: 8,
                      background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${isActive ? 'rgba(59,130,246,0.65)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isActive ? '0 0 0 1px rgba(59,130,246,0.18)' : 'none',
                      cursor: 'grab',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      left: 10,
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 9,
                      lineHeight: 1,
                      color: 'rgba(255,255,255,0.34)',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      pointerEvents: 'none',
                    }}>{scene.label}</span>

                    {scene.keyframes.length > 2 && scene.keyframes.slice(1, -1).map(innerKf => {
                      const progress = (innerKf.time - scene.start.time) / Math.max(scene.end.time - scene.start.time, MIN_SEGMENT_DURATION);
                      const passed = currentTime >= innerKf.time;
                      return (
                        <div
                          key={innerKf.id}
                          style={{
                            position: 'absolute',
                            left: `${Math.max(0, Math.min(100, progress * 100))}%`,
                            top: '50%',
                            width: 6,
                            height: 6,
                            transform: 'translate(-50%, -50%) rotate(45deg)',
                            borderRadius: 1,
                            background: activeKfId === innerKf.id ? '#93c5fd' : passed ? '#fbbf24' : 'rgba(255,255,255,0.48)',
                            boxShadow: activeKfId === innerKf.id ? '0 0 0 2px rgba(59,130,246,0.16)' : passed ? '0 0 6px rgba(251,191,36,0.5)' : 'none',
                            pointerEvents: 'none',
                            transition: 'background 0.2s, box-shadow 0.2s',
                            animation: passed && isPlaying ? 'kf-pulse 0.35s ease-out' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>

                  <div
                    onPointerDown={e => {
                      setActiveKfId(scene.start.id);
                      setEditingLabel(null);
                      startSegmentDrag(e, scene.startIndex, scene.endIndex, 'resize-start');
                    }}
                    onPointerMove={handleSegmentPointerMove}
                    onPointerUp={finishSegmentDrag}
                    onPointerCancel={finishSegmentDrag}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(scene.start.id); if (activeKfId === scene.start.id) setActiveKfId(null); }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      width: 18,
                      height: 18,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'ew-resize',
                      touchAction: 'none',
                    }}
                  >
                    <div style={{
                      width: 12,
                      height: 12,
                      transform: 'rotate(45deg)',
                      borderRadius: 2,
                      background: activeKfId === scene.start.id ? '#3b82f6' : currentTime >= scene.start.time ? '#fbbf24' : '#d1d5db',
                      boxShadow: activeKfId === scene.start.id ? '0 0 0 3px rgba(59,130,246,0.18)' : currentTime >= scene.start.time ? '0 0 6px rgba(251,191,36,0.5)' : '0 0 0 1px rgba(0,0,0,0.15)',
                      transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                      animation: currentTime >= scene.start.time && isPlaying ? 'kf-pulse-plain 0.35s ease-out' : 'none',
                    }} />
                  </div>

                  <div
                    onPointerDown={e => {
                      setActiveKfId(scene.end.id);
                      setEditingLabel(null);
                      startSegmentDrag(e, scene.startIndex, scene.endIndex, 'resize-end');
                    }}
                    onPointerMove={handleSegmentPointerMove}
                    onPointerUp={finishSegmentDrag}
                    onPointerCancel={finishSegmentDrag}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(scene.end.id); if (activeKfId === scene.end.id) setActiveKfId(null); }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      width: 18,
                      height: 18,
                      transform: 'translate(50%, -50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'ew-resize',
                      touchAction: 'none',
                    }}
                  >
                    <div style={{
                      width: 12,
                      height: 12,
                      transform: 'rotate(45deg)',
                      borderRadius: 2,
                      background: activeKfId === scene.end.id ? '#3b82f6' : currentTime >= scene.end.time ? '#fbbf24' : '#d1d5db',
                      boxShadow: activeKfId === scene.end.id ? '0 0 0 3px rgba(59,130,246,0.18)' : currentTime >= scene.end.time ? '0 0 6px rgba(251,191,36,0.5)' : '0 0 0 1px rgba(0,0,0,0.15)',
                      transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                      animation: currentTime >= scene.end.time && isPlaying ? 'kf-pulse-plain 0.35s ease-out' : 'none',
                    }} />
                  </div>
                </div>
              );
            })}

            {timelineKeyframes.length === 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: timelineKeyframes[0].time * effectivePxPerSec,
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  zIndex: 2,
                }}
                onClick={e => { e.stopPropagation(); setActiveKfId(timelineKeyframes[0].id === activeKfId ? null : timelineKeyframes[0].id); setEditingLabel(null); }}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); removeCameraKeyframe(timelineKeyframes[0].id); if (activeKfId === timelineKeyframes[0].id) setActiveKfId(null); }}
              >
                <Diamond active={timelineKeyframes[0].id === activeKfId} label={timelineKeyframes[0].label} />
              </div>
            )}
          </div>
        </div>

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
          onPointerDown={handleDurationPointerDown}
          onPointerMove={handleDurationPointerMove}
          onPointerUp={handleDurationPointerUp}
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

      {/* ── Keyframe Inspector ─────────────────────────────────────── */}
      {activeKf && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Keyframe · {formatTime(activeKf.time)}
          </span>

          {/* Label input */}
          {editingLabel !== null ? (
            <input
              autoFocus
              value={editingLabel}
              onChange={e => setEditingLabel(e.target.value)}
              onBlur={() => { updateCameraKeyframe(activeKf.id, { label: editingLabel || undefined }); setEditingLabel(null); }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { updateCameraKeyframe(activeKf.id, { label: editingLabel || undefined }); setEditingLabel(null); } }}
              placeholder="Nombre del keyframe…"
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 4, color: '#fff', fontSize: 11, padding: '2px 7px', height: 24,
                outline: 'none', width: 140,
              }}
            />
          ) : (
            <button
              onClick={() => setEditingLabel(activeKf.label ?? '')}
              title="Editar nombre"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, color: activeKf.label ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
                fontSize: 11, padding: '2px 8px', height: 24, cursor: 'pointer',
              }}
            >
              {activeKf.label || '+ Nombre'}
            </button>
          )}

          {/* Easing selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Easing:</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {EASING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateCameraKeyframe(activeKf.id, { easing: opt.value })}
                  title={opt.desc}
                  style={{
                    background: (activeKf.easing ?? 'smooth') === opt.value ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${(activeKf.easing ?? 'smooth') === opt.value ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 4, padding: '2px 7px', height: 24, cursor: 'pointer',
                    color: (activeKf.easing ?? 'smooth') === opt.value ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                    fontSize: 10, fontWeight: 600,
                    transition: 'all 0.12s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Copy keyframe */}
          <button
            onClick={() => handleDuplicateKeyframe(activeKf)}
            title="Duplicar keyframe"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <Copy size={11} />
          </button>

          {/* Delete keyframe */}
          <button
            onClick={() => { removeCameraKeyframe(activeKf.id); setActiveKfId(null); }}
            title="Eliminar keyframe"
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 4, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171',
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
      </>}

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
