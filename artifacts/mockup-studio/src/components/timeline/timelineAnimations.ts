import type { CameraKeyframe, EasingType } from '../../store';

export const EASING_OPTIONS: { value: EasingType; label: string; desc: string }[] = [
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

export function buildPresetKeyframes(preset: string, getCam: () => { position: [number,number,number]; target: [number,number,number] } | null, duration: number): Omit<CameraKeyframe, 'id'>[] {
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

export const ANIMATION_PRESETS = [
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
export const ANIMATION_TEMPLATES = [
  { id: 'product-showcase', label: 'Product Showcase', desc: 'Reveal + spin + zoom hero', icon: '🎬', duration: 8 },
  { id: 'app-store-preview', label: 'App Store Preview', desc: 'Perfecto para App Store videos', icon: '📱', duration: 6 },
  { id: 'social-spin',     label: 'Social Spin',       desc: 'Giro rápido ideal para reels', icon: '🔄', duration: 4 },
  { id: 'hero-landing',    label: 'Hero Landing',      desc: 'Caída dramática desde arriba', icon: '🦸', duration: 5 },
  { id: 'presentation',    label: 'Presentation',      desc: 'Elegante para slides y decks', icon: '📊', duration: 7 },
];

export function buildTemplateKeyframes(
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
