import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeW, clampL, clampT, getModeAccent, getDefaultTab } from '../panelUtils'

describe('safeW', () => {
  it('returns a clamped width string', () => {
    const result = safeW(800)
    expect(result).toBe('min(800px, calc(100vw - 16px))')
  })
})

describe('clampL', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clamps to minimum 8 when anchor is too far left', () => {
    expect(clampL(-100, 200)).toBe(8)
  })

  it('clamps to max when anchor would overflow right', () => {
    expect(clampL(1200, 200)).toBe(1072) // 1280 - 200 - 8
  })

  it('returns anchorX + offsetX when within bounds', () => {
    expect(clampL(500, 200, 50)).toBe(550)
  })

  it('handles zero offset', () => {
    expect(clampL(400, 200, 0)).toBe(400)
  })
})

describe('clampT', () => {
  it('clamps negative values to 8', () => {
    expect(clampT(-50)).toBe(8)
  })

  it('returns value when positive and above 8', () => {
    expect(clampT(100)).toBe(100)
  })

  it('returns 8 for value of 8', () => {
    expect(clampT(8)).toBe(8)
  })
})

describe('getModeAccent', () => {
  it('returns red accent for movie mode', () => {
    const result = getModeAccent('movie')
    expect(result.color).toBe('#dc2626')
    expect(result.bg).toContain('rgba(220,38,38')
    expect(result.border).toContain('rgba(220,38,38')
  })

  it('returns blue accent for screenshot mode', () => {
    const result = getModeAccent('screenshot')
    expect(result.color).toBe('#0284c7')
    expect(result.bg).toContain('rgba(2,132,199')
    expect(result.border).toContain('rgba(2,132,199')
  })

  it('returns gray accent for mockup mode', () => {
    const result = getModeAccent('mockup')
    expect(result.color).toBe('#374151')
    expect(result.bg).toContain('rgba(55,65,81')
    expect(result.border).toContain('rgba(55,65,81')
  })

  it('returns gray accent for unknown mode', () => {
    const result = getModeAccent('unknown')
    expect(result.color).toBe('#374151')
  })
})

describe('getDefaultTab', () => {
  it('returns canvas for canvas mode', () => {
    expect(getDefaultTab('canvas')).toBe('canvas')
  })

  it('returns canvas for movie mode', () => {
    expect(getDefaultTab('movie')).toBe('canvas')
  })

  it('returns device for screenshot mode', () => {
    expect(getDefaultTab('screenshot')).toBe('device')
  })

  it('returns device for unknown mode', () => {
    expect(getDefaultTab('unknown')).toBe('device')
  })
})