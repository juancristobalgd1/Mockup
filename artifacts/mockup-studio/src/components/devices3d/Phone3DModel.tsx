import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

// ── Material helpers ────────────────────────────────────────────────

const BODY_COLORS: Record<string, { body: string; metalness: number; roughness: number }> = {
  titanium: { body: '#2d2d2d', metalness: 0.88, roughness: 0.10 },
  black:    { body: '#0d0d0d', metalness: 0.70, roughness: 0.18 },
  white:    { body: '#d8d8d8', metalness: 0.52, roughness: 0.22 },
  blue:     { body: '#1a2a5e', metalness: 0.78, roughness: 0.14 },
};

const ANDROID_FRAME: Record<string, { body: string; metalness: number; roughness: number }> = {
  titanium: { body: '#252525', metalness: 0.88, roughness: 0.10 },
  aluminum: { body: '#1e1e1e', metalness: 0.75, roughness: 0.18 },
  glass:    { body: '#181818', metalness: 0.60, roughness: 0.08 },
};

// ── Screen plane that updates texture each frame ─────────────────

function ScreenPlane({
  w, h, screenTexture, contentType,
}: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    const tex = screenTexture.current;
    if (tex && mat.map !== tex) { mat.map = tex; mat.needsUpdate = true; }
    else if (!tex && mat.map) { mat.map = null; mat.needsUpdate = true; }
    if (contentType === 'video' && tex) tex.needsUpdate = true;
  });
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#050510" toneMapped={false} />
    </mesh>
  );
}

// ── Camera lens element (reusable) ──────────────────────────────

function CameraLens({ r = 0.038, x = 0, y = 0, z = 0 }: { r?: number; x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[r, r * 0.22, 16, 32]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Lens glass */}
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[r * 0.78, 32]} />
        <meshStandardMaterial color="#0d0f1a" roughness={0.05} metalness={0.4} envMapIntensity={2} />
      </mesh>
      {/* Inner iris */}
      <mesh position={[0, 0, 0.003]}>
        <circleGeometry args={[r * 0.42, 24]} />
        <meshStandardMaterial color="#05060d" roughness={0.02} metalness={0.15} />
      </mesh>
      {/* Sapphire glint */}
      <mesh position={[r * 0.18, r * 0.18, 0.005]}>
        <circleGeometry args={[r * 0.1, 12]} />
        <meshStandardMaterial color="#6699ff" transparent opacity={0.55} roughness={0} metalness={0} />
      </mesh>
    </group>
  );
}

function LiDARDot({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.011, 12]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.1} />
      </mesh>
    </group>
  );
}

function Flash({ x = 0, y = 0, z = 0, w = 0.055, h = 0.022 }: { x?: number; y?: number; z?: number; w?: number; h?: number }) {
  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[w, h, 0.008]} radius={0.008} smoothness={4}>
        <meshStandardMaterial color="#fffbe0" emissive="#ffd060" emissiveIntensity={0.2} roughness={0.3} metalness={0.1} />
      </RoundedBox>
    </group>
  );
}

// ── Camera module configurations ────────────────────────────────

/** iPhone Pro 15/16/17: triangular triple camera + LiDAR + flash */
function TripleTriModule({ pW, pH, pD, bodyColor, metalness, roughness }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
}) {
  const mx = -pW * 0.18;
  const my = pH * 0.32;
  const mz = -pD / 2 - 0.005;
  const modW = pW * 0.44;
  const modH = pW * 0.44;

  return (
    <group position={[mx, my, mz]}>
      {/* Module housing */}
      <RoundedBox args={[modW, modH, 0.018]} radius={0.028} smoothness={5}>
        <meshStandardMaterial color={bodyColor} metalness={metalness + 0.03} roughness={roughness - 0.02} envMapIntensity={1.5} />
      </RoundedBox>
      {/* Three lenses: top-left, top-right, bottom-center */}
      <CameraLens r={0.048} x={-modW * 0.26} y={modH * 0.22} z={0.012} />
      <CameraLens r={0.048} x={ modW * 0.26} y={modH * 0.22} z={0.012} />
      <CameraLens r={0.048} x={0}           y={-modH * 0.21} z={0.012} />
      {/* LiDAR (bottom-right) */}
      <LiDARDot x={modW * 0.3} y={-modH * 0.32} z={0.012} />
      {/* Flash (top, above lenses) */}
      <Flash x={0} y={modH * 0.42} z={0.012} w={modW * 0.6} h={0.022} />
    </group>
  );
}

/** iPhone 16/17 base: dual camera vertical + flash */
function DualVertModule({ pW, pH, pD, bodyColor, metalness, roughness }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
}) {
  const mx = -pW * 0.16;
  const my = pH * 0.34;
  const mz = -pD / 2 - 0.005;
  const modW = pW * 0.30;
  const modH = pW * 0.45;

  return (
    <group position={[mx, my, mz]}>
      <RoundedBox args={[modW, modH, 0.018]} radius={0.022} smoothness={5}>
        <meshStandardMaterial color={bodyColor} metalness={metalness + 0.02} roughness={roughness} envMapIntensity={1.5} />
      </RoundedBox>
      {/* Main + Ultra-wide stacked */}
      <CameraLens r={0.046} x={0} y={modH * 0.22} z={0.012} />
      <CameraLens r={0.046} x={0} y={-modH * 0.20} z={0.012} />
      <Flash x={0} y={modH * 0.44} z={0.012} w={0.035} h={0.022} />
    </group>
  );
}

/** iPhone 13/15 base: diagonal dual camera */
function DualDiagModule({ pW, pH, pD, bodyColor, metalness, roughness }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
}) {
  const mx = -pW * 0.16;
  const my = pH * 0.33;
  const mz = -pD / 2 - 0.004;
  const modW = pW * 0.34;
  const modH = pW * 0.34;

  return (
    <group position={[mx, my, mz]}>
      <RoundedBox args={[modW, modH, 0.015]} radius={0.024} smoothness={4}>
        <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness} envMapIntensity={1.2} />
      </RoundedBox>
      {/* Diagonal arrangement */}
      <CameraLens r={0.044} x={-modW * 0.22} y={modH * 0.22} z={0.010} />
      <CameraLens r={0.044} x={ modW * 0.22} y={-modH * 0.22} z={0.010} />
      <Flash x={modW * 0.3} y={modH * 0.3} z={0.010} w={0.025} h={0.025} />
    </group>
  );
}

/** Samsung S24 Ultra: quad camera in vertical strip + periscope */
function QuadSamsungModule({ pW, pH, pD, bodyColor, metalness, roughness }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
}) {
  const mx = -pW * 0.10;
  const my = pH * 0.28;
  const mz = -pD / 2 - 0.003;
  const lr = 0.042;

  return (
    <group position={[mx, my, mz]}>
      {/* Individual floating lenses (S24 Ultra style — no housing) */}
      <CameraLens r={lr} x={0} y={pH * 0.14}  z={mz * 0} />
      <CameraLens r={lr} x={0} y={pH * 0.05}  z={mz * 0} />
      <CameraLens r={lr} x={0} y={-pH * 0.04} z={mz * 0} />
      <CameraLens r={lr} x={0} y={-pH * 0.13} z={mz * 0} />
      {/* Flash */}
      <Flash x={0} y={pH * 0.22} z={0.005} w={0.028} h={0.028} />
    </group>
  );
}

/** Samsung S24 / OnePlus: circular module */
function CircularModule({ pW, pH, pD, bodyColor, metalness, roughness, isOnePlus = false }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number; isOnePlus?: boolean;
}) {
  const mx = -pW * 0.1;
  const my = pH * 0.31;
  const mz = -pD / 2 - 0.006;
  const modR = pW * 0.25;

  return (
    <group position={[mx, my, mz]}>
      {/* Outer ring */}
      <mesh>
        <torusGeometry args={[modR, modR * 0.08, 16, 64]} />
        <meshStandardMaterial
          color={isOnePlus ? '#c2410c' : '#1a1a1a'}
          metalness={0.9} roughness={0.1}
        />
      </mesh>
      {/* Inner fill */}
      <mesh position={[0, 0, -0.004]}>
        <circleGeometry args={[modR * 0.9, 64]} />
        <meshStandardMaterial color={bodyColor} metalness={metalness + 0.05} roughness={roughness - 0.03} />
      </mesh>
      {/* Three lenses */}
      <CameraLens r={0.044} x={-modR * 0.42} y={modR * 0.42} z={0.006} />
      <CameraLens r={0.044} x={ modR * 0.42} y={modR * 0.42} z={0.006} />
      <CameraLens r={0.044} x={0}            y={-modR * 0.42} z={0.006} />
      {/* Flash */}
      <Flash x={modR * 0.5} y={0} z={0.008} w={0.026} h={0.026} />
      {/* OnePlus: "Hasselblad" text placeholder dot */}
      {isOnePlus && (
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[modR * 0.12, 24]} />
          <meshStandardMaterial color="#ff6a00" emissive="#ff3300" emissiveIntensity={0.1} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

/** Pixel 8 Pro: full-width horizontal camera bar */
function PixelBarModule({ pW, pH, pD, bodyColor, metalness, roughness }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
}) {
  const my = pH * 0.36;
  const mz = -pD / 2 - 0.006;
  const barW = pW * 0.90;
  const barH = pW * 0.22;

  return (
    <group position={[0, my, mz]}>
      {/* Camera bar housing — full-width pill */}
      <RoundedBox args={[barW, barH, 0.014]} radius={barH / 2} smoothness={6}>
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.15} envMapIntensity={1.2} />
      </RoundedBox>
      {/* Three lenses in bar (centered) */}
      <CameraLens r={0.042} x={-barW * 0.26} y={0} z={0.010} />
      <CameraLens r={0.042} x={0}            y={0} z={0.010} />
      <CameraLens r={0.042} x={ barW * 0.26} y={0} z={0.010} />
      {/* Temperature sensor / laser AF */}
      <LiDARDot x={barW * 0.40} y={0} z={0.010} />
    </group>
  );
}

// ── Front camera elements ─────────────────────────────────────────

function DynamicIsland({ sH, isLandscape }: { sH: number; isLandscape: boolean }) {
  if (isLandscape) {
    return (
      <group position={[sH / 2 - 0.065, 0, 0]}>
        <RoundedBox args={[0.055, 0.22, 0.004]} radius={0.027} smoothness={5}>
          <meshStandardMaterial color="#000" roughness={0.05} metalness={0.2} />
        </RoundedBox>
      </group>
    );
  }
  return (
    <group position={[0, sH / 2 - 0.065, 0]}>
      <RoundedBox args={[0.22, 0.055, 0.004]} radius={0.027} smoothness={5}>
        <meshStandardMaterial color="#000" roughness={0.05} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

function PunchHole({ sH, sW, isLandscape }: { sH: number; sW: number; isLandscape: boolean }) {
  const pos: [number, number, number] = isLandscape
    ? [sW / 2 - 0.065, 0, 0]
    : [0, sH / 2 - 0.06, 0];
  return (
    <group position={pos}>
      <mesh>
        <circleGeometry args={[0.028, 32]} />
        <meshStandardMaterial color="#000" roughness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.016, 24]} />
        <meshStandardMaterial color="#050510" roughness={0.02} />
      </mesh>
    </group>
  );
}

function Notch({ sH, isLandscape }: { sH: number; isLandscape: boolean }) {
  if (isLandscape) {
    return (
      <mesh position={[sH / 2, 0, 0]}>
        <boxGeometry args={[0.06, 0.38, 0.004]} />
        <meshStandardMaterial color="#050505" roughness={0.1} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, sH / 2, 0]}>
      <boxGeometry args={[0.38, 0.06, 0.004]} />
      <meshStandardMaterial color="#050505" roughness={0.1} />
    </mesh>
  );
}

// ── Side buttons ─────────────────────────────────────────────────

function SideButtons({ pW, pH, pD, bodyColor, metalness, roughness, hasActionButton, hasCameraControl }: {
  pW: number; pH: number; pD: number; bodyColor: string; metalness: number; roughness: number;
  hasActionButton?: boolean; hasCameraControl?: boolean;
}) {
  const btnMat = { color: bodyColor, metalness: metalness + 0.02, roughness: roughness + 0.06 };
  const bZ = pD * 0.25;

  return (
    <group>
      {/* Left side: Action button (iPhone 15 Pro+) or silent switch */}
      {hasActionButton ? (
        <group position={[-pW / 2 - 0.007, pH * 0.37, 0]}>
          <RoundedBox args={[0.014, pH * 0.055, bZ]} radius={0.004} smoothness={3}>
            <meshStandardMaterial {...btnMat} />
          </RoundedBox>
        </group>
      ) : (
        <group position={[-pW / 2 - 0.007, pH * 0.38, 0]}>
          <RoundedBox args={[0.014, pH * 0.04, bZ]} radius={0.003} smoothness={3}>
            <meshStandardMaterial {...btnMat} />
          </RoundedBox>
        </group>
      )}

      {/* Left: Volume up */}
      <group position={[-pW / 2 - 0.007, pH * 0.24, 0]}>
        <RoundedBox args={[0.014, pH * 0.08, bZ]} radius={0.003} smoothness={3}>
          <meshStandardMaterial {...btnMat} />
        </RoundedBox>
      </group>
      {/* Left: Volume down */}
      <group position={[-pW / 2 - 0.007, pH * 0.13, 0]}>
        <RoundedBox args={[0.014, pH * 0.08, bZ]} radius={0.003} smoothness={3}>
          <meshStandardMaterial {...btnMat} />
        </RoundedBox>
      </group>

      {/* Right: Power button */}
      <group position={[pW / 2 + 0.007, pH * 0.22, 0]}>
        <RoundedBox args={[0.014, pH * 0.13, bZ]} radius={0.003} smoothness={3}>
          <meshStandardMaterial {...btnMat} />
        </RoundedBox>
      </group>

      {/* Right: Camera Control (iPhone 16+) */}
      {hasCameraControl && (
        <group position={[pW / 2 + 0.007, -pH * 0.05, 0]}>
          <RoundedBox args={[0.014, pH * 0.10, bZ]} radius={0.003} smoothness={3}>
            <meshStandardMaterial {...btnMat} />
          </RoundedBox>
          {/* Subtle grip lines */}
          {[-0.02, 0, 0.02].map((dy, i) => (
            <group key={i} position={[pW / 2 + 0.009, -pH * 0.05 + dy, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.001, 0.001, 0.009, 6]} />
                <meshStandardMaterial color="#666" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Bottom: USB-C port */}
      <group position={[0, -pH / 2, 0]}>
        <RoundedBox args={[pW * 0.14, 0.018, pD * 0.55]} radius={0.006} smoothness={4}
          position={[0, 0.01, 0]}>
          <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.6} />
        </RoundedBox>
      </group>
    </group>
  );
}

// ── Android-specific elements ─────────────────────────────────────

function SPenSlot({ pW, pH, pD, bodyColor }: { pW: number; pH: number; pD: number; bodyColor: string }) {
  return (
    <group position={[pW * 0.42, -pH * 0.44, 0]}>
      <RoundedBox args={[pW * 0.04, pH * 0.10, pD * 0.75]} radius={0.005} smoothness={3}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

// ── Main PhoneDevice component ────────────────────────────────────

interface Props {
  def: DeviceModelDef;
  deviceColor: string;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape: boolean;
}

export function Phone3DModel({ def, deviceColor, screenTexture, contentType, isLandscape }: Props) {
  const isAndroid = def.storeType === 'android';

  // Normalize: phone height = 2.0 units
  const scale = 2.0 / (def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = 0.115;
  const br = isAndroid
    ? (def.id.includes('ultra') ? 0.06 : 0.085)
    : (def.id.includes('13') ? 0.10 : 0.11);

  const mat = isAndroid
    ? (ANDROID_FRAME[def.frame] ?? ANDROID_FRAME.titanium)
    : (BODY_COLORS[deviceColor] ?? BODY_COLORS.titanium);

  const bodyColor = mat.body;
  const { metalness, roughness } = mat;

  // Screen geometry (portrait)
  const insetTopPx  = (def.insetTop    / 100) * scale;
  const insetBotPx  = (def.insetBottom / 100) * scale;
  const insetSidePx = (def.insetSide   / 100) * scale;
  const sW = pW - insetSidePx * 2;
  const sH = pH - insetTopPx - insetBotPx;
  const sOffY = -(insetTopPx - insetBotPx) / 2;
  const sZ = pD / 2 + 0.001;

  // For landscape: swap W/H and adjust
  const [displayW, displayH] = isLandscape ? [pH, pW] : [pW, pH];
  const [screenW, screenH] = isLandscape ? [sH, sW] : [sW, sH];

  const cameraModuleProps = { pW, pH, pD, bodyColor, metalness, roughness };

  return (
    <group rotation={isLandscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}>
      {/* ── Body ────────────────────────────────────────────────── */}
      <RoundedBox args={[pW, pH, pD]} radius={br} smoothness={8} castShadow receiveShadow>
        <meshStandardMaterial
          color={bodyColor}
          metalness={metalness}
          roughness={roughness}
          envMapIntensity={1.8}
        />
      </RoundedBox>

      {/* ── Front face: screen assembly ─────────────────────────── */}
      {/* Screen black base */}
      <mesh position={[0, sOffY, sZ]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#050510" roughness={0.05} metalness={0} />
      </mesh>

      {/* Screen content texture */}
      <group position={[0, sOffY, sZ + 0.001]}>
        <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>

      {/* Screen glass gloss */}
      <mesh position={[0, sOffY, sZ + 0.004]}>
        <planeGeometry args={[sW + 0.01, sH + 0.01]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.03} roughness={0.01} metalness={0} />
      </mesh>

      {/* Front face black bezel */}
      <mesh position={[0, 0, sZ - 0.0005]}>
        <planeGeometry args={[pW - 0.005, pH - 0.005]} />
        <meshStandardMaterial color="#030308" roughness={0.1} metalness={0} transparent opacity={0.95} />
      </mesh>

      {/* ── Front camera ─────────────────────────────────────────── */}
      <group position={[0, sOffY, sZ + 0.003]}>
        {def.camera === 'dynamic-island' && <DynamicIsland sH={sH} isLandscape={false} />}
        {def.camera === 'punch-hole' && <PunchHole sH={sH} sW={sW} isLandscape={false} />}
        {def.camera === 'notch' && <Notch sH={sH} isLandscape={false} />}
      </group>

      {/* ── Side buttons ──────────────────────────────────────────── */}
      <SideButtons
        {...cameraModuleProps}
        hasActionButton={def.hasActionButton}
        hasCameraControl={def.hasCameraControl}
      />

      {/* ── S-Pen slot (Samsung Ultra) ───────────────────────────── */}
      {def.hasSPen && <SPenSlot pW={pW} pH={pH} pD={pD} bodyColor={bodyColor} />}

      {/* ── Back camera module ─────────────────────────────────────── */}
      {def.cameraLayout === 'triple-tri'    && <TripleTriModule {...cameraModuleProps} />}
      {def.cameraLayout === 'dual-v'        && <DualVertModule {...cameraModuleProps} />}
      {def.cameraLayout === 'dual-diag'     && <DualDiagModule {...cameraModuleProps} />}
      {def.cameraLayout === 'quad-samsung'  && <QuadSamsungModule {...cameraModuleProps} />}
      {def.cameraLayout === 'triple-bar'    && <PixelBarModule {...cameraModuleProps} />}
      {def.cameraLayout === 'triple-round'  && (
        <CircularModule {...cameraModuleProps} isOnePlus={def.id.includes('oneplus')} />
      )}

      {/* ── Rear face highlight ─────────────────────────────────────── */}
      <mesh position={[0, 0, -pD / 2]}>
        <planeGeometry args={[pW - 0.01, pH - 0.01]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.02} roughness={0} metalness={0} />
      </mesh>

      {/* ── Frame edge highlight ─────────────────────────────────────── */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[Math.max(pW, pH) / 2 * 0.01, 0.002, 4, 4]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
    </group>
  );
}
