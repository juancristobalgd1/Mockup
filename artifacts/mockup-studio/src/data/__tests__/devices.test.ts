import { describe, it, expect } from 'vitest'
import { DEVICE_MODELS, getModelById, getModelsInGroup, DEFAULT_MODEL_ID, DEVICE_GROUPS } from '../devices'

describe('DEVICE_MODELS', () => {
  it('has at least one device', () => {
    expect(DEVICE_MODELS.length).toBeGreaterThan(0)
  })

  it('every device has required fields', () => {
    for (const model of DEVICE_MODELS) {
      expect(model.id).toBeTruthy()
      expect(model.label).toBeTruthy()
      expect(model.group).toBeTruthy()
      expect(model.storeType).toBeTruthy()
      expect(typeof model.w).toBe('number')
      expect(typeof model.h).toBe('number')
      expect(model.accent).toBeTruthy()
    }
  })

  it('no duplicate device ids', () => {
    const ids = DEVICE_MODELS.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every device belongs to a known group', () => {
    for (const model of DEVICE_MODELS) {
      expect(DEVICE_GROUPS).toContain(model.group)
    }
  })
})

describe('getModelById', () => {
  it('returns the matching device model', () => {
    const model = getModelById('iphone-17-pro-max')
    expect(model.label).toBe('iPhone 17 Pro Max')
  })

  it('falls back to first device for unknown id', () => {
    const model = getModelById('non-existent')
    expect(model.id).toBe(DEVICE_MODELS[0].id)
  })
})

describe('getModelsInGroup', () => {
  it('returns models for iPhone group', () => {
    const iphones = getModelsInGroup('iPhone')
    expect(iphones.length).toBeGreaterThan(0)
    expect(iphones.every(m => m.group === 'iPhone')).toBe(true)
  })

  it('returns models for Android group', () => {
    const android = getModelsInGroup('Android')
    expect(android.length).toBeGreaterThan(0)
    expect(android.every(m => m.group === 'Android')).toBe(true)
  })

  it('returns empty array for unknown group', () => {
    const result = getModelsInGroup('Unknown' as any)
    expect(result).toHaveLength(0)
  })
})

describe('DEFAULT_MODEL_ID', () => {
  it('matches an existing device', () => {
    const model = getModelById(DEFAULT_MODEL_ID)
    expect(model).toBeDefined()
    expect(model.id).toBe(DEFAULT_MODEL_ID)
  })
})
