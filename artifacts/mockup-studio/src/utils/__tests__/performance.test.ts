import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getOptimizedConfig,
  PerformanceMonitor,
  detectDeviceProfile,
  optimizeTexture,
  setupOptimizedShadows,
  enableFrustumCulling,
  disposeResources,
} from '../performance'
import * as THREE from 'three'

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

  it('maintains rolling sample window', () => {
    const monitor = new PerformanceMonitor()
    for (let i = 0; i < 100; i++) {
      monitor.update()
    }
    expect(monitor.getFPS()).toBeGreaterThanOrEqual(0)
    expect(monitor.getFrameTime()).toBeGreaterThan(0)
  })
})

describe('detectDeviceProfile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('detects mobile device and sets low tier', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
      writable: true,
    })
    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(true)
    expect(profile.hasGPU).toBe(false)
    expect(profile.gpuMemory).toBeNull()
    expect(profile.tier).toBe('low')
  })

  it('detects Android device and sets low tier', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
      configurable: true,
      writable: true,
    })
    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(true)
    expect(profile.tier).toBe('low')
  })

  it('detects tablet device and sets low tier', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
      configurable: true,
      writable: true,
    })
    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(true)
    expect(profile.tier).toBe('low')
  })

  it('defaults to medium tier for desktop without GPU info', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
      writable: true,
    })
    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(false)
    expect(profile.hasGPU).toBe(false)
    expect(profile.tier).toBe('medium')
  })

  it('detects high tier when GPU memory exceeds 2GB', () => {
    const mockGetExt = vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 0x1f })
    const mockGetParam = vi.fn().mockReturnValue('AMD Radeon Pro 8GB')
    const mockContext = {
      getExtension: mockGetExt,
      getParameter: mockGetParam,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
      writable: true,
    })

    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(false)
    expect(profile.hasGPU).toBe(true)
    expect(profile.gpuMemory).toBe(8192)
    expect(profile.tier).toBe('high')
  })

  it('sets low tier for desktop with GPU memory under 512MB', () => {
    const mockGetExt = vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 0x1f })
    const mockGetParam = vi.fn().mockReturnValue('Intel HD Graphics 256MB')
    const mockContext = {
      getExtension: mockGetExt,
      getParameter: mockGetParam,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
      writable: true,
    })

    const profile = detectDeviceProfile()
    expect(profile.isMobile).toBe(false)
    expect(profile.hasGPU).toBe(true)
    expect(profile.gpuMemory).toBe(256)
    expect(profile.tier).toBe('low')
  })

  it('parses GPU memory in GB correctly', () => {
    const mockGetExt = vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 0x1f })
    const mockGetParam = vi.fn().mockReturnValue('NVIDIA GeForce RTX 12GB')
    const mockContext = {
      getExtension: mockGetExt,
      getParameter: mockGetParam,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
      writable: true,
    })

    const profile = detectDeviceProfile()
    expect(profile.gpuMemory).toBe(12288)
  })

  it('parses GPU memory in MB correctly', () => {
    const mockGetExt = vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 0x1f })
    const mockGetParam = vi.fn().mockReturnValue('Intel UHD Graphics 1536MB')
    const mockContext = {
      getExtension: mockGetExt,
      getParameter: mockGetParam,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
      writable: true,
    })

    const profile = detectDeviceProfile()
    expect(profile.gpuMemory).toBe(1536)
  })

  it('returns null gpuMemory when renderer string has no memory info', () => {
    const mockGetExt = vi.fn().mockReturnValue({ UNMASKED_RENDERER_WEBGL: 0x1f })
    const mockGetParam = vi.fn().mockReturnValue('Apple M1')
    const mockContext = {
      getExtension: mockGetExt,
      getParameter: mockGetParam,
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
      writable: true,
    })

    const profile = detectDeviceProfile()
    expect(profile.gpuMemory).toBeNull()
    expect(profile.tier).toBe('medium')
  })
})

describe('optimizeTexture', () => {
  it('sets linear filtering on texture', () => {
    const texture = new THREE.Texture()
    optimizeTexture(texture, 'low')
    expect(texture.minFilter).toBe(THREE.LinearFilter)
    expect(texture.magFilter).toBe(THREE.LinearFilter)
  })

  it('sets linear filtering for medium resolution', () => {
    const texture = new THREE.Texture()
    optimizeTexture(texture, 'medium')
    expect(texture.minFilter).toBe(THREE.LinearFilter)
    expect(texture.magFilter).toBe(THREE.LinearFilter)
  })

  it('returns the same texture instance', () => {
    const texture = new THREE.Texture()
    const result = optimizeTexture(texture, 'high')
    expect(result).toBe(texture)
  })
})

describe('setupOptimizedShadows', () => {
  it('configures directional light shadow map', () => {
    const light = new THREE.DirectionalLight()
    setupOptimizedShadows(light, 2048)

    expect(light.shadow.mapSize.width).toBe(2048)
    expect(light.shadow.mapSize.height).toBe(2048)
    expect(light.shadow.camera.near).toBe(0.1)
    expect(light.shadow.camera.far).toBe(100)
  })

  it('configures directional light orthographic camera bounds', () => {
    const light = new THREE.DirectionalLight()
    setupOptimizedShadows(light, 1024)

    const cam = light.shadow.camera as THREE.OrthographicCamera
    expect(cam.left).toBe(-10)
    expect(cam.right).toBe(10)
    expect(cam.top).toBe(10)
    expect(cam.bottom).toBe(-10)
  })

  it('configures point light shadow map', () => {
    const light = new THREE.PointLight()
    setupOptimizedShadows(light, 512)

    expect(light.shadow.mapSize.width).toBe(512)
    expect(light.shadow.mapSize.height).toBe(512)
    expect(light.shadow.camera.near).toBe(0.1)
    expect(light.shadow.camera.far).toBe(100)
  })

  it('does nothing for ambient light (no shadow property)', () => {
    const light = new THREE.AmbientLight()
    expect(() => setupOptimizedShadows(light, 1024)).not.toThrow()
  })
})

describe('enableFrustumCulling', () => {
  it('enables frustum culling on all meshes in scene', () => {
    const scene = new THREE.Scene()
    const mesh1 = new THREE.Mesh()
    const mesh2 = new THREE.Mesh()
    mesh1.frustumCulled = false
    mesh2.frustumCulled = false
    scene.add(mesh1)
    scene.add(mesh2)

    enableFrustumCulling(scene)

    expect(mesh1.frustumCulled).toBe(true)
    expect(mesh2.frustumCulled).toBe(true)
  })

  it('handles empty scene without error', () => {
    const scene = new THREE.Scene()
    expect(() => enableFrustumCulling(scene)).not.toThrow()
  })

  it('does not affect non-mesh objects', () => {
    const scene = new THREE.Scene()
    const light = new THREE.DirectionalLight()
    const originalCulled = light.frustumCulled
    scene.add(light)

    enableFrustumCulling(scene)

    expect(light.frustumCulled).toBe(originalCulled)
  })
})

describe('disposeResources', () => {
  it('disposes Mesh geometry and material via Object3D', () => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.MeshBasicMaterial()
    const disposeGeo = vi.spyOn(geometry, 'dispose')
    const disposeMat = vi.spyOn(material, 'dispose')

    const mesh = new THREE.Mesh(geometry, material)
    disposeResources(mesh)

    expect(disposeGeo).toHaveBeenCalledOnce()
    expect(disposeMat).toHaveBeenCalledOnce()
  })

  it('disposes multi-material mesh', () => {
    const geometry = new THREE.BufferGeometry()
    const matA = new THREE.MeshBasicMaterial()
    const matB = new THREE.MeshBasicMaterial()
    const disposeGeo = vi.spyOn(geometry, 'dispose')
    const disposeA = vi.spyOn(matA, 'dispose')
    const disposeB = vi.spyOn(matB, 'dispose')

    const mesh = new THREE.Mesh(geometry, [matA, matB])
    disposeResources(mesh)

    expect(disposeGeo).toHaveBeenCalledOnce()
    expect(disposeA).toHaveBeenCalledOnce()
    expect(disposeB).toHaveBeenCalledOnce()
  })

  it('traverses nested object hierarchy', () => {
    const parent = new THREE.Object3D()
    const geo1 = new THREE.BufferGeometry()
    const mat1 = new THREE.MeshBasicMaterial()
    const geo2 = new THREE.BufferGeometry()
    const mat2 = new THREE.MeshBasicMaterial()
    const child1 = new THREE.Mesh(geo1, mat1)
    const child2 = new THREE.Mesh(geo2, mat2)
    parent.add(child1, child2)

    const disposeGeo1 = vi.spyOn(geo1, 'dispose')
    const disposeGeo2 = vi.spyOn(geo2, 'dispose')

    disposeResources(parent)

    expect(disposeGeo1).toHaveBeenCalledOnce()
    expect(disposeGeo2).toHaveBeenCalledOnce()
  })

  it('disposes Material directly', () => {
    const material = new THREE.MeshBasicMaterial()
    const dispose = vi.spyOn(material, 'dispose')

    disposeResources(material)

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('disposes Texture directly', () => {
    const texture = new THREE.Texture()
    const dispose = vi.spyOn(texture, 'dispose')

    disposeResources(texture)

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('disposes BufferGeometry directly', () => {
    const geometry = new THREE.BufferGeometry()
    const dispose = vi.spyOn(geometry, 'dispose')

    disposeResources(geometry)

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('handles Object3D with no children or geometry gracefully', () => {
    const obj = new THREE.Object3D()
    expect(() => disposeResources(obj)).not.toThrow()
  })
})
