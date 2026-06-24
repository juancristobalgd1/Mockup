import { describe, it, expect } from 'vitest'
import { TAB_ICONS } from '../../components/panels/tabs'

describe('TAB_ICONS', () => {
  it('has at least one tab', () => {
    expect(TAB_ICONS.length).toBeGreaterThan(0)
  })

  it('every tab has required fields', () => {
    for (const tab of TAB_ICONS) {
      expect(tab.id).toBeTruthy()
      expect(tab.label).toBeTruthy()
      expect(tab.icon).toBeDefined()
    }
  })

  it('no duplicate tab ids', () => {
    const ids = TAB_ICONS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes all expected tabs', () => {
    const ids = TAB_ICONS.map(t => t.id)
    expect(ids).toContain('device')
    expect(ids).toContain('background')
    expect(ids).toContain('canvas')
    expect(ids).toContain('annotate')
    expect(ids).toContain('labels')
  })
})
