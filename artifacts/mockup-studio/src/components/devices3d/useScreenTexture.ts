import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { setGlobalScreenTexture } from './textureGlobal';

export type ScreenFitMode = 'cover' | 'contain' | 'fill';

/**
 * Aspect delta under which cover/contain act as the identity. Keeps the
 * default "no-op" behaviour byte-for-byte identical to a stock
 * TextureLoader.load(), so the mesh UVs drive the mapping untouched.
 */
const ASPECT_MATCH_TOLERANCE = 0.02;

/**
 * Apply CSS-object-fit semantics to a THREE texture via UV transform. The
 * screen meshes already have UVs normalised to [0,1] (see normalizeScreenUVs
 * in GLBDeviceModel), so nudging repeat/offset samples a sub-rect of the
 * texture without changing wrap mode, pivot, or rotation — which are things
 * the mesh pipeline may rely on elsewhere.
 *
 *  • cover   — crops overflow so the screen is fully covered (default).
 *  • contain — scales down so the whole media fits, letterboxed at edges.
 *  • fill    — stretches to the full screen (may distort).
 */
function applyFit(
  tex: THREE.Texture,
  srcW: number,
  srcH: number,
  screenAspect: number,
  fitMode: ScreenFitMode,
) {
  // Reset to identity — never touch rotation/center/wrap so we don't
  // fight with the screen mesh's own UV layout.
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);

  if (!srcW || !srcH || fitMode === 'fill') {
    tex.needsUpdate = true;
    return;
  }

  const srcAspect = srcW / srcH;
  if (Math.abs(srcAspect - screenAspect) < ASPECT_MATCH_TOLERANCE) {
    // Aspects already match — identity mapping, same as no hook.
    tex.needsUpdate = true;
    return;
  }

  if (fitMode === 'cover') {
    if (srcAspect > screenAspect) {
      // Source is wider than the screen → crop left/right bands.
      const r = screenAspect / srcAspect;
      tex.repeat.set(r, 1);
      tex.offset.set((1 - r) / 2, 0);
    } else {
      // Source is taller than the screen → crop top/bottom bands.
      const r = srcAspect / screenAspect;
      tex.repeat.set(1, r);
      tex.offset.set(0, (1 - r) / 2);
    }
    tex.needsUpdate = true;
    return;
  }

  // contain — scale the UV window up so the full media is visible inside a
  // letterboxed area. ClampToEdge (mesh default) repeats the edge pixel,
  // which for most screenshots matches the page background.
  if (srcAspect > screenAspect) {
    const r = srcAspect / screenAspect; // > 1 → bars on top/bottom
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  } else {
    const r = screenAspect / srcAspect; // > 1 → bars on left/right
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
