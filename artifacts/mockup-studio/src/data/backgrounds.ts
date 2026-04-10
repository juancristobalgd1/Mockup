import type React from 'react';
import type { DeviceType } from '../store';

// ── Animated backgrounds ────────────────────────────────────────────────────

export interface AnimatedBackground {
  id: string;
  label: string;
  type: 'iframe' | 'css' | 'canvas';
  src?: string;
  animStyle?: React.CSSProperties;
  thumb: React.CSSProperties;
  /** For type='canvas': per-frame draw function. t = elapsed seconds. */
  render?: (ctx: CanvasRenderingContext2D, t: number, W: number, H: number) => void;
}

export const ANIMATED_BG_KEYFRAMES = `
@keyframes bgShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
@keyframes bgShift2 { 0%{background-position:0% 0%} 33%{background-position:100% 100%} 66%{background-position:100% 0%} 100%{background-position:0% 0%} }
@keyframes bgShift3 { 0%,100%{background-position:0% 0%} 25%{background-position:100% 0%} 50%{background-position:100% 100%} 75%{background-position:0% 100%} }
`;

export const ANIMATED_BACKGROUNDS: AnimatedBackground[] = [
  {
    id: '3d-aura',
    label: '3D Aura',
    type: 'iframe',
    src: 'https://my.spline.design/3dgradient-AcpgG6LxFkpnJSoowRHPfcbO',
    thumb: { background: 'radial-gradient(ellipse at 30% 30%, #7c3aed 0%, #3b82f6 40%, #06b6d4 70%, #0f172a 100%)' },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #0d1b2a, #7e22ce, #0ea5e9, #065f46)',
      backgroundSize: '400% 400%',
      animation: 'bgShift 12s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #0d1b2a 0%, #7e22ce 40%, #0ea5e9 70%, #065f46 100%)' },
  },
  {
    id: 'sunset-flow',
    label: 'Sunset Flow',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #f97316, #ec4899, #a855f7, #f59e0b)',
      backgroundSize: '400% 400%',
      animation: 'bgShift 10s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #f97316, #ec4899, #a855f7, #f59e0b)' },
  },
  {
    id: 'neon-dark',
    label: 'Neon Dark',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #050014, #1a0533, #00d4ff, #7c00ff, #050014)',
      backgroundSize: '400% 400%',
      animation: 'bgShift2 14s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #050014, #7c00ff, #00d4ff, #1a0533)' },
  },
  {
    id: 'ocean-depth',
    label: 'Ocean Depth',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #0c4a6e, #0ea5e9, #06b6d4, #0369a1, #164e63)',
      backgroundSize: '400% 400%',
      animation: 'bgShift3 15s linear infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #0c4a6e, #0ea5e9, #06b6d4)' },
  },
  {
    id: 'rose-gold',
    label: 'Rose Gold',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #fdf2f8, #fce7f3, #fbcfe8, #f9a8d4, #ec4899)',
      backgroundSize: '400% 400%',
      animation: 'bgShift 13s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #fdf2f8, #fbcfe8, #ec4899)' },
  },
  {
    id: 'forest-mist',
    label: 'Forest Mist',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #052e16, #166534, #4ade80, #16a34a, #052e16)',
      backgroundSize: '400% 400%',
      animation: 'bgShift2 16s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #052e16, #166534, #4ade80)' },
  },
  {
    id: 'cosmic',
    label: 'Cosmic',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #030712, #1e1b4b, #4c1d95, #0c0a09, #1c1917)',
      backgroundSize: '400% 400%',
      animation: 'bgShift3 18s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #030712, #4c1d95, #1e1b4b)' },
  },
  {
    id: 'lava',
    label: 'Lava',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #7f1d1d, #dc2626, #f97316, #b91c1c)',
      backgroundSize: '400% 400%',
      animation: 'bgShift2 9s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #7f1d1d, #dc2626, #f97316)' },
  },
  {
    id: 'mint-sky',
    label: 'Mint Sky',
    type: 'css',
    animStyle: {
      background: 'linear-gradient(-45deg, #ecfdf5, #6ee7b7, #a5f3fc, #bfdbfe, #ddd6fe)',
      backgroundSize: '400% 400%',
      animation: 'bgShift 11s ease infinite',
    },
    thumb: { background: 'linear-gradient(135deg, #ecfdf5, #6ee7b7, #a5f3fc, #bfdbfe)' },
  },

  // ── Canvas-rendered backgrounds (record-perfect) ────────────────────────────

  {
    id: 'liquid-blobs',
    label: 'Liquid Blobs',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 25% 35%, #a855f7 0%, #ec4899 40%, #f97316 70%, #0a0412 100%)' },
    render: (ctx, t, W, H) => {
      ctx.fillStyle = '#07030f';
      ctx.fillRect(0, 0, W, H);
      const S = Math.min(W, H);
      const blobs = [
        { bx: 0.28, by: 0.33, ox: 0.17, oy: 0.13, spx: 0.21, spy: 0.17, r: 0.58, h: 270, ds: 6 },
        { bx: 0.72, by: 0.28, ox: 0.14, oy: 0.18, spx: 0.18, spy: 0.26, r: 0.52, h: 330, ds: 7 },
        { bx: 0.50, by: 0.72, ox: 0.17, oy: 0.11, spx: 0.30, spy: 0.22, r: 0.50, h: 22,  ds: 5 },
        { bx: 0.18, by: 0.64, ox: 0.11, oy: 0.14, spx: 0.36, spy: 0.28, r: 0.43, h: 210, ds: 8 },
        { bx: 0.80, by: 0.67, ox: 0.10, oy: 0.12, spx: 0.41, spy: 0.33, r: 0.45, h: 190, ds: 6 },
      ];
      ctx.globalCompositeOperation = 'screen';
      for (const b of blobs) {
        const x = W * (b.bx + b.ox * Math.sin(t * b.spx));
        const y = H * (b.by + b.oy * Math.cos(t * b.spy));
        const r = S * b.r;
        const hue = (b.h + t * b.ds) % 360;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0,    `hsla(${hue},95%,68%,0.92)`);
        g.addColorStop(0.38, `hsla(${hue},90%,58%,0.48)`);
        g.addColorStop(0.72, `hsla(${hue},85%,48%,0.18)`);
        g.addColorStop(1,    `hsla(${hue},80%,40%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
      const vig = ctx.createRadialGradient(W/2, H/2, S*0.25, W/2, H/2, S*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    },
  },

  {
    id: 'aurora-borealis',
    label: 'Aurora Boreal',
    type: 'canvas',
    thumb: { background: 'linear-gradient(180deg, #020c14 0%, #0a2e1a 40%, #0e3830 70%, #091a28 100%)' },
    render: (ctx, t, W, H) => {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#020c14');
      sky.addColorStop(0.55, '#071820');
      sky.addColorStop(1, '#0a2218');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n + 1) * 43758.5453; return x - Math.floor(x); };
      for (let i = 0; i < 130; i++) {
        const sx = fr(i * 5.3) * W;
        const sy = fr(i * 9.7) * H * 0.48;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + fr(i) * 1.8) + i));
        ctx.globalAlpha = tw * 0.85;
        ctx.fillStyle = '#eef4ff';
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + fr(i * 3.1) * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const bands = [
        { cy: 0.50, amp: 0.07, freq: 2.2, sp: 0.35, hBase: 152, hVar: 22, alpha: 0.72, thick: 0.14 },
        { cy: 0.60, amp: 0.06, freq: 3.1, sp: 0.28, hBase: 175, hVar: 18, alpha: 0.60, thick: 0.11 },
        { cy: 0.68, amp: 0.05, freq: 3.8, sp: 0.44, hBase: 230, hVar: 30, alpha: 0.48, thick: 0.09 },
        { cy: 0.44, amp: 0.04, freq: 2.6, sp: 0.20, hBase: 140, hVar: 15, alpha: 0.38, thick: 0.07 },
      ];
      for (const b of bands) {
        ctx.beginPath();
        for (let xi = 0; xi <= W; xi += 3) {
          const xn = xi / W;
          const yn = H * (b.cy + b.amp * Math.sin(xn * b.freq * Math.PI * 2 + t * b.sp)
            + b.amp * 0.4 * Math.sin(xn * b.freq * 1.7 * Math.PI * 2 - t * b.sp * 0.7));
          xi === 0 ? ctx.moveTo(xi, H) : undefined;
          ctx.lineTo(xi, yn);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const hue = b.hBase + b.hVar * Math.sin(t * 0.25);
        const yc = H * b.cy;
        const ht = H * b.thick;
        const bg = ctx.createLinearGradient(0, yc - ht, 0, yc + ht * 0.8);
        bg.addColorStop(0,   `hsla(${hue},100%,68%,0)`);
        bg.addColorStop(0.3, `hsla(${hue},100%,68%,${b.alpha})`);
        bg.addColorStop(0.6, `hsla(${hue + 15},90%,55%,${b.alpha * 0.7})`);
        bg.addColorStop(1,   `hsla(${hue + 30},80%,45%,0)`);
        ctx.fillStyle = bg;
        ctx.fill();
      }
    },
  },

  {
    id: 'deep-space',
    label: 'Deep Space',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 35% 40%, #2a0e5e 0%, #0a0030 50%, #000008 100%)' },
    render: (ctx, t, W, H) => {
      ctx.fillStyle = '#000008';
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
      const nebulas = [
        { nx: 0.30, ny: 0.38, r: 0.42, ox: 0.06, oy: 0.04, sp: 0.08, h: 270, a: 0.14 },
        { nx: 0.68, ny: 0.32, r: 0.36, ox: 0.05, oy: 0.06, sp: 0.11, h: 200, a: 0.11 },
        { nx: 0.52, ny: 0.72, r: 0.30, ox: 0.07, oy: 0.05, sp: 0.09, h: 330, a: 0.09 },
        { nx: 0.20, ny: 0.65, r: 0.28, ox: 0.04, oy: 0.06, sp: 0.12, h: 180, a: 0.08 },
      ];
      for (const n of nebulas) {
        const nx = W * (n.nx + n.ox * Math.sin(t * n.sp));
        const ny = H * (n.ny + n.oy * Math.cos(t * n.sp * 0.8));
        const rn = n.r * W;
        const gn = ctx.createRadialGradient(nx, ny, 0, nx, ny, rn);
        gn.addColorStop(0,   `hsla(${n.h},85%,65%,${n.a})`);
        gn.addColorStop(0.5, `hsla(${n.h},75%,50%,${n.a * 0.5})`);
        gn.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = gn;
        ctx.fillRect(0, 0, W, H);
      }
      for (let i = 0; i < 220; i++) {
        const sx = fr(i) * W;
        const sy = fr(i + 500) * H;
        const sz = fr(i + 1000);
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.4 + sz * 2.2) + i * 1.7));
        ctx.globalAlpha = tw * (0.5 + sz * 0.5);
        const r = 0.4 + sz * 2.2;
        if (sz > 0.82) {
          const gs = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.5);
          gs.addColorStop(0, 'rgba(200,220,255,0.35)');
          gs.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gs;
          ctx.fillRect(sx - r * 3.5, sy - r * 3.5, r * 7, r * 7);
        }
        const hstar = sz > 0.7 ? 220 : (sz > 0.5 ? 0 : 40);
        ctx.fillStyle = sz > 0.7 ? '#c8dcff' : (sz > 0.5 ? '#ffe8cc' : '#fffff0');
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        void hstar;
      }
      ctx.globalAlpha = 1;
    },
  },

  {
    id: 'neon-pulse',
    label: 'Neon Pulse',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 50% 50%, #ff00ff 0%, #00ffff 35%, #050008 70%)' },
    render: (ctx, t, W, H) => {
      ctx.fillStyle = '#050008';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const S = Math.min(W, H);
      const maxR = S * 0.62;
      const numRings = 9;
      ctx.save();
      for (let i = 0; i < numRings; i++) {
        const phase = ((i / numRings) + t * 0.13) % 1;
        const r = phase * maxR;
        const fade = 1 - phase;
        const hue = (i * 42 + t * 28) % 360;
        const col = `hsla(${hue},100%,65%,${fade * 0.75})`;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5 + fade * 5;
        ctx.shadowColor = `hsl(${hue},100%,65%)`;
        ctx.shadowBlur = 18 * fade;
        ctx.stroke();
      }
      ctx.restore();
      const hc = (t * 55) % 360;
      const gc = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.13);
      gc.addColorStop(0, `hsla(${hc},100%,85%,0.9)`);
      gc.addColorStop(0.5, `hsla(${hc},100%,65%,0.5)`);
      gc.addColorStop(1,   `hsla(${hc},100%,50%,0)`);
      ctx.fillStyle = gc;
      ctx.fillRect(0, 0, W, H);
      const vig = ctx.createRadialGradient(cx, cy, S * 0.2, cx, cy, S * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    },
  },

  {
    id: 'smoke',
    label: 'Humo',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 50% 90%, #2a2a35 0%, #12121a 50%, #080810 100%)' },
    render: (ctx, t, W, H) => {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#05050d');
      bg.addColorStop(1, '#0e0e1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
      const NUM = 22;
      const CYCLE = 11;
      for (let i = 0; i < NUM; i++) {
        const baseX  = fr(i * 7.3) * 0.76 + 0.12;
        const offset = fr(i * 3.9) * CYCLE;
        const lT     = ((t + offset) % CYCLE) / CYCLE;
        const x = W * (baseX
          + 0.07 * Math.sin(t * 0.28 + i * 2.71)
          + 0.04 * Math.sin(t * 0.61 + i * 1.37));
        const y = H * (1.05 - lT * 1.15);
        const r = (0.04 + lT * 0.22) * Math.min(W, H);
        const fadeIn  = lT < 0.12 ? lT / 0.12 : 1;
        const fadeOut = lT > 0.65 ? (1 - lT) / 0.35 : 1;
        const alpha   = fadeIn * fadeOut * (0.18 + fr(i * 11.3) * 0.14);
        const hue     = 220 + fr(i * 5.1) * 30;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0,    `hsla(${hue},18%,85%,${alpha})`);
        grd.addColorStop(0.45, `hsla(${hue},14%,72%,${alpha * 0.55})`);
        grd.addColorStop(0.80, `hsla(${hue},10%,60%,${alpha * 0.18})`);
        grd.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }
      const glow = ctx.createRadialGradient(W * 0.5, H, 0, W * 0.5, H, W * 0.55);
      glow.addColorStop(0, 'rgba(80,70,120,0.28)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    },
  },

  {
    id: 'particle-rain',
    label: 'Lluvia de Partículas',
    type: 'canvas',
    thumb: { background: 'linear-gradient(180deg, #020010 0%, #0a0025 50%, #080020 100%)' },
    render: (ctx, t, W, H) => {
      ctx.fillStyle = '#020010';
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n * 91.7 + 213.5) * 43758.5; return x - Math.floor(x); };
      const NUM = 120;
      const hues = [180, 280, 320, 60, 140];
      for (let i = 0; i < NUM; i++) {
        const px   = fr(i * 5.3) * W;
        const spd  = 0.12 + fr(i * 2.9) * 0.28;
        const size = 1.2 + fr(i * 7.1) * 3.5;
        const hue  = hues[i % hues.length];
        const pha  = fr(i * 3.7) * H;
        const py   = (t * spd * H + pha) % (H * 1.2) - H * 0.1;
        const fade = py < 0 ? Math.max(0, 1 + py / (H * 0.1)) : (py > H * 0.85 ? Math.max(0, (1 - (py - H * 0.85) / (H * 0.15))) : 1);
        ctx.globalAlpha = fade * (0.55 + 0.45 * Math.abs(Math.sin(t * 1.8 + i)));
        const gs = ctx.createRadialGradient(px, py, 0, px, py, size * 2.5);
        gs.addColorStop(0, `hsl(${hue},100%,80%)`);
        gs.addColorStop(0.4, `hsla(${hue},100%,65%,0.6)`);
        gs.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gs;
        ctx.fillRect(px - size * 3, py - size * 3, size * 6, size * 6);
        if (size > 3) {
          const trailLen = size * 12 * spd * 3;
          const tr = ctx.createLinearGradient(px, py, px, py - trailLen);
          tr.addColorStop(0, `hsla(${hue},100%,70%,0.35)`);
          tr.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = tr;
          ctx.fillRect(px - 1, py - trailLen, 2, trailLen);
        }
      }
      ctx.globalAlpha = 1;
    },
  },

  {
    id: 'electric-plasma',
    label: 'Plasma Eléctrico',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 50% 50%, #001a2e 0%, #000c18 60%, #000408 100%)' },
    render: (ctx, t, W, H) => {
      ctx.fillStyle = '#000408';
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n * 73.1 + 191.9) * 43758.5453; return x - Math.floor(x); };
      const drawBolt = (x1: number, y1: number, x2: number, y2: number, segs: number, seed: number, alpha: number, hue: number) => {
        const pts: [number, number][] = [[x1, y1]];
        for (let s = 1; s < segs; s++) {
          const f = s / segs;
          const mx = x1 + (x2 - x1) * f;
          const my = y1 + (y2 - y1) * f;
          const jit = (fr(seed + s * 7.3) - 0.5) * W * 0.18 * (1 - f * 0.6);
          pts.push([mx + jit, my]);
        }
        pts.push([x2, y2]);
        ctx.save();
        ctx.shadowColor = `hsl(${hue},100%,70%)`;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.strokeStyle = `hsla(${hue},100%,92%,${alpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.shadowBlur = 8;
        ctx.beginPath();
        pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
        if (fr(seed * 3.1) > 0.5 && segs > 4) {
          const branchAt = Math.floor(segs * 0.4);
          const [bx, by] = pts[branchAt];
          const endX = bx + (fr(seed * 5.7) - 0.5) * W * 0.22;
          const endY = by + fr(seed * 8.1) * H * 0.35;
          drawBolt(bx, by, endX, endY, Math.floor(segs * 0.5), seed + 99, alpha * 0.55, hue);
        }
      };
      const BOLTS = 4;
      for (let b = 0; b < BOLTS; b++) {
        const flashSpeed = 1.5 + fr(b * 11.3) * 2.5;
        const flash = Math.abs(Math.sin(t * flashSpeed + b * 1.91));
        if (flash < 0.18) continue;
        const alpha = (flash - 0.18) / 0.82;
        const x1 = W * (0.15 + fr(b * 7.3 + Math.floor(t * 0.8 + b) * 1000) * 0.7);
        const hue = [185, 200, 270, 300][b % 4];
        drawBolt(x1, 0, x1 + (fr(b * 3.7) - 0.5) * W * 0.3, H, 14, b * 137 + Math.floor(t * 1.5 + b) * 50, alpha * 0.9, hue);
      }
      const aura = ctx.createRadialGradient(W/2, H*0.1, 0, W/2, H*0.5, W*0.6);
      aura.addColorStop(0, `hsla(195,100%,60%,${0.06 + 0.04 * Math.sin(t * 2.3)})`);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);
    },
  },

  {
    id: 'ink-water',
    label: 'Tinta en Agua',
    type: 'canvas',
    thumb: { background: 'radial-gradient(ellipse at 40% 35%, #0a1628 0%, #0d2233 50%, #071520 100%)' },
    render: (ctx, t, W, H) => {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#071420');
      bg.addColorStop(0.5, '#0b1e30');
      bg.addColorStop(1, '#091828');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const fr = (n: number) => { const x = Math.sin(n * 83.7 + 157.3) * 43758.5453; return x - Math.floor(x); };
      for (let i = 0; i < 6; i++) {
        const cx = W * (fr(i * 5.3) * 0.8 + 0.1);
        const cy = H * (fr(i * 7.9) * 0.7 + 0.15);
        const spd = 0.08 + fr(i * 3.1) * 0.12;
        const phase = t * spd + fr(i * 11.7) * Math.PI * 2;
        const r = Math.min(W, H) * (0.12 + 0.06 * Math.abs(Math.sin(phase * 0.4)));
        const bx = cx + W * 0.03 * Math.sin(t * 0.18 + i * 1.8);
        const by = cy + H * 0.02 * Math.cos(t * 0.22 + i * 2.3);
        const gi = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        gi.addColorStop(0,    `rgba(6,4,18,0.82)`);
        gi.addColorStop(0.55, `rgba(10,6,28,0.45)`);
        gi.addColorStop(0.85, `rgba(14,10,38,0.15)`);
        gi.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = gi;
        ctx.fillRect(0, 0, W, H);
        const numT = 4 + Math.floor(fr(i * 13.7) * 3);
        for (let j = 0; j < numT; j++) {
          const ta = fr(i * 7.3 + j * 3.1) * Math.PI * 2;
          const tSpd = 0.06 + fr(i * 2.7 + j * 5.3) * 0.10;
          const tLen = r * (0.9 + 0.5 * Math.sin(t * tSpd + j * 1.4));
          const tx2 = bx + Math.cos(ta + t * 0.05 * (j % 2 === 0 ? 1 : -1)) * tLen;
          const ty2 = by + Math.sin(ta + t * 0.05 * (j % 2 === 0 ? 1 : -1)) * tLen * 0.75;
          const tr = ctx.createLinearGradient(bx, by, tx2, ty2);
          tr.addColorStop(0, 'rgba(6,4,18,0.55)');
          tr.addColorStop(0.7, 'rgba(8,5,22,0.18)');
          tr.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.save();
          ctx.beginPath();
          const midX = (bx + tx2) / 2 + Math.sin(t * 0.3 + i + j) * r * 0.18;
          const midY = (by + ty2) / 2 + Math.cos(t * 0.25 + i + j) * r * 0.12;
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(midX, midY, tx2, ty2);
          ctx.strokeStyle = tr as CanvasGradient;
          ctx.lineWidth = 3 + fr(i * 9.1 + j) * 6;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.85;
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) {
        const kx = W * (fr(k * 17.3) * 0.9 + 0.05);
        const ky = H * (fr(k * 23.7) * 0.3);
        const kw = W * (0.05 + fr(k * 5.1) * 0.12);
        const kspd = 0.3 + fr(k * 7.9) * 0.5;
        const kph = ((t * kspd + fr(k * 3.3) * 10) % (H * 0.15));
        ctx.fillStyle = `rgba(140,190,230,${0.02 + 0.015 * Math.sin(t * kspd + k)})`;
        ctx.beginPath();
        ctx.ellipse(kx, ky + kph, kw, kw * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
];

export interface BackgroundGradient {
  id: string;
  label: string;
  css: string;
}

export const GRADIENTS: BackgroundGradient[] = [
  { id: 'purple-blue', label: 'Blue Violet', css: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)' },
  { id: 'fire', label: 'Fire', css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'night', label: 'Night', css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { id: 'golden', label: 'Golden', css: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { id: 'candy', label: 'Candy', css: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
  { id: 'coral', label: 'Coral', css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'dark-blue', label: 'Deep Sea', css: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' },
  { id: 'neon', label: 'Neon', css: 'linear-gradient(135deg, #08AEEA 0%, #2AF598 100%)' },
];

export interface MeshGradient {
  id: string;
  label: string;
  css: string;
}

export const MESH_GRADIENTS: MeshGradient[] = [
  {
    id: 'mesh-aurora',
    label: 'Aurora',
    css: `radial-gradient(at 40% 20%, #0ea5e9 0px, transparent 50%), radial-gradient(at 80% 0%, #06b6d4 0px, transparent 50%), radial-gradient(at 0% 50%, #ec4899 0px, transparent 50%), radial-gradient(at 80% 50%, #0284c7 0px, transparent 50%), radial-gradient(at 0% 100%, #0891b2 0px, transparent 50%), #03111e`
  },
  {
    id: 'mesh-forest',
    label: 'Forest',
    css: `radial-gradient(at 20% 30%, #059669 0px, transparent 50%), radial-gradient(at 70% 10%, #0891b2 0px, transparent 50%), radial-gradient(at 90% 70%, #16a34a 0px, transparent 50%), radial-gradient(at 10% 80%, #0d9488 0px, transparent 50%), #061a14`
  },
  {
    id: 'mesh-fire',
    label: 'Fire',
    css: `radial-gradient(at 30% 20%, #dc2626 0px, transparent 50%), radial-gradient(at 80% 10%, #ea580c 0px, transparent 50%), radial-gradient(at 60% 70%, #b91c1c 0px, transparent 50%), radial-gradient(at 10% 80%, #c2410c 0px, transparent 50%), #1a0808`
  },
  {
    id: 'mesh-ocean',
    label: 'Ocean',
    css: `radial-gradient(at 20% 20%, #0284c7 0px, transparent 50%), radial-gradient(at 70% 10%, #0891b2 0px, transparent 50%), radial-gradient(at 80% 60%, #1d4ed8 0px, transparent 50%), radial-gradient(at 5% 70%, #0369a1 0px, transparent 50%), #03111e`
  },
  {
    id: 'mesh-candy',
    label: 'Candy',
    css: `radial-gradient(at 30% 20%, #f43f5e 0px, transparent 50%), radial-gradient(at 75% 15%, #ec4899 0px, transparent 50%), radial-gradient(at 85% 65%, #f97316 0px, transparent 50%), radial-gradient(at 10% 75%, #e11d48 0px, transparent 50%), #1a080e`
  },
  {
    id: 'mesh-gold',
    label: 'Gold',
    css: `radial-gradient(at 25% 25%, #d97706 0px, transparent 50%), radial-gradient(at 75% 10%, #f59e0b 0px, transparent 50%), radial-gradient(at 80% 70%, #92400e 0px, transparent 50%), radial-gradient(at 15% 80%, #b45309 0px, transparent 50%), #1a1008`
  },
  {
    id: 'mesh-violet',
    label: 'Violet',
    css: `radial-gradient(at 20% 20%, #7c3aed 0px, transparent 50%), radial-gradient(at 80% 10%, #a855f7 0px, transparent 50%), radial-gradient(at 70% 70%, #6d28d9 0px, transparent 50%), radial-gradient(at 5% 75%, #8b5cf6 0px, transparent 50%), #0d0820`
  },
  {
    id: 'mesh-rose',
    label: 'Rose',
    css: `radial-gradient(at 35% 15%, #f43f5e 0px, transparent 50%), radial-gradient(at 80% 20%, #fb7185 0px, transparent 50%), radial-gradient(at 60% 75%, #e11d48 0px, transparent 50%), radial-gradient(at 10% 65%, #fda4af 0px, transparent 50%), radial-gradient(at 85% 80%, #be123c 0px, transparent 50%), #1a0510`
  },
  {
    id: 'mesh-midnight',
    label: 'Midnight',
    css: `radial-gradient(at 30% 30%, #1e3a5f 0px, transparent 55%), radial-gradient(at 75% 15%, #312e81 0px, transparent 50%), radial-gradient(at 85% 70%, #1e1b4b 0px, transparent 50%), radial-gradient(at 10% 80%, #0f172a 0px, transparent 50%), #020617`
  },
  {
    id: 'mesh-neon',
    label: 'Neon',
    css: `radial-gradient(at 25% 25%, #22d3ee 0px, transparent 50%), radial-gradient(at 75% 15%, #a3e635 0px, transparent 50%), radial-gradient(at 80% 70%, #06b6d4 0px, transparent 50%), radial-gradient(at 10% 70%, #4ade80 0px, transparent 50%), #030a0a`
  },
  {
    id: 'mesh-peach',
    label: 'Peach',
    css: `radial-gradient(at 30% 20%, #fb923c 0px, transparent 50%), radial-gradient(at 80% 10%, #fbbf24 0px, transparent 50%), radial-gradient(at 70% 70%, #f97316 0px, transparent 50%), radial-gradient(at 10% 75%, #fdba74 0px, transparent 50%), #1a0d05`
  },
  {
    id: 'mesh-mint',
    label: 'Mint',
    css: `radial-gradient(at 20% 25%, #34d399 0px, transparent 50%), radial-gradient(at 75% 10%, #6ee7b7 0px, transparent 50%), radial-gradient(at 80% 65%, #059669 0px, transparent 50%), radial-gradient(at 10% 75%, #10b981 0px, transparent 50%), #021a10`
  },
];

export interface PatternOption {
  id: string;
  label: string;
  bgStyle: (color: string) => React.CSSProperties;
}

export const PATTERNS: PatternOption[] = [
  {
    id: 'dots',
    label: 'Dots',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
    })
  },
  {
    id: 'grid',
    label: 'Grid',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    })
  },
  {
    id: 'lines',
    label: 'Lines',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 1px, transparent 0, transparent 50%)',
      backgroundSize: '16px 16px',
    })
  },
  {
    id: 'cross',
    label: 'Cross',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundPosition: '-1px -1px',
    })
  },
  {
    id: 'dots-lg',
    label: 'Circles',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 3px, transparent 3px)',
      backgroundSize: '28px 28px',
    })
  },
  {
    id: 'checker',
    label: 'Checker',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    })
  },
  {
    id: 'zigzag',
    label: 'Zigzag',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.07) 25%, transparent 25%) -10px 0, linear-gradient(225deg, rgba(255,255,255,0.07) 25%, transparent 25%) -10px 0, linear-gradient(315deg, rgba(255,255,255,0.07) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%)`,
      backgroundSize: '20px 20px',
    })
  },
  {
    id: 'waves',
    label: 'Waves',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.06) 18px, rgba(255,255,255,0.06) 20px)`,
      backgroundSize: '100% 20px',
    })
  },
  {
    id: 'diamond',
    label: 'Diamond',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.08) 75%)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 12px 12px',
    })
  },
  {
    id: 'noise',
    label: 'Noise',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
      backgroundSize: '200px 200px',
    })
  },
  {
    id: 'hexagon',
    label: 'Hex',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `radial-gradient(circle farthest-side at 0% 50%, transparent 23%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.07) 34%, transparent 35%), radial-gradient(circle farthest-side at 100% 50%, transparent 23%, rgba(255,255,255,0.07) 24%, rgba(255,255,255,0.07) 34%, transparent 35%)`,
      backgroundSize: '30px 18px',
    })
  },
  {
    id: 'triangle',
    label: 'Triangles',
    bgStyle: (color: string) => ({
      backgroundColor: color,
      backgroundImage: `linear-gradient(60deg, rgba(255,255,255,0.07) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.07) 75%), linear-gradient(120deg, rgba(255,255,255,0.07) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.07) 75%)`,
      backgroundSize: '24px 42px',
    })
  },
];

export interface WallpaperOption {
  id: string;
  label: string;
  css: string;
  thumb: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'tahoe-light',
    label: 'Tahoe Light',
    css: `radial-gradient(ellipse at 50% 0%, #bfdbfe 0%, #93c5fd 30%, #60a5fa 60%, #dbeafe 100%)`,
    thumb: '#93c5fd',
  },
  {
    id: 'tahoe-dark',
    label: 'Tahoe Dark',
    css: `radial-gradient(ellipse at 40% 20%, #1e3a5f 0%, #0c1e3b 40%, #081022 70%, #0a1628 100%)`,
    thumb: '#1e3a5f',
  },
  {
    id: 'sunset-shore',
    label: 'Sunset Shore',
    css: `linear-gradient(180deg, #1a0533 0%, #6b21a8 25%, #c2410c 55%, #ea580c 75%, #fbbf24 90%, #fef3c7 100%)`,
    thumb: '#ea580c',
  },
  {
    id: 'pine-forest',
    label: 'Pine Forest',
    css: `radial-gradient(ellipse at 50% 100%, #052e16 0%, #14532d 40%, #166534 70%, #4ade80 100%)`,
    thumb: '#166534',
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    css: `linear-gradient(160deg, #7c2d12 0%, #c2410c 20%, #ea580c 40%, #f59e0b 65%, #fde68a 85%, #fff7ed 100%)`,
    thumb: '#f59e0b',
  },
  {
    id: 'arctic-ice',
    label: 'Arctic Ice',
    css: `radial-gradient(ellipse at 50% 30%, #f0f9ff 0%, #bae6fd 30%, #7dd3fc 55%, #0ea5e9 80%, #0284c7 100%)`,
    thumb: '#bae6fd',
  },
  {
    id: 'lava-field',
    label: 'Lava Field',
    css: `radial-gradient(ellipse at 30% 80%, #7f1d1d 0%, #991b1b 30%, #b91c1c 50%, #c2410c 70%, #1c0503 100%)`,
    thumb: '#991b1b',
  },
  {
    id: 'rose-bloom',
    label: 'Rose Bloom',
    css: `radial-gradient(ellipse at 60% 40%, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #ec4899 75%, #be185d 100%)`,
    thumb: '#f9a8d4',
  },
  {
    id: 'night-sky',
    label: 'Night Sky',
    css: `radial-gradient(ellipse at 50% 0%, #1e1b4b 0%, #312e81 20%, #1e3a5f 50%, #0f172a 80%, #020617 100%)`,
    thumb: '#312e81',
  },
  {
    id: 'citrus',
    label: 'Citrus',
    css: `linear-gradient(135deg, #fef9c3 0%, #fde047 25%, #facc15 50%, #eab308 75%, #ca8a04 100%)`,
    thumb: '#fde047',
  },
  {
    id: 'lavender',
    label: 'Sky Dusk',
    css: `radial-gradient(ellipse at 50% 60%, #e0f2fe 0%, #bae6fd 25%, #7dd3fc 50%, #0284c7 80%, #0c4a6e 100%)`,
    thumb: '#7dd3fc',
  },
  {
    id: 'sand-dunes',
    label: 'Sand Dunes',
    css: `linear-gradient(160deg, #fef3c7 0%, #fde68a 20%, #f59e0b 45%, #d97706 65%, #92400e 85%, #451a03 100%)`,
    thumb: '#f59e0b',
  },
];

interface PresetState {
  deviceType: DeviceType;
  deviceLandscape?: boolean;
  bgType: 'gradient' | 'mesh' | 'solid' | 'pattern' | 'image' | 'wallpaper';
  bgColor: string;
  animation: 'none' | 'float' | 'pulse' | 'spin' | 'slide-in';
  autoRotate?: boolean;
  envPreset?: 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night';
  contactShadowOpacity?: number;
}

export interface Preset {
  id: string;
  label: string;
  thumb: string;
  state: PresetState;
}

export const PRESETS: Preset[] = [
  {
    id: 'app-store',
    label: 'App Store',
    thumb: 'purple-blue',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'purple-blue',
      animation: 'float',
      envPreset: 'studio',
    }
  },
  {
    id: 'twitter-banner',
    label: 'Twitter Banner',
    thumb: 'night',
    state: {
      deviceType: 'browser',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'night',
      animation: 'none',
      envPreset: 'city',
      contactShadowOpacity: 80,
    }
  },
  {
    id: 'product-hunt',
    label: 'Product Hunt',
    thumb: 'sunset',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'sunset',
      animation: 'none',
      envPreset: 'sunset',
    }
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Post',
    thumb: 'mesh-ocean',
    state: {
      deviceType: 'macbook',
      deviceLandscape: false,
      bgType: 'mesh',
      bgColor: 'mesh-ocean',
      animation: 'none',
      envPreset: 'warehouse',
      contactShadowOpacity: 50,
    }
  },
  {
    id: 'instagram-story',
    label: 'Instagram',
    thumb: 'fire',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'gradient',
      bgColor: 'fire',
      animation: 'float',
      envPreset: 'studio',
    }
  },
  {
    id: 'dark-showcase',
    label: 'Dark Mode',
    thumb: 'mesh-aurora',
    state: {
      deviceType: 'iphone',
      deviceLandscape: false,
      bgType: 'mesh',
      bgColor: 'mesh-aurora',
      animation: 'float',
      envPreset: 'night',
      contactShadowOpacity: 75,
    }
  },
  {
    id: 'night-city',
    label: 'Night City',
    thumb: 'night-sky',
    state: {
      deviceType: 'iphone',
      bgType: 'wallpaper',
      bgColor: 'night-sky',
      animation: 'float',
      envPreset: 'night',
      contactShadowOpacity: 80,
    }
  },
];
