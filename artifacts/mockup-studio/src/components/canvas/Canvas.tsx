import { forwardRef, useState, useEffect } from 'react';
import { useApp } from '../../store';
import type { TextOverlay } from '../../store';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS } from '../../data/backgrounds';
import { Device3DViewer } from '../devices3d/Device3DViewer';
import type { Device3DViewerHandle } from '../devices3d/Device3DViewer';
import { CSSDeviceFallback, checkWebGL } from '../devices3d/WebGLFallback';

interface CanvasProps {
  textOverlays: TextOverlay[];
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
  viewerRef?: React.RefObject<Device3DViewerHandle | null>;
}

const RATIO_VALUES: Record<string, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ textOverlays, onUpdateText, viewerRef }, ref) => {
  const { state } = useApp();
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglAvailable(checkWebGL());
  }, []);

  const getBackground = (): React.CSSProperties => {
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
      if (p) return p.bgStyle(state.bgColor);
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

  return (
    <div
      ref={ref}
      data-canvas-root="true"
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={getBackground()}
      data-testid="canvas-area"
    >
      {/* Color overlay */}
      {state.overlayEnabled && (
        <div style={{ position: 'absolute', inset: 0, background: state.overlayColor, opacity: state.overlayOpacity / 100, pointerEvents: 'none', zIndex: 1 }} />
      )}

      {/* Canvas ratio guide */}
      {hasRatio && ratioValue && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, pointerEvents: 'none' }}>
          <div style={{
            position: 'relative', aspectRatio: ratioValue, height: '100%',
            maxWidth: '100%', maxHeight: '100%', width: `${ratioValue * 100}%`,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
            border: '1.5px dashed rgba(255,255,255,0.2)', borderRadius: 4,
          }} />
        </div>
      )}

      {/* 3D Device Viewer or CSS fallback */}
      {webglAvailable === false ? (
        <CSSDeviceFallback />
      ) : webglAvailable === true ? (
        <Device3DViewer
          ref={viewerRef}
          style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        />
      ) : null /* loading – will resolve synchronously */}

      {/* Text overlays */}
      {textOverlays.map(overlay => (
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
      ))}
    </div>
  );
});

Canvas.displayName = 'Canvas';
