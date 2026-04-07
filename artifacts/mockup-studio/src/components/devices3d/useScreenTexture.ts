import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Returns a THREE texture for the current screen content (image or video) */
export function useScreenTexture(
  screenshotUrl: string | null,
  videoUrl: string | null,
  contentType: 'image' | 'video' | null,
) {
  const textureRef = useRef<THREE.Texture | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Dispose previous
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
      textureRef.current = tex;
    } else if (contentType === 'image' && screenshotUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(screenshotUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        textureRef.current = tex;
      });
    } else {
      textureRef.current = null;
    }

    return () => {
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current = null;
      }
    };
  }, [screenshotUrl, videoUrl, contentType]);

  return textureRef;
}
