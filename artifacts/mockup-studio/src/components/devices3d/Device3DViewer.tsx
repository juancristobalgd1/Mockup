import { Suspense, useRef, forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { Canvas as R3FCanvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../../store';
import { getModelById } from '../../data/devices';
import { useScreenTexture } from './useScreenTexture';
import { Phone3DModel } from './Phone3DModel';
import { Tablet3DModel } from './Tablet3DModel';
import { MacBook3DModel } from './MacBook3DModel';
import { Watch3DModel } from './Watch3DModel';

export interface Device3DViewerHandle {
  getGLElement: () => HTMLCanvasElement | null;
}

function RotatoHint() {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20, padding: '5px 14px',
      fontSize: 11, color: 'rgba(255,255,255,0.5)',
      pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
    }}>
      🖱 Drag to rotate · Scroll to zoom
    </div>
  );
}

function SceneCapturer(props: { onGlReady: (gl: THREE.WebGLRenderer) => void }) {
  const { gl } = useThree();
  props.onGlReady(gl);
  return null;
}

function DeviceScene({ floatEnabled }: { floatEnabled: boolean }) {
  const { state } = useApp();
  const def = getModelById(state.deviceModel);
  const screenTexture = useScreenTexture(state.screenshotUrl, state.videoUrl, state.contentType);
  const isLandscape = state.deviceLandscape;

  const inner = (() => {
    switch (state.deviceType) {
      case 'iphone':
      case 'android':
        return <Phone3DModel def={def} deviceColor={state.deviceColor} screenTexture={screenTexture} contentType={state.contentType} isLandscape={isLandscape} />;
      case 'ipad':
        return <Tablet3DModel def={def} screenTexture={screenTexture} contentType={state.contentType} isLandscape={isLandscape} />;
      case 'macbook':
        return <MacBook3DModel def={def} screenTexture={screenTexture} contentType={state.contentType} />;
      case 'watch':
        return <Watch3DModel def={def} screenTexture={screenTexture} contentType={state.contentType} />;
      case 'imac': {
        // Reuse MacBook model for iMac but with wider proportions
        return <MacBook3DModel def={def} screenTexture={screenTexture} contentType={state.contentType} lidAngle={90} />;
      }
      case 'browser':
        return (
          <group>
            <mesh castShadow>
              <boxGeometry args={[3.2, 0.05, 2.2]} />
              <meshStandardMaterial color="#1a1a1e" metalness={0.1} roughness={0.4} />
            </mesh>
          </group>
        );
      default:
        return <Phone3DModel def={def} deviceColor={state.deviceColor} screenTexture={screenTexture} contentType={state.contentType} isLandscape={isLandscape} />;
    }
  })();

  if (floatEnabled) {
    return (
      <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.18} floatingRange={[-0.06, 0.06]}>
        {inner}
      </Float>
    );
  }
  return <>{inner}</>;
}

interface Device3DViewerProps {
  style?: React.CSSProperties;
  className?: string;
}

export const Device3DViewer = forwardRef<Device3DViewerHandle, Device3DViewerProps>(
  function Device3DViewer({ style, className }, ref) {
    const { state } = useApp();
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const [hintVisible, setHintVisible] = useState(true);

    const handleGlReady = useCallback((gl: THREE.WebGLRenderer) => {
      glRef.current = gl;
    }, []);

    useImperativeHandle(ref, () => ({
      getGLElement: () => glRef.current?.domElement ?? null,
    }));

    // Lighting preset based on background
    const envPreset = 'studio' as const;

    // Initial camera position
    const camPos: [number, number, number] = state.deviceType === 'macbook' || state.deviceType === 'imac'
      ? [0, 0.5, 5]
      : [0, 0, 4.5];

    // Float animation (only when float animation is selected)
    const floatEnabled = state.animation === 'float';

    return (
      <div
        className={className}
        style={{ position: 'relative', width: '100%', height: '100%', ...style }}
        onPointerMove={() => setHintVisible(false)}
      >
        <R3FCanvas
          camera={{ position: camPos, fov: 32, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          shadows
          style={{ background: 'transparent' }}
        >
          <SceneCapturer onGlReady={handleGlReady} />

          {/* Lighting */}
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[3, 6, 4]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={20}
          />
          <directionalLight position={[-3, 2, -2]} intensity={0.4} />
          <pointLight position={[0, 3, 3]} intensity={0.6} color="#ffffff" />

          {/* Environment for reflections */}
          <Suspense fallback={null}>
            <Environment preset={envPreset} environmentIntensity={0.7} />
          </Suspense>

          {/* Contact shadow on ground */}
          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.55}
            scale={8}
            blur={2.5}
            far={4}
            color="#000000"
          />

          {/* Device */}
          <Suspense fallback={null}>
            <DeviceScene floatEnabled={floatEnabled} />
          </Suspense>

          {/* Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI * 0.82}
            dampingFactor={0.06}
            enableDamping={true}
            rotateSpeed={0.75}
            zoomSpeed={0.8}
            target={[0, 0, 0]}
          />
        </R3FCanvas>

        {hintVisible && <RotatoHint />}
      </div>
    );
  },
);
