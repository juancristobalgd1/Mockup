import React, {
  Suspense, useRef, forwardRef, useImperativeHandle,
  useCallback, useState, useEffect, useMemo,
} from 'react';
import { Canvas as R3FCanvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows, Float,
  useProgress, Html, useGLTF, RoundedBox,
} from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useApp } from '../../store';
import type { CameraKeyframe } from '../../store';
import { getModelById } from '../../data/devices';
import { useScreenTexture } from './useScreenTexture';
import { getGlobalScreenTexture } from './textureGlobal';
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
  getCameraState: () => { position: [number, number, number]; target: [number, number, number] } | null;
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
// Kept in the 1.0–1.6 range: enough for realistic reflections without
// compounding with the direct lights to create overexposure.
const ENV_INTENSITY: Record<string, number> = {
  studio:    1.4,
  warehouse: 1.6,
  city:      1.3,
  sunset:    1.5,
  forest:    1.2,
  night:     0.9,
};

// ── Per-environment light configs ─────────────────────────────────
// Reference: a real studio uses one key at ~1.0, fill at ~0.3, rim at ~0.5.
// Ambient is raised slightly so dark-side surfaces stay readable.
const ENV_LIGHTS: Record<string, {
  ambient: number;
  keyColor: string; keyIntensity: number;
  fillColor: string; fillIntensity: number;
  rimColor: string;  rimIntensity: number;
  screenGlow: string;
}> = {
  studio: {
    ambient: 0.30,
    keyColor:  '#ffffff', keyIntensity:  1.05,
    fillColor: '#d0e8ff', fillIntensity: 0.28,
    rimColor:  '#e8eeff', rimIntensity:  0.65,
    screenGlow: '#8090ff',
  },
  warehouse: {
    ambient: 0.32,
    keyColor:  '#ffe8c0', keyIntensity:  0.95,
    fillColor: '#c8d8ff', fillIntensity: 0.24,
    rimColor:  '#d0e0ff', rimIntensity:  0.55,
    screenGlow: '#6080ff',
  },
  city: {
    ambient: 0.26,
    keyColor:  '#c0d8ff', keyIntensity:  0.80,
    fillColor: '#ffd090', fillIntensity: 0.20,
    rimColor:  '#8090ff', rimIntensity:  0.60,
    screenGlow: '#4060ff',
  },
  sunset: {
    ambient: 0.24,
    keyColor:  '#ff9050', keyIntensity:  1.00,
    fillColor: '#ffd080', fillIntensity: 0.26,
    rimColor:  '#ff7040', rimIntensity:  0.65,
    screenGlow: '#ff8040',
  },
  forest: {
    ambient: 0.30,
    keyColor:  '#d0ffb0', keyIntensity:  0.80,
    fillColor: '#a0e8a0', fillIntensity: 0.20,
    rimColor:  '#c0ffc0', rimIntensity:  0.45,
    screenGlow: '#60c060',
  },
  night: {
    ambient: 0.14,
    keyColor:  '#2040a0', keyIntensity:  0.40,
    fillColor: '#101830', fillIntensity: 0.12,
    rimColor:  '#4060c0', rimIntensity:  0.38,
    screenGlow: '#4060ff',
  },
};

// ── Warmth color shift ────────────────────────────────────────────
// Blends a base hex color toward warm orange (+) or cool blue (-).
// warmth: -50 = max cool, 0 = neutral, +50 = max warm.
function warmColor(hex: string, warmth: number): string {
  const c = new THREE.Color(hex);
  const t = warmth / 50; // -1 … +1
  c.r = Math.min(1, Math.max(0, c.r + t * 0.30));
  c.g = Math.min(1, Math.max(0, c.g + t * 0.04));
  c.b = Math.min(1, Math.max(0, c.b - t * 0.38));
  return `#${c.getHexString()}`;
}

// ── Studio lights  (Rotato-style, env-aware) ──────────────────────
function StudioLights({
  deviceType, envPreset, brightness, ambient, warmth,
}: {
  deviceType: string; envPreset: string;
  brightness: number; ambient: number; warmth: number;
}) {
  const isLaptop = deviceType === 'macbook';
  const cfg = ENV_LIGHTS[envPreset] ?? ENV_LIGHTS.studio;

  // brightness 0-100 → multiplier (50 = 1.0×, 0 = 0×, 100 = 2.0×)
  const bMul = brightness / 50;
  // ambient 0-100 → intensity
  const ambVal = cfg.ambient * (ambient / 50);

  return (
    <>
      {/* Ambient — fills shadows, scaled by Ambiente slider */}
      <ambientLight intensity={ambVal} />

      {/* Key light — main front-left, scaled by Brillo, tinted by Temperatura */}
      <directionalLight
        position={[3.5, 7, 5]}
        intensity={cfg.keyIntensity * bMul}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={6}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0005}
        color={warmColor(cfg.keyColor, warmth)}
      />

      {/* Fill light — softer, also tinted by temperature */}
      <directionalLight
        position={[-4, 2, 3]}
        intensity={cfg.fillIntensity * bMul}
        color={warmColor(cfg.fillColor, warmth * 0.5)}
      />

      {/* Rim light — edge highlight, subtle warmth */}
      <directionalLight
        position={[-2, 4, -5]}
        intensity={(isLaptop ? cfg.rimIntensity * 0.7 : cfg.rimIntensity) * bMul}
        color={warmColor(cfg.rimColor, warmth * 0.3)}
      />

      {/* Subtle under-fill — stays neutral */}
      <pointLight position={[0, -3, 2]} intensity={ambVal * 0.8} color="#ffe0c0" />

      {/* Screen glow — always on, independent of brightness */}
      <pointLight position={[0, 0, 3]} intensity={0.18} color={cfg.screenGlow} distance={6} decay={2} />
    </>
  );
}

// ── Post-processing (bloom for screen) ───────────────────────────
function PostFX({ hasContent }: { hasContent: boolean }) {
  return (
    <EffectComposer multisampling={4}>
      <SMAA />
      <Bloom
        luminanceThreshold={0.94}
        luminanceSmoothing={0.4}
        intensity={hasContent ? 0.22 : 0.08}
        mipmapBlur
      />
    </EffectComposer>
  );
}

// ── Device scene (all geometry) ───────────────────────────────────
function DeviceScene({
  floatEnabled, pencilVisible, onShowPencil, onHidePencil,
  screenTexture,
}: {
  floatEnabled: boolean;
  pencilVisible: boolean;
  onShowPencil: () => void;
  onHidePencil: () => void;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
}) {
  const { state, updateState } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const def = getModelById(state.deviceModel);
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

  // ── Face-detection + icon scaling ───────────────────────────────────
  // useFrame runs every frame to:
  //   1. Hide the icon when the camera is looking at the back face
  //   2. Scale the icon proportionally to the device's apparent screen size,
  //      so it stays in visual proportion as the user zooms in/out.
  //
  // Scaling strategy: project two world-space points that are 1 unit apart
  // at the device's current world position. The pixel distance between their
  // 2D projections tells us how many pixels per world unit at the current
  // zoom level. We use that to derive the icon diameter and apply it via
  // CSS transform: scale() — imperatively, with no React re-renders.
  const faceGroupRef = useRef<THREE.Group>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const _wn   = useRef(new THREE.Vector3());
  const _wp   = useRef(new THREE.Vector3());
  const _tc   = useRef(new THREE.Vector3());
  const _q    = useRef(new THREE.Quaternion());
  const _pjA  = useRef(new THREE.Vector3());
  const _pjB  = useRef(new THREE.Vector3());

  useFrame(({ camera, gl }) => {
    if (!faceGroupRef.current || !wrapperRef.current) return;
    faceGroupRef.current.getWorldQuaternion(_q.current);
    faceGroupRef.current.getWorldPosition(_wp.current);
    _wn.current.set(0, 0, 1).applyQuaternion(_q.current);
    _tc.current.copy(camera.position).sub(_wp.current).normalize();
    const isFront = _wn.current.dot(_tc.current) > 0.05;
    wrapperRef.current.style.display = isFront ? '' : 'none';

    // Scale icon to match the device's zoom level
    _pjA.current.copy(_wp.current).project(camera);
    _pjB.current.set(_wp.current.x + 1, _wp.current.y, _wp.current.z).project(camera);
    const pxPerUnit = Math.abs(_pjB.current.x - _pjA.current.x) *
      (gl.domElement.clientWidth / 2);
    // planeW ≈ 0.85 world units for phones; icon target ≈ 15% of that
    // base CSS size is 16px → compute scale factor
    const targetPx = Math.max(14, Math.min(56, pxPerUnit * 0.15));
    const scale = targetPx / 16;
    wrapperRef.current.style.transform = `scale(${scale.toFixed(3)})`;
  });

  // ── Show icon? ───────────────────────────────────────────────────
  const showIcon = !hasContent || pencilVisible;

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

  // ── Html icon overlay ────────────────────────────────────────────
  // - The group at iconPos gives useFrame the correct world orientation
  //   to detect front vs back facing.
  // - Html (no transform) tracks the 3D point in screen space and
  //   renders at the correct 2D position — reliable DOM events.
  // - ONLY the small icon div has pointer-events:auto so OrbitControls
  //   is never blocked outside the tiny icon area.
  // - Direct DOM onClick on the icon → file picker ALWAYS opens
  //   (browser treats DOM click as a trusted user gesture).
  const overlay = (
    <group ref={faceGroupRef} position={iconPos}>
      <Html
        center
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none' }}
      >
        {/* wrapperRef toggled by useFrame face-detection (no re-renders) */}
        <div ref={wrapperRef} style={{ pointerEvents: 'none' }}>
          {showIcon && (
            <div
              onClick={() => fileRef.current?.click()}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'rgba(124,58,237,0.85)';
                el.style.borderColor = 'rgba(196,181,253,0.7)';
                el.style.borderStyle = 'solid';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'rgba(0,0,0,0.55)';
                el.style.borderColor = 'rgba(255,255,255,0.40)';
                el.style.borderStyle = 'dashed';
              }}
              style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)',
                border: '1px dashed rgba(255,255,255,0.40)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', userSelect: 'none',
                pointerEvents: 'auto',
                transition: 'background 0.12s, border-color 0.12s, border-style 0.12s',
              }}
            >
              {pencilVisible ? (
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                  <path d="M11.5 2.5l2 2L5 13l-2.5.5.5-2.5L11.5 2.5z"
                    stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 18 18" fill="none">
                  <line x1="9" y1="3" x2="9" y2="15" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="3" y1="9" x2="15" y2="9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          )}
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
    </group>
  );

  // Large transparent mesh: clicking anywhere on screen reveals pencil
  // (only when content is loaded and pencil not yet shown)
  const screenClickMesh = (hasContent && !pencilVisible) ? (
    <mesh
      position={iconPos}
      onClick={e => { e.stopPropagation(); onShowPencil(); }}
    >
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.FrontSide} />
    </mesh>
  ) : null;

  if (floatEnabled) {
    return (
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.16} floatingRange={[-0.06, 0.06]}>
        {inner}
        {screenClickMesh}
        {overlay}
      </Float>
    );
  }
  return (
    <>
      {inner}
      {screenClickMesh}
      {overlay}
    </>
  );
}

// ── Browser: screen content mesh (texture updated every frame) ────
function BrowserScreenContent({
  w, h, screenTexture, contentType,
}: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#070b14', toneMapped: false }), []);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  const ctRef = useRef(contentType);
  ctRef.current = contentType;
  useFrame(() => {
    const tex = getGlobalScreenTexture();
    if (tex) {
      const needMap   = mat.map !== tex;
      const needColor = mat.color.r < 0.99;
      if (needMap || needColor) {
        if (needMap)   mat.map = tex;
        if (needColor) mat.color.set('#ffffff');
        mat.needsUpdate = true;
      }
      if (ctRef.current === 'video') tex.needsUpdate = true;
    } else if (mat.map || mat.color.r > 0.04) {
      mat.map = null;
      mat.color.set('#070b14');
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh material={mat} renderOrder={1}>
      <planeGeometry args={[w, h]} />
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
          envMapIntensity={1.2} clearcoat={0.6} clearcoatRoughness={0.08}
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

// ── Interpolate between camera keyframes ──────────────────────────
function interpolateKeyframes(
  keyframes: CameraKeyframe[],
  t: number,
): { position: THREE.Vector3; target: THREE.Vector3 } | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) {
    return {
      position: new THREE.Vector3(...keyframes[0].position),
      target: new THREE.Vector3(...keyframes[0].target),
    };
  }
  if (t <= keyframes[0].time) {
    return {
      position: new THREE.Vector3(...keyframes[0].position),
      target: new THREE.Vector3(...keyframes[0].target),
    };
  }
  if (t >= keyframes[keyframes.length - 1].time) {
    const last = keyframes[keyframes.length - 1];
    return {
      position: new THREE.Vector3(...last.position),
      target: new THREE.Vector3(...last.target),
    };
  }
  let a = keyframes[0], b = keyframes[1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      a = keyframes[i];
      b = keyframes[i + 1];
      break;
    }
  }
  const span = b.time - a.time;
  const alpha = span > 0 ? (t - a.time) / span : 0;
  const smooth = alpha * alpha * (3 - 2 * alpha); // smoothstep
  const position = new THREE.Vector3(...a.position).lerp(new THREE.Vector3(...b.position), smooth);
  const target = new THREE.Vector3(...a.target).lerp(new THREE.Vector3(...b.target), smooth);
  return { position, target };
}

// ── OrbitControls ────────────────────────────────────────────────
function HeroOrbitControls({
  deviceType, autoRotate, autoRotateSpeed, cameraAngle, cameraResetKey,
  moviePlaying, movieTimeRef, movieKeyframes, cameraStateRef,
}: {
  deviceType: string;
  autoRotate: boolean;
  autoRotateSpeed: number;
  cameraAngle: string;
  cameraResetKey: number;
  moviePlaying: boolean;
  movieTimeRef: React.MutableRefObject<number>;
  movieKeyframes: CameraKeyframe[];
  cameraStateRef: React.MutableRefObject<{ position: [number, number, number]; target: [number, number, number] } | null>;
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

  // Every frame: export camera state and (if playing) drive camera via keyframes
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Always export current camera state for keyframe capture
    cameraStateRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z],
    };

    // Drive camera during movie playback
    if (moviePlaying && movieKeyframes.length >= 2) {
      const result = interpolateKeyframes(movieKeyframes, movieTimeRef.current);
      if (result) {
        camera.position.copy(result.position);
        controls.target.copy(result.target);
        controls.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={!moviePlaying}
      enableRotate={!moviePlaying}
      minDistance={isLaptop ? 3 : 2.2}
      maxDistance={isLaptop ? 18 : 15}
      minPolarAngle={Math.PI * 0.05}
      maxPolarAngle={Math.PI * 0.92}
      dampingFactor={0.05}
      enableDamping={!moviePlaying}
      rotateSpeed={0.7}
      zoomSpeed={0.75}
      autoRotate={autoRotate && !moviePlaying}
      autoRotateSpeed={autoRotateSpeed}
      target={[0, 0, 0]}
    />
  );
}

// ── Main component ────────────────────────────────────────────────
interface Device3DViewerProps {
  style?: React.CSSProperties;
  className?: string;
  moviePlaying?: boolean;
  movieTimeRef?: React.MutableRefObject<number>;
}

export const Device3DViewer = forwardRef<Device3DViewerHandle, Device3DViewerProps>(
  function Device3DViewer({ style, className, moviePlaying = false, movieTimeRef: externalMovieTimeRef }, ref) {
    const { state, updateState } = useApp();
    const glRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraStateRef = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
    const internalMovieTimeRef = useRef(0);
    const movieTimeRef = externalMovieTimeRef ?? internalMovieTimeRef;
    const [hintVisible, setHintVisible] = useState(true);
    const [dragOver, setDragOver] = useState(false);
    const [pencilVisible, setPencilVisible] = useState(false);

    // ── Texture lives HERE — outside the Canvas so it never gets
    // disposed/reloaded when DeviceScene suspends or remounts. ──────
    const screenTexture = useScreenTexture(
      state.screenshotUrl, state.videoUrl, state.contentType,
    );

    const handleGlReady = useCallback((gl: THREE.WebGLRenderer) => {
      glRef.current = gl;
    }, []);

    useImperativeHandle(ref, () => ({
      getGLElement: () => glRef.current?.domElement ?? null,
      getCameraState: () => cameraStateRef.current,
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

          {/* Studio lighting rig — adapts to env preset, brightness, ambient, warmth */}
          <StudioLights
            deviceType={state.deviceType}
            envPreset={state.envPreset}
            brightness={state.lightBrightness ?? 40}
            ambient={state.lightAmbient ?? 45}
            warmth={state.lightWarmth ?? 0}
          />

          {/* High-quality HDR environment map for photorealistic reflections.
              key={envPreset} forces a full remount so the new HDR actually loads.
              environmentIntensity driven by lightIBL slider (0-100 → 0-2×base). */}
          {state.envEnabled !== false && (
            <Suspense key={state.envPreset} fallback={null}>
              <Environment
                preset={state.envPreset as 'studio' | 'warehouse' | 'sunset' | 'city' | 'forest' | 'night'}
                environmentIntensity={(ENV_INTENSITY[state.envPreset] ?? 1.4) * ((state.lightIBL ?? 40) / 50)}
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
              screenTexture={screenTexture}
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
            moviePlaying={moviePlaying}
            movieTimeRef={movieTimeRef}
            movieKeyframes={state.cameraKeyframes}
            cameraStateRef={cameraStateRef}
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
