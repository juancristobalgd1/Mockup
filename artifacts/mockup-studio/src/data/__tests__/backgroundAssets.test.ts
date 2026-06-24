import { describe, it, expect } from 'vitest'
import { GRADIENT_ASSETS, TEXTURE_ASSETS, WALLPAPER_ASSETS } from '../backgroundAssets'

describe('backgroundAssets', () => {
  it('exports GRADIENT_ASSETS as array', () => {
    expect(Array.isArray(GRADIENT_ASSETS)).toBe(true)
  })

  it('exports TEXTURE_ASSETS as array', () => {
    expect(Array.isArray(TEXTURE_ASSETS)).toBe(true)
  })

  it('exports WALLPAPER_ASSETS as array', () => {
    expect(Array.isArray(WALLPAPER_ASSETS)).toBe(true)
  })

  it('every asset has id and url string properties', () => {
    const allAssets = [...GRADIENT_ASSETS, ...TEXTURE_ASSETS, ...WALLPAPER_ASSETS]
    for (const asset of allAssets) {
      expect(asset).toHaveProperty('id')
      expect(typeof asset.id).toBe('string')
      expect(asset.id.length).toBeGreaterThan(0)
      expect(asset).toHaveProperty('url')
      expect(typeof asset.url).toBe('string')
    }
  })

  it('sorts assets by ID with numeric-aware comparison', () => {
    const sorted = [...GRADIENT_ASSETS].sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
    )
    expect(GRADIENT_ASSETS).toEqual(sorted)
  })
})
