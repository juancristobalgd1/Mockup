import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setGlobalScreenTexture } from './textureGlobal';

export type ScreenFitMode = 'cover' | 'contain' | 'fill';

/** Output canvas long side: balances retina-quality sharpness with GPU memory. */
const CANVAS_LONG_SIDE = 2048;

/** Aspect difference below which auto-rotation is skipped. */
const ORIENTATION_TOLERANCE = 0.05;

/**
 * Returns true if the source's orientation is opposite to the device screen's
 * (landscape photo on a portrait phone, or vice versa). In that case we
 * rotate the source 90° so it fills the screen without heavy cropping.
 */
function shouldAutoRotate(srcAspect: number, screenAspect: number): boolean {
  const srcLandscape = srcAspect > 1 + ORIENTATION_TOLERANCE;
  const srcPortrait = srcAspect < 1 - ORIENTATION_TOLERANCE;
  const scrLandscape = screenAspect > 1 + ORIENTATION_TOLERANCE;
  const scrPortrait = screenAspect < 1 - ORIENTATION_TOLERANCE;
  return (srcLandscape && scrPortrait) || (srcPortrait && scrLandscape);
}

/**
 * Compose the loaded image into a canvas that already matches the device
 * screen's aspect ratio. This is equivalent to CSS object-fit applied at the
 * pixel level so that when the canvas is uploaded as a texture it maps 1:1
 * onto the device's screen plane with no stretching.
 */
function composeImageOnCanvas(
  img: HTMLImageElement,
  screenAspect: number,
  fitMode: ScreenFitMode,
): HTMLCanvasElement | null {
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  if (!srcW || !srcH) return null;

  const rotate = shouldAutoRotate(srcW / srcH, screenAspect);
  const effSrcW = rotate ? srcH : srcW;
  const effSrcH = rotate ? srcW : srcH;

  // Output canvas at the exact device aspect so UV = identity gives us
  // a pixel-accurate mapping on the screen mesh.
  let outW: number;
  let outH: number;
  if (screenAspect >= 1) {
    outW = CANVAS_LONG_SIDE;
    outH = Math.max(2, Math.round(outW / screenAspect));
  } else {
    outH = CANVAS_LONG_SIDE;
    outW = Math.max(2, Math.round(outH * screenAspect));
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Letterbox fill for `contain` so unused area is a solid color, not edge smear.
  if (fitMode === 'contain') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outW, outH);
  }

  // Draw rect expressed in output-canvas coordinates, in the *effective*
  // (post-rotation) orientation.
  let dw: number;
  let dh: number;
  if (fitMode === 'fill') {
    dw = outW;
    dh = outH;
  } else {
    const scale =
      fitMode === 'cover'
        ? Math.max(outW / effSrcW, outH / effSrcH)
        : Math.min(outW / effSrcW, outH / effSrcH);
    dw = effSrcW * scale;
    dh = effSrcH * scale;
  }
  const dx = (outW - dw) / 2;
  const dy = (outH - dh) / 2;

  if (rotate) {
    // Rotate 90° CW around the draw rect center. In the rotated frame, the
    // output rectangle (dw × dh) corresponds to drawing the source image
    // at (-dh/2, -dw/2) with size (dh, dw) — swapping dimensions is intentional.
    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -dh / 2, -dw / 2, dh, dw);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  return canvas;
}

/**
 * Apply CSS-like fit to a video texture via UV transform. Composing each
 * frame on a canvas would work too but costs a draw per frame; UV repeat/
 * offset is GPU-native and free.
 */
function applyVideoFit(
  tex: THREE.VideoTexture,
  vid: HTMLVideoElement,
  screenAspect: number,
  fitMode: ScreenFitMode,
) {
  const vw = vid.videoWidth;
  const vh = vid.videoHeight;
  tex.center.set(0.5, 0.5);

  if (!vw || !vh) {
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    tex.rotation = 0;
    return;
  }

  const rotate = shouldAutoRotate(vw / vh, screenAspect);
  tex.rotation = rotate ? Math.PI / 2 : 0;
  const effAspect = rotate ? vh / vw : vw / vh;

  if (fitMode === 'fill' || fitMode === 'contain') {
    // `contain` on video would need real letterbox bars (can't do via UV
    // without stretching edge pixels), so for video we degrade contain to
    // fill — avoids visual artifacts and keeps the full frame visible.
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    return;
  }

  // cover: sample a centered sub-rect of the texture so the plane fills.
  if (effAspect > screenAspect) {
    const r = screenAspect / effAspect;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    const r = effAspect / screenAspect;
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  }
}

/**
 * Returns a THREE texture ref for the current screen content (image or
 * video), automatically adapted to the device's screen size and orientation.
 *
 * `screenAspect` is the device screen's width/height ratio (including the
 * landscape flip). `fitMode` mirrors CSS object-fit semantics.
 */
export function useScreenTexture(
  screenshotUrl: string | null,
  videoUrl: string | null,
  contentType: 'image' | 'video' | null,
  screenAspect: number = 9 / 19.5,
  fitMode: ScreenFitMode = 'cover',
) {
  const textureRef = useRef<THREE.Texture | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Dispose previous image texture (VideoTexture is tied to the element lifecycle).
    if (
      textureRef.current &&
      !(textureRef.current instanceof THREE.VideoTexture)
    ) {
      textureRef.current.dispose();
    }
    if (videoElRef.current) {
      videoElRef.current.pause();
      videoElRef.current.src = '';
      videoElRef.current = null;
    }

    let cancelled = false;

    if (contentType === 'video' && videoUrl) {
      const vid = document.createElement('video');
      vid.src = videoUrl;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.crossOrigin = 'anonymous';
      vid.play().catch(() => {});
      videoElRef.current = vid;

      const tex = new THREE.VideoTexture(vid);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = tex;

      const applyFit = () => {
        if (cancelled) return;
        applyVideoFit(tex, vid, screenAspect, fitMode);
      };
      if (vid.readyState >= 1) applyFit();
      else vid.addEventListener('loadedmetadata', applyFit, { once: true });

      setGlobalScreenTexture(tex);
    } else if (contentType === 'image' && screenshotUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';

      const fallbackRaw = () => {
        // Last-resort path when the canvas route is unusable (CORS taint,
        // decode error, etc). The image still shows, just stretched onto
        // the plane without CSS-style fitting.
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';
        loader.load(screenshotUrl, (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          textureRef.current = tex;
          setGlobalScreenTexture(tex);
        });
      };

      img.onload = () => {
        if (cancelled) return;
        const canvas = composeImageOnCanvas(img, screenAspect, fitMode);
        if (!canvas) {
          fallbackRaw();
          return;
        }
        try {
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          tex.needsUpdate = true;
          textureRef.current = tex;
          setGlobalScreenTexture(tex);
        } catch {
          fallbackRaw();
        }
      };
      img.onerror = fallbackRaw;
      img.src = screenshotUrl;
    } else {
      textureRef.current = null;
      setGlobalScreenTexture(null);
    }

    return () => {
      cancelled = true;
      if (videoElRef.current) {
        videoElRef.current.pause();
        videoElRef.current = null;
      }
    };
  }, [screenshotUrl, videoUrl, contentType, screenAspect, fitMode]);

  return textureRef;
}
