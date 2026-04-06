import { forwardRef } from 'react';
import { useApp } from '../../store';
import type { TextOverlay } from '../../store';
import { IPhone15Pro } from '../devices/IPhone15Pro';
import { AndroidPhone } from '../devices/AndroidPhone';
import { IPad } from '../devices/IPad';
import { MacBook } from '../devices/MacBook';
import { Browser } from '../devices/Browser';
import { AppleWatch } from '../devices/AppleWatch';
import { IMac } from '../devices/IMac';
import { GRADIENTS, MESH_GRADIENTS, PATTERNS, WALLPAPERS } from '../../data/backgrounds';

interface CanvasProps {
  textOverlays: TextOverlay[];
  onUpdateText: (id: string, updates: Partial<TextOverlay>) => void;
}

const DeviceComponents = {
  iphone: IPhone15Pro,
  android: AndroidPhone,
  ipad: IPad,
  macbook: MacBook,
  browser: Browser,
  watch: AppleWatch,
  imac: IMac,
};

const RATIO_VALUES: Record<string, number> = {
  '1:1': 1,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ textOverlays, onUpdateText }, ref) => {
  const { state } = useApp();

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

  const getAnimationClass = () => {
    switch (state.animation) {
      case 'float': return 'animate-float';
      case 'pulse': return 'animate-pulse-device';
      case 'spin': return 'animate-spin-y';
      case 'slide-in': return 'animate-slide-in';
      default: return '';
    }
  };

  const getDeviceTransform = () => {
    if (state.is3D) {
      return [
        `perspective(900px)`,
        `rotateX(${state.tiltX}deg)`,
        `rotateY(${state.tiltY}deg)`,
        `scale(${state.scale})`,
        `rotate(${state.rotation}deg)`,
      ].join(' ');
    }
    return `scale(${state.scale}) rotate(${state.rotation}deg)`;
  };

  const getShadow = () => {
    const s = state.shadowIntensity;
    if (state.shadowStyle === 'none' || s === 0) return 'none';
    const rad = (state.shadowDirection * Math.PI) / 180;
    const offsetX = Math.round(Math.sin(rad) * s * 0.15);
    const offsetY = Math.round(-Math.cos(rad) * s * 0.4);
    const alpha = Math.min(0.85, s * 0.01);
    if (state.shadowStyle === 'hug') {
      return `${offsetX}px ${offsetY}px ${s * 0.2}px ${s * 0.05}px rgba(0,0,0,${alpha + 0.1})`;
    }
    return `${offsetX}px ${offsetY}px ${s * 0.8}px ${s * 0.05}px rgba(0,0,0,${alpha})`;
  };

  const DeviceComponent = DeviceComponents[state.deviceType] ?? IPhone15Pro;

  const handleTextDrag = (id: string, e: React.MouseEvent) => {
    // Walk up to find the outer canvas ref div
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
    // Outer div — always captures background, ref attached here for export
    <div
      ref={ref}
      data-canvas-root="true"
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={getBackground()}
      data-testid="canvas-area"
    >
      {/* Background color overlay */}
      {state.overlayEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: state.overlayColor,
            opacity: state.overlayOpacity / 100,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Canvas ratio guide overlay — dims areas outside the crop frame */}
      {hasRatio && ratioValue && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        >
          {/* The guide frame itself uses box-shadow to dim outside */}
          <div
            style={{
              position: 'relative',
              aspectRatio: ratioValue,
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              width: `${ratioValue * 100}%`,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
              border: '1.5px dashed rgba(255,255,255,0.2)',
              borderRadius: 4,
            }}
          />
        </div>
      )}

      {/* Device wrapper centered within canvas, with optional padding */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: state.canvasPadding,
          zIndex: 2,
        }}
      >
        <div
          className={getAnimationClass()}
          style={{
            transform: getDeviceTransform(),
            filter: `drop-shadow(${getShadow()})`,
            transformOrigin: 'center center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.3s ease',
          }}
        >
          <DeviceComponent />
        </div>
      </div>

      {/* Text overlays — positioned relative to the full canvas */}
      {textOverlays.map(overlay => (
        <div
          key={overlay.id}
          style={{
            position: 'absolute',
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: overlay.fontSize,
            color: overlay.color,
            fontWeight: overlay.isBold ? 700 : 400,
            fontStyle: overlay.isItalic ? 'italic' : 'normal',
            cursor: 'move',
            userSelect: 'none',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'pre',
            zIndex: 10,
            fontFamily: 'Inter, sans-serif',
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
