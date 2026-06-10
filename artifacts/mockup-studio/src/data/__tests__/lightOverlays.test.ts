import { describe, it, expect } from 'vitest'
import { LIGHT_OVERLAYS } from '../lightOverlays'

describe('LIGHT_OVERLAYS', () => {
  it('has at least one overlay', () => {
    expect(LIGHT_OVERLAYS.length).toBeGreaterThan(0)
  })

  it('every overlay has required fields', () => {
    for (const o of LIGHT_OVERLAYS) {
      expect(o.id).toBeTruthy()
      expect(o.label).toBeTruthy()
      expect(o.background).toBeTruthy()
    }
  })

  it('no duplicate overlay ids', () => {
    const ids = LIGHT_OVERLAYS.map(o => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every background starts with url or repeating-linear-gradient or linear-gradient', () => {
    for (const o of LIGHT_OVERLAYS) {
      const ok = o.background.startsWith('url(') ||
        o.background.startsWith('repeating-linear-gradient') ||
        o.background.startsWith('repeating-radial-gradient')
      expect(ok).toBe(true)
    }
  })
})
