import { Component, type ReactNode } from 'react';
import { useApp } from '../../store';

function CSSDeviceFallback() {
  const { state } = useApp();
  
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2,
      color: 'white',
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>WebGL no disponible</h2>
        <p style={{ opacity: 0.8 }}>Esta herramienta necesita WebGL para renderizar mockups 3D. Prueba con otro navegador o activa la aceleración por hardware.</p>
        <div style={{ 
          marginTop: '2rem', 
          width: '200px', 
          height: '300px', 
          border: '2px dashed rgba(255,255,255,0.2)', 
          borderRadius: '20px',
          margin: '2rem auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ opacity: 0.3 }}>{state.deviceType.toUpperCase()}</span>
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
