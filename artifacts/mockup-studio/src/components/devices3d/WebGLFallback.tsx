import { Component, type ReactNode } from 'react';
import { PhoneDevice } from '../devices/PhoneDevice';
import { TabletDevice } from '../devices/TabletDevice';
import { MacBookDevice } from '../devices/MacBookDevice';
import { Browser } from '../devices/Browser';
import { AppleWatch } from '../devices/AppleWatch';
import { IMac } from '../devices/IMac';
import { useApp } from '../../store';

function CSSDeviceFallback() {
  const { state } = useApp();
  const getDevice = () => {
    switch (state.deviceType) {
      case 'iphone':
      case 'android': return <PhoneDevice />;
      case 'ipad': return <TabletDevice />;
      case 'macbook': return <MacBookDevice />;
      case 'browser': return <Browser />;
      case 'watch': return <AppleWatch />;
      case 'imac': return <IMac />;
      default: return <PhoneDevice />;
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2,
    }}>
      <div style={{ padding: state.canvasPadding ?? 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          transform: `scale(${state.scale ?? 1}) rotate(${state.rotation ?? 0}deg)`,
          filter: `drop-shadow(0 20px 60px rgba(0,0,0,0.5))`,
          transition: 'transform 0.3s ease',
        }}>
          {getDevice()}
        </div>
      </div>
    </div>
  );
}

export function checkWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

interface ErrorBoundaryState { error: boolean }
interface ErrorBoundaryProps { children: ReactNode; fallback: ReactNode }

export class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: false };
  }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

export { CSSDeviceFallback };
