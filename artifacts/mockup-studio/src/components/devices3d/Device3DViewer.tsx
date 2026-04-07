import {
  Suspense, useRef, forwardRef, useImperativeHandle,
  useCallback, useState,
} from 'react';
import { Canvas as R3FCanvas, useThree } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows, Float,
  useProgress, Html, useGLTF,
} from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useApp } from '../../store';
import { getModelById } from '../../data/devices';
import { useScreenTexture } from './useScreenTexture';
import { Phone3DModel } from './Phone3DModel';
import { GLBDeviceModel } from './GLBDeviceModel';
import { Tablet3DModel } from './Tablet3DModel';
import { MacBook3DModel } from './MacBook3DModel';
import { Watch3DModel } from './Watch3DModel';

// Preload all GLB models so they're ready before user selects them
useGLTF.preload('/models/iphone17pro.glb');
useGLTF.preload('/models/iphone16.glb');
useGLTF.preload('/models/macbookpro.glb');
useGLTF.preload('/models/samsungs25ultra.glb');
useGLTF.preload('/models/samsungs21ultra.glb');
useGLTF.preload('/models/iphonex.glb');

export interface Device3DViewerHandle {
  getGLElement: () => HTMLCanvasElement | null;
}

// ── Loading indicator ─────────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  if (progress >= 100) return null;
  return (
    <Html center>
      <div style={{
        color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'system-ui',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 120, height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 1,
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'rgba(255,255,255,0.5)', borderRadius: 1,
            transition: 'width 0.3s',
          }} />
        </div>
        Loading
      </div>
    </Html>
  );
}

// ── Hint overlay ─────────────────────────────────────────────────
function RotatoHint({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20, padding: '5px 14px',
      fontSize: 11, color: 'rgba(255,255,255,0.45)',
      pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 5,
      opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease',
    }}>
      ⌖ Drag to rotate · Scroll to zoom
    </div>
  );
}

// ── GL capture helper ─────────────────────────────────────────────
function SceneCapturer({ onGlReady }: { onGlReady: (gl: THREE.WebGLRenderer) => void }) {
  const { gl } = useThree();
  onGlReady(gl);
  return null;
}

// ── Studio lights  (Rotato-style) ─────────────────────────────────
function StudioLights({ deviceType }: { deviceType: string }) {
  const isLaptop = deviceType === 'macbook';
  return (
    <>
      {/* Ambient — very soft base fill */}
      <ambientLight intensity={0.18} />

      {/* Key light — main front-left from above */}
      <directionalLight
        position={[3.5, 7, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        color="#ffffff"
      />

      {/* Fill light — right side, softer, slightly warm */}
      <directionalLight
        position={[-4, 2, 3]}
        intensity={0.55}
        color="#d0e8ff"
      />

      {/* Rim light — strong backlight from top-right behind device */}
      {/* This creates the signature "glowing edge" like in Rotato/Apple ads */}
      <directionalLight
        position={[-2, 4, -5]}
        intensity={isLaptop ? 1.1 : 1.8}
        color="#ffffff"
      />

      {/* Subtle warm fill from below */}
      <pointLight position={[0, -3, 2]} intensity={0.15} color="#ffe0c0" />

      {/* Screen-forward glow — makes it look like the screen emits light */}
      <pointLight position={[0, 0, 3]} intensity={0.25} color="#8090ff" distance={6} decay={2} />
    </>
  );
}

// ── Post-processing (bloom for screen) ───────────────────────────
function PostFX({ hasContent }: { hasContent: boolean }) {
  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        luminanceThreshold={0.85}
        luminanceSmoothing={0.5}
        intensity={hasContent ? 0.4 : 0.2}
        mipmapBlur
      />
    </EffectComposer>
  );
}

// ── Device scene (all geometry) ───────────────────────────────────
function DeviceScene({ floatEnabled }: { floatEnabled: boolean }) {
  const { state } = useApp();
  const def = getModelById(state.deviceModel);
  const screenTexture = useScreenTexture(state.screenshotUrl, state.videoUrl, state.contentType);
  const isLandscape = state.deviceLandscape;

  const inner = (() => {
    // Real GLB model — any device that has a glbUrl defined
    if (def.glbUrl) {
      return (
        <GLBDeviceModel
          def={def}
          deviceColor={state.deviceColor}
          screenTexture={screenTexture}
          contentType={state.contentType}
          isLandscape={isLandscape}
        />
      );
    }

    switch (state.deviceType) {
      case 'iphone':
        return def.glbUrl ? (
          <GLBDeviceModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        ) : (
          <Phone3DModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
      case 'android':
        return def.glbUrl ? (
          <GLBDeviceModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        ) : (
          <Phone3DModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
      case 'ipad':
        return (
          <Tablet3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
      case 'macbook':
        return def.glbUrl ? (
          <GLBDeviceModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        ) : (
          <MacBook3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        );
      case 'watch':
        return (
          <Watch3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        );
      case 'browser':
        return <BrowserFrame />;
      default:
        return (
          <Phone3DModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
            isLandscape={isLandscape}
          />
        );
    }
  })();

  if (floatEnabled) {
    return (
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.16} floatingRange={[-0.06, 0.06]}>
        {inner}
      </Float>
    );
  }
  return <>{inner}</>;
}

// ── Browser window placeholder ────────────────────────────────────
function BrowserFrame() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[3.4, 0.06, 2.2]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.15} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── OrbitControls (simple) ────────────────────────────────────────
function HeroOrbitControls({ deviceType }: { deviceType: string }) {
  const isLaptop = deviceType === 'macbook';
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={isLaptop ? 3 : 2.2}
      maxDistance={isLaptop ? 9 : 7.5}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.92}
      dampingFactor={0.05}
      enableDamping={true}
      rotateSpeed={0.7}
      zoomSpeed={0.75}
      target={[0, 0, 0]}
    />
  );
}

// ── Main component ────────────────────────────────────────────────
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

    const isLaptop = state.deviceType === 'macbook';
    const hasContent = !!(state.screenshotUrl || state.videoUrl);
    const floatEnabled = state.animation === 'float';

    // Telephoto camera — narrow FOV like Rotato (feels more "product photo")
    // Camera positioned at hero angle: slightly right+up from center, looking left-down at device
    const fov = isLaptop ? 24 : 20;
    const camX = isLaptop ? 1.2 : 1.6;   // Rightward → device appears from left (shows volume buttons)
    const camY = isLaptop ? 0.5 : 0.4;   // Slightly above
    const camZ = isLaptop ? 6.2 : 5.6;   // Depth

    return (
      <div
        className={className}
        style={{ position: 'relative', width: '100%', height: '100%', ...style }}
        onPointerMove={() => setHintVisible(false)}
      >
        <R3FCanvas
          camera={{ position: [camX, camY, camZ], fov, near: 0.1, far: 100 }}
          gl={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          shadows="soft"
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <SceneCapturer onGlReady={handleGlReady} />

          {/* Studio lighting rig */}
          <StudioLights deviceType={state.deviceType} />

          {/* High-quality environment map for reflections */}
          <Suspense fallback={null}>
            <Environment
              preset="studio"
              environmentIntensity={1.1}
              backgroundBlurriness={0}
            />
          </Suspense>

          {/* Soft contact shadow on ground plane */}
          <ContactShadows
            position={[0, isLaptop ? -0.8 : -2.0, 0]}
            opacity={0.65}
            scale={isLaptop ? 10 : 6}
            blur={isLaptop ? 3.5 : 2.2}
            far={isLaptop ? 3 : 4}
            color="#000000"
            resolution={512}
          />

          {/* Device geometry */}
          <Suspense fallback={<Loader />}>
            <DeviceScene floatEnabled={floatEnabled} />
          </Suspense>

          {/* Post-processing: bloom + SMAA */}
          <PostFX hasContent={hasContent} />

          {/* Controls with Rotato hero angle */}
          <HeroOrbitControls deviceType={state.deviceType} />
        </R3FCanvas>

        <RotatoHint visible={hintVisible} />
      </div>
    );
  },
);
