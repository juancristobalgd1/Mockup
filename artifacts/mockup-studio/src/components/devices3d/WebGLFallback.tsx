import { Component, type ReactNode } from 'react';
import { useApp } from '../../store';
import { probeWebGLSupport, tryCreateWebGLRenderer as tryCreateWebGLRendererImpl } from '../../utils/webgl';

interface CSSDeviceFallbackProps {
  error?: string | null;
  onTry3D?: () => void;
}

/**
 * Renders a CSS-based 2D mockup as a fallback when WebGL is not available.
 * This provides a visual representation of the device instead of just an error message.
 */
function CSSDeviceFallback({ error, onTry3D }: CSSDeviceFallbackProps) {
  const { state } = useApp();

  const getDeviceDimensions = () => {
    switch (state.deviceType) {
      case 'macbook':
        return { width: 320, height: 220, borderRadius: '16px' };
      case 'ipad':
        return { width: 280, height: 380, borderRadius: '16px' };
      case 'iphone':
      case 'android':
        return { width: 180, height: 360, borderRadius: '24px' };
      case 'watch':
        return { width: 140, height: 170, borderRadius: '40px' };
      default:
        return { width: 180, height: 360, borderRadius: '24px' };
    }
  };

  const { width, height, borderRadius } = getDeviceDimensions();

  const getDeviceColor = () => {
    const colors: Record<string, string> = {
      black: '#1a1a1a',
      white: '#f0f0f0',
      blue: '#1e88e5',
      red: '#e53935',
      green: '#43a047',
      yellow: '#fdd835',
      silver: '#c0c0c0',
      gray: '#808080',
      gold: '#ffd700',
      pink: '#ff69b4',
      purple: '#9c27b0',
      orange: '#ff9800',
      default: '#1a1a1a',
    };
    return colors[state.deviceColor] || colors.default;
  };

  const deviceColor = getDeviceColor();
  // Check if there's content to display
  const hasContent = !!state.screenshotUrl || !!state.videoUrl;
  const isVideoContent = state.contentType === 'video' && state.videoUrl;
  const isImageContent = state.contentType === 'image' && state.screenshotUrl;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        background: 'transparent',
      }}
      data-testid="css-device-fallback"
    >
      <div
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          borderRadius,
          backgroundColor: deviceColor,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          margin: '20px',
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isVideoContent ? (
            <video
              data-testid="css-fallback-screen-video"
              src={state.videoUrl!}
              autoPlay
              loop
              muted
              playsInline
              aria-label="Device screen video content"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.95,
              }}
            />
          ) : isImageContent ? (
            <div
              data-testid="css-fallback-screen-image"
              style={{
                position: 'absolute',
                inset: 0,
                background: `url(${state.screenshotUrl}) center/cover no-repeat`,
                opacity: 0.95,
              }}
            />
          ) : (
            <div
              style={{
                color: 'rgba(255,255,255,0.3)',
                fontSize: '12px',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              {state.deviceType === 'watch' ? 'No Content' : 'Screen Content'}
            </div>
          )}
        </div>

        {state.deviceType === 'iphone' && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '2px',
            }}
          />
        )}

        {state.deviceType === 'ipad' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '-10px',
              transform: 'translateY(-50%)',
              width: '6px',
              height: '60px',
              backgroundColor: deviceColor,
            }}
          />
        )}

        {state.deviceType !== 'watch' && state.deviceType !== 'ipad' && (
          <>
            <div
              style={{
                position: 'absolute',
                left: '-2px',
                top: '60px',
                width: '2px',
                height: '30px',
                backgroundColor: deviceColor,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '-2px',
                top: '100px',
                width: '2px',
                height: '40px',
                backgroundColor: deviceColor,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '-2px',
                top: '60px',
                width: '2px',
                height: '20px',
                backgroundColor: deviceColor,
              }}
            />
          </>
        )}

        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '3px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: '2px',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '8px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderRadius: '4px',
          }}
        />

        {(state.deviceType === 'iphone' || state.deviceType === 'macbook') && (
          <div
            style={{
              position: 'absolute',
              bottom: state.deviceType === 'iphone' ? '12px' : '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '20px',
              height: '14px',
              opacity: 0.5,
            }}
          >
            <svg
              viewBox="0 0 20 14"
              fill="currentColor"
              style={{ width: '100%', height: '100%', color: 'white', opacity: 0.4 }}
            >
              <path d="M16.05 6.92c-.78-4.82-7.63-4.92-8.32-4.92-.69 0-7.54.1-8.32 4.92C.8 12.22 5.38 14 10 14s9.2-1.78 6.05-7.08zM12.85 9.62c-.4.55-1.05.95-1.7.95-.65 0-1.3-.4-1.7-.95-.35-.5-.25-1.15.2-1.55.4-.4 1.05-.4 1.45 0 .45.4.55 1.05.2 1.55zM7.15 9.62c-.4-.55-1.05-.95-1.7-.95-.65 0-1.3.4-1.7.95-.35.5-.25 1.15.2 1.55.4.4 1.05.4 1.45 0 .45-.4.55-1.05.2-1.55z" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '12px',
          }}
        >
          <p style={{ margin: 0 }}>2D Mode (WebGL unavailable)</p>
        </div>
      )}

      {onTry3D && (
        <button
          type="button"
          data-testid="try-3d-view-button"
          onClick={onTry3D}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: '13px',
            cursor: 'pointer',
            zIndex: 3,
          }}
        >
          Probar vista 3D
        </button>
      )}
    </div>
  );
}

export function checkWebGL(): { available: boolean; error?: string } {
  const result = probeWebGLSupport('basic');
  return { available: result.supported, error: result.error };
}

export function checkWebGLThorough(): { available: boolean; error?: string } {
  const result = probeWebGLSupport('strict');
  return { available: result.supported, error: result.error };
}

export function tryCreateWebGLRenderer(): { gl: WebGLRenderingContext | null; error?: string } {
  return tryCreateWebGLRendererImpl();
}

interface ErrorBoundaryState { error: boolean; glError: boolean }
interface ErrorBoundaryProps { children: ReactNode; fallback: ReactNode }

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false, glError: false };
  }
  static getDerivedStateFromError() { return { error: true, glError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('WebGL Error Boundary caught an error:', error, info);
    this.setState({ error: true, glError: true });
  }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

export { CSSDeviceFallback };
