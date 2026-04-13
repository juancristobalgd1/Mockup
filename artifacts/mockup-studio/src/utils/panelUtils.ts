import { Tab } from '../components/panels/tabs';

/** Return a clamped width that never exceeds viewport minus padding */
export const safeW = (w: number) => `min(${w}px, calc(100vw - 16px))` as const;

/** Clamp left so the popup of given width stays inside the viewport */
export const clampL = (anchorX: number, w: number, offsetX = 0) =>
  Math.max(8, Math.min(anchorX + offsetX, (typeof window !== 'undefined' ? window.innerWidth : 999) - w - 8));

/** Clamp top so the popup doesn't go above the viewport */
export const clampT = (v: number) => Math.max(8, v);

export function getModeAccent(mode: string) {
  if (mode === 'movie')      return { color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.3)' };
  if (mode === 'screenshot') return { color: '#0284c7', bg: 'rgba(2,132,199,0.08)', border: 'rgba(2,132,199,0.3)' };
  return { color: '#374151', bg: 'rgba(55,65,81,0.07)', border: 'rgba(55,65,81,0.25)' };
}

export function getDefaultTab(mode: string): Tab {
  if (mode === 'canvas') return 'canvas';
  if (mode === 'movie') return 'canvas';
  if (mode === 'screenshot') return 'device';
  return 'device';
}

export function extractColorsFromImage(imgSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 20; canvas.height = 20;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0, 20, 20);
      const data = ctx.getImageData(0, 0, 20, 20).data;
      const buckets: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        if (data[i + 3] < 128) continue;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }
      const sorted = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
      resolve(sorted.slice(0, 4).map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return `rgb(${r},${g},${b})`;
      }));
    };
    img.onerror = () => resolve([]);
    img.src = imgSrc;
  });
}
