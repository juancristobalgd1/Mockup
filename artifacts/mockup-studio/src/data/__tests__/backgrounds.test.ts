import { describe, it, expect } from 'vitest'
import { ANIMATED_BACKGROUNDS, GRADIENTS, MESH_GRADIENTS, WALLPAPERS, PATTERNS, PRESETS, SOLIDS } from '../backgrounds'

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex === 'transparent' || !hex.startsWith('#')) return `rgba(255,255,255,${alpha})`
  let h = hex.slice(1)
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

describe('hexToRgba', () => {
  it('converts 6-digit hex to rgba', () => {
    expect(hexToRgba('#ff0000', 1)).toBe('rgba(255,0,0,1)')
    expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0,255,0,0.5)')
    expect(hexToRgba('#0000ff', 0.25)).toBe('rgba(0,0,255,0.25)')
  })

  it('converts 3-digit hex to rgba', () => {
    expect(hexToRgba('#f00', 1)).toBe('rgba(255,0,0,1)')
    expect(hexToRgba('#0f0', 0.5)).toBe('rgba(0,255,0,0.5)')
  })

  it('returns white fallback for invalid input', () => {
    expect(hexToRgba('', 0.5)).toBe('rgba(255,255,255,0.5)')
    expect(hexToRgba('transparent', 0.5)).toBe('rgba(255,255,255,0.5)')
    expect(hexToRgba('not-a-color', 0.5)).toBe('rgba(255,255,255,0.5)')
  })

  it('handles edge hex values', () => {
    expect(hexToRgba('#000000', 0)).toBe('rgba(0,0,0,0)')
    expect(hexToRgba('#ffffff', 1)).toBe('rgba(255,255,255,1)')
  })
})

describe('background data integrity', () => {
  it('ANIMATED_BACKGROUNDS have required fields', () => {
    for (const bg of ANIMATED_BACKGROUNDS) {
      expect(bg.id).toBeTruthy()
      expect(bg.label).toBeTruthy()
      expect(bg.thumb).toBeTruthy()
      expect(['iframe', 'css', 'canvas']).toContain(bg.type)
    }
  })

  it('GRADIENTS have required fields', () => {
    for (const g of GRADIENTS) {
      expect(g.id).toBeTruthy()
      expect(g.label).toBeTruthy()
      expect(g.css).toContain('gradient')
    }
  })

  it('MESH_GRADIENTS have required fields', () => {
    for (const m of MESH_GRADIENTS) {
      expect(m.id).toBeTruthy()
      expect(m.label).toBeTruthy()
      expect(m.css).toContain('radial-gradient')
    }
  })

  it('WALLPAPERS have required fields', () => {
    for (const w of WALLPAPERS) {
      expect(w.id).toBeTruthy()
      expect(w.label).toBeTruthy()
      expect(w.css).toBeTruthy()
      expect(w.thumb).toBeTruthy()
    }
  })

  it('PATTERNS generate valid background styles', () => {
    for (const p of PATTERNS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      const style = p.bgStyle('#000000', '#ffffff')
      expect(style.backgroundColor).toBe('#000000')
      expect(style.backgroundImage).toBeTruthy()
    }
  })

  it('PRESETS have required fields', () => {
    for (const p of PRESETS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(p.state).toBeTruthy()
      expect(p.state.bgType).toBeTruthy()
      expect(p.state.deviceType).toBeTruthy()
    }
  })

  it('SOLIDS are valid hex colors', () => {
    for (const c of SOLIDS) {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})
