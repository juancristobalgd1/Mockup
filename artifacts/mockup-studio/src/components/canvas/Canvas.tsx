import { forwardRef, useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import type { TextOverlay } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS, ANIMATED_BACKGROUNDS, ANIMATED_BG_KEYFRAMES } from '../../data/backgrounds';
import type { AnimatedBackground } from '../../data/backgrounds';
import { LIGHT_OVERLAYS } from '../../data/lightOverlays';
import { AnnotateCanvas } from './AnnotateCanvas';
import { Device3DViewer } from '../devices3d/Device3DViewer';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';
import { CSSDeviceFallback, checkWebGL } from '../devices3d/WebGLFallback';

interface CanvasProps {
  textOverlays: TextOverlay[];
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  viewerRef?: React.RefObject<Device3DViewerHandle | null>;
  moviePlaying?: boolean;
  movieTimeRef?: React.MutableRefObject<number>;
}

const RATIO_VALUES: Record<string, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '3:1': 3,
  '5:4': 5 / 4,
};


/** Renders a type='canvas' AnimatedBackground using a live requestAnimationFrame loop. */
function CanvasBgRenderer({ bg, opacity, borderRadius }: { bg: AnimatedBackground; opacity: number; borderRadius?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bg.render) return;
    const ctx = canvas.getContext('2d')!;
    startRef.current = performance.now();

    const setSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width) || 800;
      canvas.height = Math.round(height) || 600;
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);
    setSize();

    const draw = (ts: number) => {
      const t = (ts - startRef.current) / 1000;
      if (canvas.width > 0 && canvas.height > 0 && bg.render) {
        bg.render(ctx, t, canvas.width, canvas.height);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [bg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, borderRadius, opacity }}
    />
  );
}

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ textOverlays, onUpdateText, viewerRef, moviePlaying, movieTimeRef }, ref) => {
  const { state } = useApp();
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    setWebglAvailable(checkWebGL());
  }, []);

  const getBackground = (): React.CSSProperties => {
    if (state.bgType === 'animated') return {};
    if (state.bgType === 'video') return { background: '#090b10' };
    if (state.bgType === 'none') return { background: '#111113' };
    if (state.bgType === 'transparent') return {
      backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
      backgroundColor: '#1a1a1a',
    };
    if (state.bgType === 'solid') return { background: state.bgColor };
    if (state.bgType === 'gradient') {
      const g = GRADIENTS.find(g => g.id === state.bgColor);
      return { background: g ? g.css : GRADIENTS[0].css };
    }
    if (state.bgType === 'mesh') {
      const m = MESH_GRADIENTS.find(m => m.id === state.bgColor);
      return { background: m ? m.css : MESH_GRADIENTS[0].css };
    }
    if (state.bgType === 'pattern') {
      const p = PATTERNS.find(p => p.id === state.bgPattern);
      if (p) {
        const style = p.bgStyle(state.bgColor);
        if (style.backgroundSize && typeof style.backgroundSize === 'string') {
          // Multiply numeric values in backgroundSize by bgPatternScale
          const scale = state.bgPatternScale ?? 1;
          style.backgroundSize = style.backgroundSize.replace(/(\d+)(px|%|em|rem)/g, (match, val, unit) => {
            return `${parseFloat(val) * scale}${unit}`;
          });
        }
        return style;
      }
      return { background: state.bgColor };
    }
    if (state.bgType === 'wallpaper') {
      const w = WALLPAPERS.find(w => w.id === state.bgColor);
      return { background: w ? w.css : GRADIENTS[0].css };
    }
    if (state.bgType === 'image' && state.bgImage) {
      return {
        backgroundImage: `url(${state.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return { background: GRADIENTS[0].css };
  };

  const handleTextDrag = (id: string, e: React.MouseEvent) => {
    const container = (e.currentTarget as HTMLElement).closest('[data-canvas-root]') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const overlay = textOverlays.find(t => t.id === id);
    if (!overlay) return;
    const startPX = overlay.x;
    const startPY = overlay.y;
    e.preventDefault();

    const onMove = (me: MouseEvent) => {
      const dx = ((me.clientX - startX) / rect.width) * 100;
      const dy = ((me.clientY - startY) / rect.height) * 100;
      onUpdateText(id, {
        x: Math.max(0, Math.min(100, startPX + dx)),
        y: Math.max(0, Math.min(100, startPY + dy)),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const hasRatio = state.canvasRatio !== 'free';
  const ratioValue = hasRatio ? RATIO_VALUES[state.canvasRatio] : null;

  const borderRadius = state.canvasRadius ? `${state.canvasRadius}px` : undefined;

  const stageStyle: React.CSSProperties = hasRatio && ratioValue
    ? {
      position: 'relative',
      aspectRatio: `${ratioValue}`,
      maxWidth: 'calc(100% - 48px)',
      maxHeight: 'calc(100% - 48px)',
      width: ratioValue >= 1 ? 'calc(100% - 48px)' : 'auto',
      height: ratioValue < 1 ? 'calc(100% - 48px)' : 'auto',
    }
    : {
      position: 'relative',
      width: '100%',
      height: '100%',
    };

  const bgOpacity = state.bgType === 'none' || state.bgType === 'transparent'
    ? 1
    : (state.bgOpacity ?? 100) / 100;

  return (
    <div
      ref={ref}
      className={`relative ${hasRatio ? 'flex items-center justify-center' : 'overflow-hidden'}`}
      style={{ width: '100%', height: '100%', overflow: hasRatio ? 'visible' : 'hidden' }}
      data-testid="canvas-area"
    >
      {/* Animated background keyframes injection */}
      {state.bgType === 'animated' && <style>{ANIMATED_BG_KEYFRAMES}</style>}

      <div
        data-canvas-root="true"
        style={{
          ...stageStyle,
          overflow: 'hidden',
          borderRadius,
          boxShadow: hasRatio
            ? '0 0 0 1px rgba(255,255,255,0.08), 0 26px 60px rgba(0,0,0,0.28)'
            : undefined,
          background: state.bgType === 'transparent' ? '#1a1a1a' : undefined,
        }}
      >

        {/* Background layer — separate div so opacity doesn't affect children */}
        {state.bgType === 'animated' ? (() => {
          const bg = ANIMATED_BACKGROUNDS.find(b => b.id === state.bgAnimated) ?? ANIMATED_BACKGROUNDS[0];
          if (bg.type === 'iframe' && bg.src) {
            return (
              <iframe
                key={bg.id}
                src={bg.src}
                title={bg.label}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 0, borderRadius, opacity: bgOpacity }}
                sandbox="allow-scripts allow-same-origin"
              />
            );
          }
          if (bg.type === 'canvas' && bg.render) {
            return <CanvasBgRenderer key={bg.id} bg={bg} opacity={bgOpacity} borderRadius={borderRadius} />;
          }
          return (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, borderRadius, opacity: bgOpacity,
              ...(bg.animStyle ?? {}),
              ...(state.bgBlur > 0 ? { filter: `blur(${state.bgBlur}px)`, transform: 'scale(1.05)' } : {}),
            }} />
          );
        })() : (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, borderRadius, opacity: bgOpacity,
            ...getBackground(),
            ...(state.bgBlur > 0 ? { filter: `blur(${state.bgBlur}px)`, transform: 'scale(1.05)' } : {}),
          }} />
        )}

        {state.bgType === 'video' && state.bgVideo && (
          <video
            data-bg-video="true"
            src={state.bgVideo}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute', inset: 0, zIndex: 0, borderRadius, opacity: bgOpacity,
              width: '100%', height: '100%', objectFit: 'cover',
              ...(state.bgBlur > 0 ? { filter: `blur(${state.bgBlur}px)`, transform: 'scale(1.05)' } : {}),
            }}
          />
        )}

        {/* Vignette overlay */}
        {state.bgVignette && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', borderRadius,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${(state.bgVignetteIntensity ?? 50) / 100}) 100%)`,
          }} />
        )}

        {/* Color overlay */}
        {state.overlayEnabled && (
          <div style={{ position: 'absolute', inset: 0, background: state.overlayColor, opacity: state.overlayOpacity / 100, pointerEvents: 'none', zIndex: 1, borderRadius }} />
        )}

        {/* Light / shadow overlay — zIndex 1 when bgOnly (behind device), 18 otherwise */}
        {state.lightOverlay && (() => {
          const preset = LIGHT_OVERLAYS.find(p => p.id === state.lightOverlay);
          if (!preset) return null;
          return (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              zIndex: state.lightOverlayBgOnly ? 1 : 18,
              borderRadius,
              backgroundImage: preset.background,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: state.lightOverlayOpacity / 100,
              mixBlendMode: state.lightOverlayBgOnly ? 'normal' : state.lightOverlayBlend as React.CSSProperties['mixBlendMode'],
              filter: preset.filter,
            }} />
          );
        })()}

        {/* Film grain overlay — zIndex 1 when bgOnly (behind device), 20 otherwise */}
        {state.grain && (
          <div style={{
            position: 'absolute', inset: 0,
            zIndex: state.grainBgOnly ? 1 : 20,
            pointerEvents: 'none', borderRadius,
            opacity: state.grainIntensity / 100,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '180px 180px',
            mixBlendMode: 'overlay',
          }} />
        )}

        {/* Artboard edge */}
        {hasRatio && ratioValue && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            pointerEvents: 'none',
            borderRadius,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }} />
        )}

        {/* 3D Device Viewer or CSS fallback */}
        {webglAvailable === false ? (
          <CSSDeviceFallback />
        ) : webglAvailable === true ? (
          <Device3DViewer
            ref={viewerRef}
            style={{ position: 'absolute', inset: 0, zIndex: 2 }}
            movieTimeRef={movieTimeRef}
          />
        ) : null /* loading – will resolve synchronously */}

        {/* Annotation drawing layer */}
        <AnnotateCanvas />

        {/* Text overlays */}
        {textOverlays.map(overlay => {
          if (overlay.kind === 'label') return null;

          return (
            <div
              key={overlay.id}
              style={{
                position: 'absolute',
                left: `${overlay.x}%`, top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: overlay.fontSize, color: overlay.color,
                fontWeight: overlay.isBold ? 700 : 400,
                fontStyle: overlay.isItalic ? 'italic' : 'normal',
                cursor: 'move', userSelect: 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                whiteSpace: 'pre', zIndex: 10, fontFamily: 'Inter, sans-serif',
              }}
              onMouseDown={(e) => handleTextDrag(overlay.id, e)}
              data-testid={`text-overlay-${overlay.id}`}
            >
              {overlay.text}
            </div>
          );
        })}
      </div>

    </div>
  );
});

Canvas.displayName = 'Canvas';
