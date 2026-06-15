import { describe, it, expect } from 'vitest';
import {
  IPHONE_COLORS,
  ENV_PRESETS,
  CANVAS_RATIOS,
  PRESENT_POSES,
  LABEL_SHADOW,
} from '../panelConstants';

describe('panelConstants — IPHONE_COLORS', () => {
  it('contains the canonical device colors used by the UI', () => {
    const ids = IPHONE_COLORS.map(c => c.id);
    expect(ids).toEqual(
      expect.arrayContaining(['original', 'titanium', 'black', 'white', 'blue'])
    );
  });

  it('every color background is a CSS gradient', () => {
    for (const c of IPHONE_COLORS) {
      const ok =
        c.bg.startsWith('linear-gradient') ||
        c.bg.startsWith('radial-gradient') ||
        c.bg.startsWith('conic-gradient');
      expect(ok, `IPHONE_COLORS[${c.id}].bg is not a gradient`).toBe(true);
    }
  });

  it('every color border is a non-empty CSS color string', () => {
    for (const c of IPHONE_COLORS) {
      expect(c.border.length, `${c.id} border`).toBeGreaterThan(0);
      // Hex-form border: starts with '#' followed by 3 or 6 hex digits.
      expect(c.border).toMatch(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/);
    }
  });
});

describe('panelConstants — ENV_PRESETS', () => {
  it('contains at least the six preset environments', () => {
    const ids = ENV_PRESETS.map(e => e.id);
    for (const required of ['studio', 'warehouse', 'city', 'sunset', 'forest', 'night']) {
      expect(ids, `missing ${required}`).toContain(required);
    }
  });

  it('every preset has a unique id', () => {
    const ids = ENV_PRESETS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('panelConstants — CANVAS_RATIOS', () => {
  it('exposes the expected shape (id + label)', () => {
    for (const r of CANVAS_RATIOS) {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.label).toBe('string');
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it('"free" must be the first option so it shows up first in the canvas UI', () => {
    expect(CANVAS_RATIOS[0].id).toBe('free');
  });

  it('every preset ratio id has a matching w:h number pair for a 1080 width', () => {
    // Reference table used by the codebase — any change must be reflected here.
    const expected: Record<string, { w: number; h: number }> = {
      'free':  { w: 1080, h: 1080 },
      '1:1':   { w: 1080, h: 1080 },
      '4:5':   { w: 1080, h: 1350 },
      '16:9':  { w: 1080, h: 607.5 },
      '9:16':  { w: 1080, h: 1920 },
    };

    for (const ratio of CANVAS_RATIOS) {
      expect(expected[ratio.id], `ratio ${ratio.id} missing from reference table`).toBeDefined();
    }
    expect(Object.keys(expected)).toEqual(CANVAS_RATIOS.map(r => r.id));
  });
});

describe('panelConstants — PRESENT_POSES', () => {
  it('every declared pose id exists exactly once', () => {
    const ids = PRESENT_POSES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rotation values are finite numbers with no NaN', () => {
    for (const p of PRESENT_POSES) {
      expect(Number.isFinite(p.ry)).toBe(true);
      expect(Number.isFinite(p.rx)).toBe(true);
      expect(Number.isFinite(p.rz)).toBe(true);
    }
  });

  it('hero pose has the expected frontal rotation (already covered by smoke test, reinforced here)', () => {
    const hero = PRESENT_POSES.find(p => p.id === 'hero');
    expect(hero).toBeDefined();
    expect(hero?.ry).toBe(25);
    expect(hero?.rz).toBe(0);
  });

  it('"front" pose is axis-aligned (all rotations 0)', () => {
    const front = PRESENT_POSES.find(p => p.id === 'front');
    expect(front?.ry).toBe(0);
    expect(front?.rx).toBe(0);
    expect(front?.rz).toBe(0);
  });
});

describe('panelConstants — LABEL_SHADOW', () => {
  it('is a non-empty CSS box-shadow string', () => {
    expect(typeof LABEL_SHADOW).toBe('string');
    expect(LABEL_SHADOW.length).toBeGreaterThan(0);
    // Should contain at least one rgba() — the existing constant uses rgba.
    expect(LABEL_SHADOW).toMatch(/rgba\(/);
  });
});
