import { describe, it, expect, vi } from 'vitest'
import { getOptimizedConfig, PerformanceMonitor } from '../performance'

describe('getOptimizedConfig', () => {
  it('returns low config for low tier', () => {
    const config = getOptimizedConfig({ isMobile: true, hasGPU: true, gpuMemory: 256, tier: 'low' })
    expect(config).toEqual({
      maxPixelRatio: 1,
      enableSSAO: false,
      enableBloom: false,
      enableDOF: false,
      shadowMapSize: 512,
      textureResolution: 'low',
      enablePostFX: false,
    })
  })

  it('returns medium config for medium tier', () => {
    window.devicePixelRatio = 2
    const config = getOptimizedConfig({ isMobile: false, hasGPU: true, gpuMemory: 1024, tier: 'medium' })
    expect(config.maxPixelRatio).toBe(2)
    expect(config.enableSSAO).toBe(true)
    expect(config.enableBloom).toBe(true)
    expect(config.enableDOF).toBe(false)
    expect(config.shadowMapSize).toBe(1024)
    expect(config.textureResolution).toBe('medium')
    expect(config.enablePostFX).toBe(true)
  })

  it('returns high config for high tier', () => {
    window.devicePixelRatio = 3
    const config = getOptimizedConfig({ isMobile: false, hasGPU: true, gpuMemory: 4096, tier: 'high' })
    expect(config.maxPixelRatio).toBe(3)
    expect(config.enableSSAO).toBe(true)
    expect(config.enableBloom).toBe(true)
    expect(config.enableDOF).toBe(true)
    expect(config.shadowMapSize).toBe(1024)
    expect(config.textureResolution).toBe('high')
    expect(config.enablePostFX).toBe(true)
  })
})

describe('PerformanceMonitor', () => {
  it('initialises with default values', () => {
    const monitor = new PerformanceMonitor()
    expect(monitor.getFPS()).toBe(60)
    expect(monitor.getFrameTime()).toBe(16.67)
    expect(monitor.getAverageFPS()).toBe(60)
  })

  it('collects frame data on update', () => {
    const monitor = new PerformanceMonitor()
    monitor.update()
    expect(monitor.getFrameTime()).toBeGreaterThan(0)
    expect(monitor.getAverageFPS()).toBeGreaterThan(0)
  })
})
