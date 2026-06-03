import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setGlobalScreenTexture } from './textureGlobal';
import { optimizeTexture } from '../../utils/performance';
import { detectDeviceProfile, getOptimizedConfig } from '../../utils/performance';

/** Returns a THREE texture ref for the current screen content (image or video).
 *  Also writes the texture into the global singleton so useFrame loops can
 *  read it imperatively without closure/timing issues. */
export function useScreenTexture(
  screenshotUrl: string | null,
  videoUrl: string | null,
  contentType: 'image' | 'video' | null,
) {
  const textureRef = useRef<THREE.Texture | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const loaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  // Get performance config for texture optimization
  const perfConfig = useRef(getOptimizedConfig(detectDeviceProfile())).current;

  useEffect(() => {
    // Dispose previous image texture (VideoTexture is managed by the video element)
    if (textureRef.current && !(textureRef.current instanceof THREE.VideoTexture)) {
      textureRef.current.dispose();
    }
    if (videoElRef.current) {
      videoElRef.current.pause();
      videoElRef.current.src = '';
      videoElRef.current = null;
    }

    if (contentType === 'video' && videoUrl) {
      const vid = document.createElement('video');
      vid.src = videoUrl;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.play().catch(() => {});
      videoElRef.current = vid;

      const tex = new THREE.VideoTexture(vid);
      tex.colorSpace = THREE.SRGBColorSpace;

      // Optimize texture based on device capabilities
      if (perfConfig.textureResolution === 'low') {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }

      textureRef.current = tex;
      setGlobalScreenTexture(tex);
    } else if (contentType === 'image' && screenshotUrl) {
      loaderRef.current.crossOrigin = 'anonymous';
      loaderRef.current.load(
        screenshotUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;

          // Optimize loaded texture based on device performance tier
          optimizeTexture(tex, perfConfig.textureResolution);

          textureRef.current = tex;
          setGlobalScreenTexture(tex);
        },
        undefined,
        (error) => {
          console.warn('Failed to load texture:', error);
        }
      );
    } else {
      textureRef.current = null;
      setGlobalScreenTexture(null);
    }

    return () => {
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current = null;
      }
    };
  }, [screenshotUrl, videoUrl, contentType, perfConfig]);

  return textureRef;
}
