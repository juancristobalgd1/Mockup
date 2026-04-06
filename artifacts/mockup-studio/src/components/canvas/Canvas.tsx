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

const RATIO_ASPECT: Record<string, string> = {
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
  '9:16': '9 / 16',
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
    let parts = [`scale(${state.scale})`, `rotate(${state.rotation}deg)`];
    if (state.is3D) {
      parts = [
        `perspective(900px)`,
        `rotateX(${state.tiltX}deg)`,
        `rotateY(${state.tiltY}deg)`,
        `scale(${state.scale})`,
        `rotate(${state.rotation}deg)`,
      ];
    }
    return parts.join(' ');
  };

  const getShadow = () => {
    const s = state.shadowIntensity;
    if (state.shadowStyle === 'none' || s === 0) return 'none';

    const rad = (state.shadowDirection * Math.PI) / 180;
    const offsetX = Math.round(Math.sin(rad) * s * 0.15);
    const offsetY = Math.round(-Math.cos(rad) * s * 0.4);
    const alpha = Math.min(0.85, s * 0.01);

    if (state.shadowStyle === 'hug') {
      const blur = s * 0.2;
      const spread = s * 0.05;
      return `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(0,0,0,${alpha + 0.1})`;
    }

    // spread
    const blur = s * 0.8;
    const spread = s * 0.05;
    return `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(0,0,0,${alpha})`;
  };

  const DeviceComponent = DeviceComponents[state.deviceType] ?? IPhone15Pro;

  const handleTextDrag = (id: string, e: React.MouseEvent) => {
    const container = (e.currentTarget as HTMLElement).closest('[data-canvas-area]') as HTMLElement;
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

  const hasFixedRatio = state.canvasRatio !== 'free';

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={getBackground()}
    >
      {/* Background overlay */}
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

      {/* Fixed ratio box or full-bleed */}
      <div
        ref={ref}
        data-canvas-area="true"
        style={{
          position: hasFixedRatio ? 'relative' : 'absolute',
          inset: hasFixedRatio ? undefined : 0,
          aspectRatio: hasFixedRatio ? RATIO_ASPECT[state.canvasRatio] : undefined,
          maxWidth: hasFixedRatio ? '100%' : undefined,
          maxHeight: hasFixedRatio ? '100%' : undefined,
          width: hasFixedRatio ? 'auto' : '100%',
          height: hasFixedRatio ? 'auto' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: state.canvasPadding,
          boxSizing: 'border-box',
          overflow: 'hidden',
          zIndex: 2,
          ...(hasFixedRatio ? {
            background: 'inherit',
            outline: '2px dashed rgba(255,255,255,0.1)',
          } : {}),
        }}
      >
        {/* Device */}
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

        {/* Text overlays */}
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
              zIndex: 20,
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseDown={(e) => handleTextDrag(overlay.id, e)}
            data-testid={`text-overlay-${overlay.id}`}
          >
            {overlay.text}
          </div>
        ))}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
