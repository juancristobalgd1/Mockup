import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setGlobalScreenTexture } from './textureGlobal';

export type ScreenFitMode = 'cover' | 'contain' | 'fill';

/** Aspect delta below which portrait/landscape auto-rotation is skipped. */
const ORIENTATION_TOLERANCE = 0.05;

/**
 * Returns true if source orientation (portrait/landscape) is opposite to the
 * device screen's. In that case we rotate the texture 90° so a horizontal
 * photo dropped on a vertical phone fills the screen instead of being shown
 * at a tiny letterboxed width.
 */
function shouldAutoRotate(srcAspect: number, screenAspect: number): boolean {
  const srcLandscape = srcAspect > 1 + ORIENTATION_TOLERANCE;
  const srcPortrait = srcAspect < 1 - ORIENTATION_TOLERANCE;
  const scrLandscape = screenAspect > 1 + ORIENTATION_TOLERANCE;
  const scrPortrait = screenAspect < 1 - ORIENTATION_TOLERANCE;
  return (srcLandscape && scrPortrait) || (srcPortrait && scrLandscape);
}

/**
 * Apply CSS-object-fit semantics to a THREE texture via UV transform. The
 * screen meshes have UVs normalized to [0,1]×[0,1] (see normalizeScreenUVs),
 * so repeat/offset sample a sub-rect, and rotation spins around center.
 *
 *  • cover   — fills the screen, crops overflow (default)
 *  • contain — fits entirely, ClampToEdge makes the overflow rows/columns
 *              repeat the edge pixel row (visually similar to a letterbox
 *              in the edge color, which for a PNG screenshot is usually the
 *              page background).
 *  • fill    — stretches to fill, may distort.
 *
 * Auto-rotates 90° when the media and screen have opposite orientations.
 */
function applyFit(
  tex: THREE.Texture,
  srcW: number,
  srcH: number,
  screenAspect: number,
  fitMode: ScreenFitMode,
) {
  tex.center.set(0.5, 0.5);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  if (!srcW || !srcH) {
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    tex.rotation = 0;
    tex.needsUpdate = true;
    return;
  }

  const rawAspect = srcW / srcH;
  const rotate = shouldAutoRotate(rawAspect, screenAspect);
  tex.rotation = rotate ? Math.PI / 2 : 0;
  // After rotation the effective aspect flips.
  const effAspect = rotate ? 1 / rawAspect : rawAspect;

  if (fitMode === 'fill') {
    tex.repeat.set(1, 1);
    tex.offset.set(0, 0);
    tex.needsUpdate = true;
    return;
  }

  if (fitMode === 'cover') {
    // Sample a centered sub-rect whose aspect matches the screen, so the
    // whole screen is covered without distortion (edges get cropped).
    if (effAspect > screenAspect) {
      const r = screenAspect / effAspect;
      tex.repeat.set(r, 1);
      tex.offset.set((1 - r) / 2, 0);
    } else {
      const r = effAspect / screenAspect;
      tex.repeat.set(1, r);
      tex.offset.set(0, (1 - r) / 2);
    }
    tex.needsUpdate = true;
    return;
  }

  // contain — scale down so the whole media fits, then offset so the empty
  // area is filled by edge clamping (effectively a letterbox in the source
  // edge color).
  if (effAspect > screenAspect) {
    // Media is wider than screen → fit width, bars on top/bottom.
    const r = effAspect / screenAspect; // > 1
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  } else {
    const r = screenAspect / effAspect; // > 1
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  }
  tex.needsUpdate = true;
}

/**
 * Loads the current screen content (image or video) as a THREE texture and
 * keeps it in the global singleton that the 3D device models consume every
 * frame.
 *
 * `screenAspect` is the device screen's width/height ratio (post-landscape
 * flip). `fitMode` mirrors CSS object-fit semantics.
 *
 * Returns a ref so the calling component's prop shape stays compatible with
 * the older API, but consumers actually read from the global texture.
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

  // Update fit on the CURRENT texture whenever aspect or mode changes,
  // without reloading the image.
  useEffect(() => {
    const tex = textureRef.current;
    if (!tex) return;
    if (tex instanceof THREE.VideoTexture) {
      const vid = videoElRef.current;
      if (vid && vid.videoWidth && vid.videoHeight) {
        applyFit(tex, vid.videoWidth, vid.videoHeight, screenAspect, fitMode);
      }
    } else if (tex.image) {
      const img = tex.image as HTMLImageElement;
      applyFit(tex, img.naturalWidth || img.width, img.naturalHeight || img.height, screenAspect, fitMode);
    }
  }, [screenAspect, fitMode]);

  // Load / reload texture when the URL or content type changes.
  useEffect(() => {
    // Dispose previous image texture. VideoTexture lifetime is tied to the
    // element, which we clean up explicitly below.
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

      const onMeta = () => {
        if (cancelled) return;
        applyFit(tex, vid.videoWidth, vid.videoHeight, screenAspect, fitMode);
      };
      if (vid.readyState >= 1) onMeta();
      else vid.addEventListener('loadedmetadata', onMeta, { once: true });

      setGlobalScreenTexture(tex);
    } else if (contentType === 'image' && screenshotUrl) {
      const loader = new THREE.TextureLoader();
      // Same-origin blob/object URLs don't need CORS; cross-origin ones
      // (e.g. thum.io) will fail silently if the server omits CORS — in that
      // case the browser still shows the image, it just can't be read back
      // as pixels, which is fine since we never call toDataURL on it.
      loader.setCrossOrigin('anonymous');
      loader.load(
        screenshotUrl,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = true;
          const img = tex.image as HTMLImageElement;
          applyFit(
            tex,
            img?.naturalWidth || img?.width || 0,
            img?.naturalHeight || img?.height || 0,
            screenAspect,
            fitMode,
          );
          textureRef.current = tex;
          setGlobalScreenTexture(tex);
        },
        undefined,
        () => {
          // Loader failed — usually a bad URL. Clear so we don't show stale.
          textureRef.current = null;
          setGlobalScreenTexture(null);
        },
      );
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
    // screenAspect / fitMode are intentionally excluded: the other effect
    // applies them without forcing a re-download.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenshotUrl, videoUrl, contentType]);

  return textureRef;
}
