/**
 * 3D Performance optimization utilities for Mockup Studio
 * Includes device detection, adaptive rendering, and performance monitoring
 */

import * as THREE from 'three';

export interface PerformanceConfig {
  maxPixelRatio: number;
  enableSSAO: boolean;
  enableBloom: boolean;
  enableDOF: boolean;
  shadowMapSize: 512 | 1024 | 2048;
  textureResolution: 'low' | 'medium' | 'high';
  enablePostFX: boolean;
}

export interface DeviceProfile {
  isMobile: boolean;
  hasGPU: boolean;
  gpuMemory: number | null;
  tier: 'low' | 'medium' | 'high';
}

let cachedProfile: DeviceProfile | null = null;

/**
 * Clear the cached device profile so the next call to
 * `detectDeviceProfile` re-detects from scratch.
 */
export function resetProfileCache(): void {
  cachedProfile = null;
}

/**
 * Detect device capabilities and determine performance tier.
 * Result is cached — repeated calls return the same object without
 * creating additional WebGL contexts.
 */
export function detectDeviceProfile(): DeviceProfile {
  if (cachedProfile) return cachedProfile;

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|tablet/.test(ua);

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const hasGPU = !!gl;

  let gpuMemory: number | null = null;
  let tier: 'low' | 'medium' | 'high' = 'medium';

  if (gl) {
    const ext = gl.getExtension('webgl-debug-renderer-info');
    if (ext) {
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      gpuMemory = estimateGPUMemory(renderer);
    }
    // Release the WebGL context explicitly
    const loseCtx = gl.getExtension('WEBGL_lose_context');
    if (loseCtx) loseCtx.loseContext();
  }

  // Determine tier based on device capabilities
  if (isMobile) {
    tier = 'low';
  } else if (gpuMemory && gpuMemory > 2000) {
    tier = 'high';
  } else if (gpuMemory && gpuMemory < 512) {
    tier = 'low';
  }

  canvas.remove();

  cachedProfile = { isMobile, hasGPU, gpuMemory, tier };
  return cachedProfile;
}

/**
 * Get optimized rendering configuration based on device profile
 */
export function getOptimizedConfig(profile: DeviceProfile): PerformanceConfig {
  const baseConfig: PerformanceConfig = {
    maxPixelRatio: 1,
    enableSSAO: true,
    enableBloom: true,
    enableDOF: true,
    shadowMapSize: 1024,
    textureResolution: 'high',
    enablePostFX: true,
  };

  if (profile.tier === 'low') {
    return {
      maxPixelRatio: 1,
      enableSSAO: false,
      enableBloom: false,
      enableDOF: false,
      shadowMapSize: 512,
      textureResolution: 'low',
      enablePostFX: false,
    };
  }

  if (profile.tier === 'medium') {
    return {
      maxPixelRatio: Math.min(window.devicePixelRatio, 2),
      enableSSAO: true,
      enableBloom: true,
      enableDOF: false,
      shadowMapSize: 1024,
      textureResolution: 'medium',
      enablePostFX: true,
    };
  }

  // High-end
  return {
    ...baseConfig,
    maxPixelRatio: window.devicePixelRatio,
  };
}

/**
 * Estimate GPU memory from renderer string
 */
function estimateGPUMemory(renderer: string): number | null {
  const match = renderer?.match(/(\d+)\s*(?:GB|MB)/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const isGB = renderer.includes('GB');
  return isGB ? value * 1024 : value;
}

/**
 * Performance monitor for tracking FPS and render times
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTime = 16.67;
  private frames: number[] = [];
  private readonly sampleSize = 60;

  update(): void {
    this.frameCount++;
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    if (deltaTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }

    this.frames.push(deltaTime);
    if (this.frames.length > this.sampleSize) {
      this.frames.shift();
    }

    this.frameTime = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }

  getFPS(): number {
    return this.fps;
  }

  getFrameTime(): number {
    return this.frameTime;
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;
    return Math.round(1000 / this.frameTime);
  }
}

/**
 * Optimize texture by reducing size or quality
 */
export function optimizeTexture(
  texture: THREE.Texture,
  resolution: 'low' | 'medium' | 'high' = 'medium'
): THREE.Texture {
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (resolution === 'low') {
    // Use basic filtering for low-end devices
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }

  return texture;
}

/**
 * Setup efficient shadow maps
 */
export function setupOptimizedShadows(
  light: THREE.Light,
  size: number,
  resolution: number = size
): void {
  if (light instanceof THREE.DirectionalLight || light instanceof THREE.PointLight) {
    if (light.shadow) {
      light.shadow.mapSize.width = size;
      light.shadow.mapSize.height = size;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 100;

      if (light instanceof THREE.DirectionalLight) {
        const cam = light.shadow.camera as THREE.OrthographicCamera;
        cam.left = -10;
        cam.right = 10;
        cam.top = 10;
        cam.bottom = -10;
        cam.updateProjectionMatrix();
      }
    }
  }
}

/**
 * Enable frustum culling for better performance
 */
export function enableFrustumCulling(scene: THREE.Scene): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = true;
    }
  });
}

/**
 * Dispose resources properly to prevent memory leaks
 */
export function disposeResources(obj: THREE.Object3D | THREE.Material | THREE.Texture | THREE.BufferGeometry): void {
  if (obj instanceof THREE.Object3D) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  } else if (obj instanceof THREE.Material) {
    obj.dispose();
  } else if (obj instanceof THREE.Texture) {
    obj.dispose();
  } else if (obj instanceof THREE.BufferGeometry) {
    obj.dispose();
  }
}
