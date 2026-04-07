import React, {
  Suspense, useRef, forwardRef, useImperativeHandle,
  useCallback, useState, useEffect,
} from 'react';
import { Canvas as R3FCanvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows, Float,
  useProgress, Html, useGLTF, RoundedBox,
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
useGLTF.preload('/models/oneplus12.glb');
useGLTF.preload('/models/ipadpro129.glb');
useGLTF.preload('/models/ipadmini6.glb');
useGLTF.preload('/models/applewatch.glb');

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

// ── Reactive exposure control ──────────────────────────────────────
// Updating gl.toneMappingExposure must happen inside the canvas context.
function ExposureControl({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

// ── Per-preset HDR environment intensity ───────────────────────────
// Higher values = more prominent reflections on metallic surfaces.
const ENV_INTENSITY: Record<string, number> = {
  studio:    3.0,
  warehouse: 3.5,
  city:      2.8,
  sunset:    3.2,
  forest:    2.5,
  night:     2.0,
};

// ── Per-environment light configs ─────────────────────────────────
const ENV_LIGHTS: Record<string, {
  ambient: number;
  keyColor: string; keyIntensity: number;
  fillColor: string; fillIntensity: number;
  rimColor: string;  rimIntensity: number;
  screenGlow: string;
}> = {
  studio: {
    ambient: 0.18,
    keyColor:  '#ffffff', keyIntensity:  2.2,
    fillColor: '#d0e8ff', fillIntensity: 0.55,
    rimColor:  '#ffffff', rimIntensity:  1.6,
    screenGlow: '#8090ff',
  },
  warehouse: {
    ambient: 0.22,
    keyColor:  '#ffe8c0', keyIntensity:  1.8,
    fillColor: '#c8d8ff', fillIntensity: 0.45,
    rimColor:  '#d0e0ff', rimIntensity:  1.2,
    screenGlow: '#6080ff',
  },
  city: {
    ambient: 0.14,
    keyColor:  '#c0d8ff', keyIntensity:  1.5,
    fillColor: '#ffd090', fillIntensity: 0.35,
    rimColor:  '#8090ff', rimIntensity:  1.4,
    screenGlow: '#4060ff',
  },
  sunset: {
    ambient: 0.12,
    keyColor:  '#ff9050', keyIntensity:  2.0,
    fillColor: '#ffd080', fillIntensity: 0.5,
    rimColor:  '#ff6030', rimIntensity:  1.8,
    screenGlow: '#ff8040',
  },
  forest: {
    ambient: 0.20,
    keyColor:  '#d0ffb0', keyIntensity:  1.4,
    fillColor: '#a0e8a0', fillIntensity: 0.35,
    rimColor:  '#c0ffc0', rimIntensity:  1.0,
    screenGlow: '#60c060',
  },
  night: {
    ambient: 0.05,
    keyColor:  '#2040a0', keyIntensity:  0.7,
    fillColor: '#101830', fillIntensity: 0.2,
    rimColor:  '#4060c0', rimIntensity:  0.8,
    screenGlow: '#4060ff',
  },
};

// ── Studio lights  (Rotato-style, env-aware) ──────────────────────
function StudioLights({ deviceType, envPreset }: { deviceType: string; envPreset: string }) {
  const isLaptop = deviceType === 'macbook';
  const cfg = ENV_LIGHTS[envPreset] ?? ENV_LIGHTS.studio;
  return (
    <>
      {/* Ambient — very soft base fill */}
      <ambientLight intensity={cfg.ambient} />

      {/* Key light — main front-left from above */}
      <directionalLight
        position={[3.5, 7, 5]}
        intensity={cfg.keyIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        color={cfg.keyColor}
      />

      {/* Fill light — right side, softer */}
      <directionalLight
        position={[-4, 2, 3]}
        intensity={cfg.fillIntensity}
        color={cfg.fillColor}
      />

      {/* Rim light — backlight creates the "glowing edge" like Rotato / Apple ads */}
      <directionalLight
        position={[-2, 4, -5]}
        intensity={isLaptop ? cfg.rimIntensity * 0.7 : cfg.rimIntensity}
        color={cfg.rimColor}
      />

      {/* Subtle warm fill from below */}
      <pointLight position={[0, -3, 2]} intensity={cfg.ambient * 0.8} color="#ffe0c0" />

      {/* Screen-forward glow — makes it look like the screen emits light */}
      <pointLight position={[0, 0, 3]} intensity={0.25} color={cfg.screenGlow} distance={6} decay={2} />
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
function DeviceScene({
  floatEnabled, pencilVisible, onShowPencil, onHidePencil,
}: {
  floatEnabled: boolean;
  pencilVisible: boolean;
  onShowPencil: () => void;
  onHidePencil: () => void;
}) {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const def = getModelById(state.deviceModel);
  const screenTexture = useScreenTexture(state.screenshotUrl, state.videoUrl, state.contentType);
  const isLandscape = state.deviceLandscape;
  const hasContent = !!(state.screenshotUrl || state.videoUrl);

  const applyFile = (file: File) => {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video/')) {
      updateState({ videoUrl: url, screenshotUrl: null, contentType: 'video' });
    } else {
      updateState({ screenshotUrl: url, videoUrl: null, contentType: 'image' });
    }
  };

  // Icon/plane position — screen center, slightly in front of device face
  const iconPos: [number, number, number] =
    state.deviceType === 'macbook' ? [0,  0.28, 0.20] :
    state.deviceType === 'browser' ? [0, -0.30, 0.08] :
    state.deviceType === 'watch'   ? [0,  0,    0.06] :
                                     [0,  0,    0.10];

  // Invisible click-plane dimensions (covers device screen area)
  const planeW =
    state.deviceType === 'macbook' ? 2.2 :
    state.deviceType === 'browser' ? 3.2 :
    state.deviceType === 'ipad'    ? 1.6 :
    state.deviceType === 'watch'   ? 0.7 : 0.85;
  const planeH =
    state.deviceType === 'macbook' ? 1.4 :
    state.deviceType === 'browser' ? 2.0 :
    state.deviceType === 'ipad'    ? 2.2 :
    state.deviceType === 'watch'   ? 0.9 : 1.65;

  // ── UI elements rendered into the Html portal ───────────────────
  const htmlIcon = (() => {
    // No content → always show "+" to invite upload
    if (!hasContent) {
      return (
        <div
          onClick={() => fileRef.current?.click()}
          title="Subir imagen o video"
          style={iconStyle('#fff', false)}
          onMouseEnter={e => applyHover(e, true)}
          onMouseLeave={e => applyHover(e, false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="9" y1="3" x2="9" y2="15" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="3" y1="9" x2="15" y2="9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
    // Has content + pencil visible → show pencil to replace
    if (pencilVisible) {
      return (
        <div
          onClick={() => fileRef.current?.click()}
          title="Reemplazar imagen o video"
          style={iconStyle('#fff', true)}
          onMouseEnter={e => applyHover(e, true)}
          onMouseLeave={e => applyHover(e, false)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5L11.5 2.5z"
              stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    // Has content, pencil hidden → nothing (clean view)
    return null;
  })();

  const iconStyle = (_color: string, isPencil: boolean): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: '50%',
    background: isPencil ? 'rgba(124,58,237,0.72)' : 'rgba(0,0,0,0.52)',
    border: `1.5px ${isPencil ? 'solid' : 'dashed'} rgba(255,255,255,${isPencil ? '0.5' : '0.35'})`,
    backdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', userSelect: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  });

  const applyHover = (e: React.MouseEvent, entering: boolean) => {
    const el = e.currentTarget as HTMLElement;
    el.style.background = entering ? 'rgba(124,58,237,0.85)' : (pencilVisible ? 'rgba(124,58,237,0.72)' : 'rgba(0,0,0,0.52)');
    el.style.borderColor = entering ? 'rgba(196,181,253,0.7)' : (pencilVisible ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)');
    el.style.borderStyle = entering || pencilVisible ? 'solid' : 'dashed';
  };

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
        return def.glbUrl ? (
          <GLBDeviceModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        ) : (
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
        return def.glbUrl ? (
          <GLBDeviceModel
            def={def}
            deviceColor={state.deviceColor}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        ) : (
          <Watch3DModel
            def={def}
            screenTexture={screenTexture}
            contentType={state.contentType}
          />
        );
      case 'browser':
        return (
          <BrowserFrame3D
            screenTexture={screenTexture}
            contentType={state.contentType}
            browserMode={def.id.includes('light') ? 'light' : 'dark'}
          />
        );
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

  // ── Invisible screen click-plane (shown only when hasContent) ───
  // Captures pointer events on the device screen area; clicking it
  // reveals the pencil icon. It is disabled when pencilVisible so
  // the Html overlay can receive its own click events.
  const clickPlane = hasContent && !pencilVisible ? (
    <mesh
      position={iconPos}
      onClick={e => { e.stopPropagation(); onShowPencil(); }}
    >
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  ) : null;

  // ── Html icon overlay (+ or pencil) ─────────────────────────────
  const overlay = htmlIcon ? (
    <Html
      center
      position={iconPos}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {htmlIcon}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { applyFile(f); onHidePencil(); }
            e.target.value = '';
          }}
        />
      </div>
    </Html>
  ) : (
    // Keep the hidden input even when icon is hidden so drag-n-drop still works
    <Html center position={iconPos} style={{ pointerEvents: 'none' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) { applyFile(f); onHidePencil(); }
          e.target.value = '';
        }}
      />
    </Html>
  );

  if (floatEnabled) {
    return (
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.16} floatingRange={[-0.06, 0.06]}>
        {inner}
        {clickPlane}
        {overlay}
      </Float>
    );
  }
  return <>{inner}{clickPlane}{overlay}</>;
}

// ── Browser: screen content mesh (texture updated every frame) ────
function BrowserScreenContent({
  w, h, screenTexture, contentType,
}: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const tex = screenTexture.current;
    if (tex && mat.map !== tex) {
      mat.map = tex;
      mat.color.set('#ffffff');
      mat.needsUpdate = true;
    } else if (!tex && mat.map) {
      mat.map = null;
      mat.color.set('#070b14');
      mat.needsUpdate = true;
    }
    if (contentType === 'video' && tex) tex.needsUpdate = true;
  });
  return (
    <mesh ref={ref} renderOrder={1}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#070b14" toneMapped={false} />
    </mesh>
  );
}

// ── Browser window — full 3D model with chrome UI + live screen ───
function BrowserFrame3D({
  screenTexture, contentType, browserMode,
}: {
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  browserMode: 'dark' | 'light';
}) {
  const isDark = browserMode !== 'light';

  // Colours
  const frameColor  = isDark ? '#1a1a1e' : '#ebebed';
  const barColor    = isDark ? '#2c2c2e' : '#e2e2e4';
  const tabColor    = isDark ? '#3a3a3c' : '#d0d0d2';
  const addrColor   = isDark ? '#424244' : '#c8c8ca';
  const iconColor   = isDark ? '#8e8e93' : '#7a7a80';
  const screenIdle  = isDark ? '#070b14' : '#ffffff';

  // World dimensions (W×H browser window)
  const W = 3.4,  H = 2.2,  D = 0.07;
  const barH  = 0.30;                       // chrome bar height
  const barY  = H / 2 - barH / 2;          // center of bar
  const contH = H - barH;                  // content area height
  const contY = barY - barH / 2 - contH / 2; // center of content

  // Tab strip occupies top 40% of bar, nav row the rest
  const tabH     = barH * 0.40;
  const tabY     = barY + (barH - tabH) / 2;   // top of bar zone
  const navH     = barH * 0.60;
  const navY     = barY - tabH / 2;            // nav zone center (negative offset)

  return (
    <group>
      {/* ── Frame body ─────────────────────────────────────────────── */}
      <RoundedBox args={[W, H, D]} radius={0.09} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={frameColor} metalness={0.18} roughness={0.16}
          envMapIntensity={2.5} clearcoat={0.6} clearcoatRoughness={0.08}
        />
      </RoundedBox>

      {/* ── Chrome bar background ────────────────────────────────── */}
      <mesh position={[0, barY, D / 2 + 0.0005]}>
        <planeGeometry args={[W - 0.004, barH]} />
        <meshBasicMaterial color={barColor} />
      </mesh>

      {/* ── Divider line between bar and content ─────────────────── */}
      <mesh position={[0, barY - barH / 2 + 0.002, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.004, 0.005]} />
        <meshBasicMaterial color={isDark ? '#000000' : '#b0b0b2'} />
      </mesh>

      {/* ── Tab strip ────────────────────────────────────────────── */}
      {/* Active tab */}
      <mesh position={[-W / 2 + 0.50, tabY, D / 2 + 0.002]}>
        <planeGeometry args={[0.80, tabH - 0.02]} />
        <meshBasicMaterial color={barColor} />
      </mesh>
      {/* Tab label dots (simulated text) */}
      {[0, 0.08, 0.16].map((ox) => (
        <mesh key={ox} position={[-W / 2 + 0.26 + ox, tabY, D / 2 + 0.004]}>
          <planeGeometry args={[0.06, 0.04]} />
          <meshBasicMaterial color={iconColor} />
        </mesh>
      ))}
      {/* Tab close × */}
      <mesh position={[-W / 2 + 0.84, tabY, D / 2 + 0.004]}>
        <circleGeometry args={[0.022, 16]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      {/* New-tab + button */}
      <mesh position={[-W / 2 + 0.98, tabY, D / 2 + 0.003]}>
        <planeGeometry args={[0.055, 0.055]} />
        <meshBasicMaterial color={tabColor} />
      </mesh>

      {/* ── Traffic lights ────────────────────────────────────────── */}
      {[
        { x: -W / 2 + 0.13, col: '#ff5f57' },  // close
        { x: -W / 2 + 0.21, col: '#febc2e' },  // minimize
        { x: -W / 2 + 0.29, col: '#28c840' },  // maximise
      ].map(({ x, col }) => (
        <mesh key={x} position={[x, navY, D / 2 + 0.003]}>
          <circleGeometry args={[0.026, 32]} />
          <meshBasicMaterial color={col} />
        </mesh>
      ))}

      {/* ── Back / Forward arrows ─────────────────────────────────── */}
      <mesh position={[-W / 2 + 0.43, navY, D / 2 + 0.003]}>
        <planeGeometry args={[0.042, 0.042]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      <mesh position={[-W / 2 + 0.51, navY, D / 2 + 0.003]}>
        <planeGeometry args={[0.042, 0.042]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>

      {/* ── Address bar pill ─────────────────────────────────────── */}
      <mesh position={[0.08, navY, D / 2 + 0.003]}>
        <planeGeometry args={[W * 0.62, navH * 0.52]} />
        <meshBasicMaterial color={addrColor} />
      </mesh>
      {/* Lock icon in address bar */}
      <mesh position={[-W * 0.31 + 0.12, navY, D / 2 + 0.005]}>
        <circleGeometry args={[0.016, 16]} />
        <meshBasicMaterial color={iconColor} />
      </mesh>
      {/* URL dots */}
      {[-0.04, 0.04, 0.12, 0.20, 0.28, 0.36].map((ox) => (
        <mesh key={ox} position={[-W * 0.31 + 0.22 + ox, navY, D / 2 + 0.005]}>
          <planeGeometry args={[0.06, 0.028]} />
          <meshBasicMaterial color={isDark ? '#636368' : '#909096'} />
        </mesh>
      ))}

      {/* ── Bookmarks bar (thin strip just above content) ─────────── */}
      <mesh position={[0, barY - barH / 2 + 0.011, D / 2 + 0.001]}>
        <planeGeometry args={[W - 0.004, 0.022]} />
        <meshBasicMaterial color={isDark ? '#252527' : '#e8e8ea'} />
      </mesh>

      {/* ── Content screen ───────────────────────────────────────── */}
      <group position={[0, contY, D / 2 + 0.0008]}>
        {/* Background fill (idle colour) */}
        <mesh>
          <planeGeometry args={[W - 0.004, contH - 0.001]} />
          <meshBasicMaterial color={screenIdle} />
        </mesh>
        {/* Live image / video */}
        <BrowserScreenContent
          w={W - 0.004} h={contH - 0.001}
          screenTexture={screenTexture}
          contentType={contentType}
        />
      </group>
    </group>
  );
}

// ── Camera angle presets ──────────────────────────────────────────
const CAMERA_PRESETS: Record<string, { phi: number; theta: number }> = {
  hero:  { phi: Math.PI / 2 - 0.12, theta:  0.28 },
  front: { phi: Math.PI / 2,         theta:  0    },
  side:  { phi: Math.PI / 2,         theta:  Math.PI / 2 },
  top:   { phi: 0.18,                theta:  0    },
};

// ── OrbitControls ────────────────────────────────────────────────
function HeroOrbitControls({
  deviceType, autoRotate, autoRotateSpeed, cameraAngle, cameraResetKey,
}: {
  deviceType: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  cameraAngle: string;
  cameraResetKey: number;
}) {
  const isLaptop = deviceType === 'macbook';
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const isFirstMount = useRef(true);
  const prevDeviceType = useRef(deviceType);

  const applyPreset = useCallback((angle: string, laptop: boolean) => {
    const raf = requestAnimationFrame(() => {
      const controls = controlsRef.current;
      if (!controls) return;
      const preset = CAMERA_PRESETS[angle] ?? CAMERA_PRESETS.hero;
      const dist = laptop ? 6.2 : 5.6;
      const { phi, theta } = preset;
      camera.position.set(
        dist * Math.sin(phi) * Math.sin(theta),
        dist * Math.cos(phi),
        dist * Math.sin(phi) * Math.cos(theta),
      );
      controls.target.set(0, 0, 0);
      controls.update();
    });
    return raf;
  }, [camera]);

  // Camera preset button pressed — skip on first mount (canvas camera prop handles initial position)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const raf = applyPreset(cameraAngle, isLaptop);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraResetKey]);

  // Device type changed → snap back to hero so the new model is centered
  useEffect(() => {
    if (prevDeviceType.current === deviceType) return;
    prevDeviceType.current = deviceType;
    const raf = applyPreset('hero', deviceType === 'macbook');
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceType]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={isLaptop ? 3 : 2.2}
      maxDistance={isLaptop ? 18 : 15}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.92}
      dampingFactor={0.05}
      enableDamping={true}
      rotateSpeed={0.7}
      zoomSpeed={0.75}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
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
    const { state, updateState } = useApp();
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const [hintVisible, setHintVisible] = useState(true);
    const [dragOver, setDragOver] = useState(false);
    const [pencilVisible, setPencilVisible] = useState(false);

    const handleGlReady = useCallback((gl: THREE.WebGLRenderer) => {
      glRef.current = gl;
    }, []);

    useImperativeHandle(ref, () => ({
      getGLElement: () => glRef.current?.domElement ?? null,
    }));

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        updateState({ videoUrl: url, screenshotUrl: null, contentType: 'video' });
      } else {
        updateState({ screenshotUrl: url, videoUrl: null, contentType: 'image' });
      }
    }, [updateState]);

    const isLaptop = state.deviceType === 'macbook';
    const hasContent = !!(state.screenshotUrl || state.videoUrl);
    const floatEnabled = state.animation === 'float';

    // Hide pencil whenever the device model or content changes
    useEffect(() => { setPencilVisible(false); }, [state.deviceModel, state.deviceType]);
    useEffect(() => { if (!hasContent) setPencilVisible(false); }, [hasContent]);

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
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
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
          onPointerMissed={() => setPencilVisible(false)}
        >
          <SceneCapturer onGlReady={handleGlReady} />

          {/* Reactively update renderer exposure from store */}
          <ExposureControl exposure={state.lightExposure} />

          {/* Studio lighting rig — adapts colours to the active env preset */}
          <StudioLights deviceType={state.deviceType} envPreset={state.envPreset} />

          {/* High-quality HDR environment map for photorealistic reflections.
              key={envPreset} forces a full remount so the new HDR actually loads.
              environmentIntensity drives how strongly the IBL affects materials. */}
          {state.envEnabled !== false && (
            <Suspense key={state.envPreset} fallback={null}>
              <Environment
                preset={state.envPreset as 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night'}
                environmentIntensity={ENV_INTENSITY[state.envPreset] ?? 2.8}
                background={false}
              />
            </Suspense>
          )}

          {/* Soft contact shadow on ground plane */}
          <ContactShadows
            position={[0, isLaptop ? -0.8 : -2.0, 0]}
            opacity={state.contactShadowOpacity / 100}
            scale={isLaptop ? 10 : 6}
            blur={isLaptop ? 3.5 : 2.2}
            far={isLaptop ? 3 : 4}
            color="#000000"
            resolution={512}
          />

          {/* Device geometry */}
          <Suspense fallback={<Loader />}>
            <DeviceScene
              floatEnabled={floatEnabled}
              pencilVisible={pencilVisible}
              onShowPencil={() => setPencilVisible(true)}
              onHidePencil={() => setPencilVisible(false)}
            />
          </Suspense>

          {/* Post-processing: bloom + SMAA */}
          <PostFX hasContent={hasContent} />

          {/* Controls with Rotato hero angle */}
          <HeroOrbitControls
            deviceType={state.deviceType}
            autoRotate={state.autoRotate}
            autoRotateSpeed={state.autoRotateSpeed}
            cameraAngle={state.cameraAngle}
            cameraResetKey={state.cameraResetKey}
          />
        </R3FCanvas>

        <RotatoHint visible={hintVisible} />

        {/* ── Drag-and-drop visual feedback ────────────────────────── */}
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
            border: '2px solid rgba(124,58,237,0.7)',
            borderRadius: 8,
            background: 'rgba(124,58,237,0.08)',
            boxShadow: 'inset 0 0 40px rgba(124,58,237,0.12)',
          }} />
        )}
      </div>
    );
  },
);
