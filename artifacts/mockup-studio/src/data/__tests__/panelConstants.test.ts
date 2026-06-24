import { describe, it, expect } from 'vitest'
import { IPHONE_COLORS, ENV_PRESETS, CANVAS_RATIOS, PRESENT_POSES } from '../panelConstants'

describe('IPHONE_COLORS', () => {
  it('every color has required fields', () => {
    for (const c of IPHONE_COLORS) {
      expect(c.id).toBeTruthy()
      expect(c.label).toBeTruthy()
      expect(c.bg).toBeTruthy()
      expect(c.border).toBeTruthy()
    }
  })

  it('no duplicate color ids', () => {
    const ids = IPHONE_COLORS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('ENV_PRESETS', () => {
  it('every preset has required fields', () => {
    for (const p of ENV_PRESETS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
    }
  })
})

describe('CANVAS_RATIOS', () => {
  it('free ratio is first', () => {
    expect(CANVAS_RATIOS[0].id).toBe('free')
  })
})

describe('PRESENT_POSES', () => {
  it('every pose has required rotation fields', () => {
    for (const p of PRESENT_POSES) {
      expect(p.id).toBeTruthy()
      expect(typeof p.ry).toBe('number')
      expect(typeof p.rx).toBe('number')
      expect(typeof p.rz).toBe('number')
    }
  })

  it('hero pose has zero rz and non-zero ry', () => {
    const hero = PRESENT_POSES.find(p => p.id === 'hero')
    expect(hero?.ry).toBe(25)
    expect(hero?.rz).toBe(0)
  })
})
