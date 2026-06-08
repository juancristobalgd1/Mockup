/**
 * Adaptive rendering performance optimization for 3D viewer
 * Reduces quality/complexity based on FPS targets and device capabilities
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../../store';
import {
  PerformanceMonitor,
  detectDeviceProfile,
  getOptimizedConfig,
  type PerformanceConfig,
} from '../../../utils/performance';

const TARGET_FPS = 55;
const FPS_THRESHOLD_HIGH = 58;
const FPS_THRESHOLD_LOW = 45;
const CHECK_INTERVAL = 60; // frames

/**
 * Hook for adaptive rendering based on performance
 * Automatically reduces quality settings if FPS drops below threshold
 */
export function useAdaptiveRendering() {
  const { state, updateState } = useApp();
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const frameCountRef = useRef(0);
  const [config, setConfig] = useState<PerformanceConfig>(() => {
    const profile = detectDeviceProfile();
    return getOptimizedConfig(profile);
  });

  const currentQualityRef = useRef<'high' | 'medium' | 'low'>(
    config.textureResolution === 'low' ? 'low' : config.textureResolution === 'medium' ? 'medium' : 'high'
  );

  // Initialize performance monitor
  useEffect(() => {
    monitorRef.current = new PerformanceMonitor();
  }, []);

  // Update quality based on FPS
  const updateQuality = useCallback(() => {
    if (!monitorRef.current) return;

    const fps = monitorRef.current.getAverageFPS();
    const currentQuality = currentQualityRef.current;

    // Increase quality if FPS is stable and high
    if (fps > FPS_THRESHOLD_HIGH && currentQuality !== 'high') {
      currentQualityRef.current = currentQuality === 'low' ? 'medium' : 'high';
      const profile = detectDeviceProfile();
      setConfig(getOptimizedConfig(profile));
    }

    // Decrease quality if FPS drops
    if (fps < FPS_THRESHOLD_LOW && currentQuality !== 'low') {
      currentQualityRef.current = currentQuality === 'high' ? 'medium' : 'low';
      const profile = detectDeviceProfile();
      const newConfig = getOptimizedConfig(profile);

      // Force reduced quality on low FPS
      if (fps < 40) {
        newConfig.enableSSAO = false;
        newConfig.enableDOF = false;
        newConfig.enableBloom = false;
      }

      setConfig(newConfig);
    }
  }, []);

  // Monitor FPS each frame
  useFrame(() => {
    if (!monitorRef.current) return;

    monitorRef.current.update();
    frameCountRef.current++;

    if (frameCountRef.current >= CHECK_INTERVAL) {
      updateQuality();
      frameCountRef.current = 0;
    }
  });

  return {
    config,
    fps: monitorRef.current?.getAverageFPS() ?? 60,
    quality: currentQualityRef.current,
  };
}

/**
 * Optimize canvas renderer settings for target performance
 */
export function configureOptimalRenderer(
  renderer: THREE.WebGLRenderer,
  config: PerformanceConfig,
  isMobile: boolean
): void {
  // Pixel ratio optimization
  renderer.setPixelRatio(config.maxPixelRatio);

  // Disable expensive features on low-end devices
  renderer.shadowMap.enabled = config.enableSSAO !== false;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = true;

  // Tone mapping optimization
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Power preference for better battery life
  (renderer.domElement as any).getContext('webgl2')?.getExtension('WEBGL_lose_context');
}

/**
 * Defer non-critical rendering tasks
 */
export class RenderQueue {
  private queue: (() => void)[] = [];
  private processing = false;

  enqueue(task: () => void): void {
    this.queue.push(task);
    if (!this.processing) {
      this.process();
    }
  }

  private process(): void {
    this.processing = true;
    const processNextBatch = () => {
      const batch = this.queue.splice(0, 3); // Process 3 tasks per frame
      batch.forEach(task => task());

      if (this.queue.length > 0) {
        requestAnimationFrame(processNextBatch);
      } else {
        this.processing = false;
      }
    };
    requestAnimationFrame(processNextBatch);
  }
}

export default RenderQueue;
