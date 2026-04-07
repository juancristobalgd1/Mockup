import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';
import { getGlobalScreenTexture } from './textureGlobal';

// ── Material presets ─────────────────────────────────────────────

const FRAME_MAT: Record<string, { color: string; metalness: number; roughness: number }> = {
  titanium: { color: '#71717a', metalness: 0.90, roughness: 0.08 },
  aluminum: { color: '#e8e8e8', metalness: 0.85, roughness: 0.10 },
  glass:    { color: '#1c1c1e', metalness: 0.30, roughness: 0.05 },
  light:    { color: '#f5f5f5', metalness: 0.70, roughness: 0.14 },
};

const DEVICE_COLORS: Record<string, string> = {
  titanium:     '#6b7280',
  black:        '#0d0d0f',
  white:        '#e8e8ec',
  blue:         '#1e3a5f',
  naturallight: '#c2b8a3',
  sierra:       '#6b8ca3',
  desert:       '#8c7a6e',
  clay:         '#e0dbd0',
};

// ── Screen that updates texture every frame ──────────────────────

function ScreenContent({
  w, h, screenTexture, contentType,
}: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  // Imperative material — R3F never resets mat.map / mat.color on re-renders.
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#050510', toneMapped: false,
  }), []);
  useEffect(() => () => { mat.dispose(); }, [mat]);

  const ctRef = useRef(contentType);
  ctRef.current = contentType;

  // Re-apply texture after every render using the global singleton.
  useEffect(() => {
    const tex = getGlobalScreenTexture();
    if (tex && (mat.map !== tex || mat.color.r < 0.99)) {
      mat.map = tex;
      mat.color.set('#ffffff');
      mat.needsUpdate = true;
    }
  });

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
      mat.color.set('#050510');
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh material={mat} renderOrder={1}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

// ── Camera lens ──────────────────────────────────────────────────

function Lens({ r = 0.042, x = 0, y = 0, z = 0 }: {
  r?: number; x?: number; y?: number; z?: number;
}) {
  return (
    <group position={[x, y, z]}>
      {/* Outer chrome ring */}
      <mesh>
        <torusGeometry args={[r, r * 0.20, 16, 48]} />
        <meshStandardMaterial color="#888" metalness={0.95} roughness={0.05} envMapIntensity={1.1} />
      </mesh>
      {/* Lens glass */}
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[r * 0.80, 40]} />
        <meshStandardMaterial color="#060c1a" roughness={0.04} metalness={0.5} envMapIntensity={1.2} />
      </mesh>
      {/* Inner iris */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[r * 0.42, 32]} />
        <meshStandardMaterial color="#030509" roughness={0.02} metalness={0.2} />
      </mesh>
      {/* Sapphire glint */}
      <mesh position={[r * 0.22, r * 0.22, 0.006]}>
        <circleGeometry args={[r * 0.10, 12]} />
        <meshStandardMaterial color="#88aaff" transparent opacity={0.60} roughness={0} />
      </mesh>
    </group>
  );
}

function Flash({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <RoundedBox args={[0.065, 0.025, 0.006]} radius={0.010} smoothness={4}>
        <meshStandardMaterial color="#fffde0" emissive="#ffc040" emissiveIntensity={0.15} roughness={0.35} />
      </RoundedBox>
    </group>
  );
}

function LiDAR({ x = 0, y = 0, z = 0 }: { x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[0.010, 12]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.15} />
      </mesh>
    </group>
  );
}

// ── Camera modules ───────────────────────────────────────────────

function TripleTriModule({ pW, pH, pD, color, metal, rough }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
}) {
  const bZ = -pD / 2 - 0.003;
  const mW = pW * 0.46; const mH = mW;
  return (
    <group position={[-pW * 0.17, pH * 0.31, bZ]}>
      <RoundedBox args={[mW, mH, 0.020]} radius={0.030} smoothness={6}>
        <meshStandardMaterial color={color} metalness={metal + 0.04} roughness={rough - 0.02} envMapIntensity={0.9} />
      </RoundedBox>
      <Lens r={0.050} x={-mW * 0.25} y={ mH * 0.22} z={0.013} />
      <Lens r={0.050} x={ mW * 0.25} y={ mH * 0.22} z={0.013} />
      <Lens r={0.050} x={0}           y={-mH * 0.20} z={0.013} />
      <LiDAR x={mW * 0.32} y={-mH * 0.32} z={0.013} />
      <Flash x={0}         y={ mH * 0.43} z={0.013} />
    </group>
  );
}

function DualVertModule({ pW, pH, pD, color, metal, rough }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
}) {
  const bZ = -pD / 2 - 0.003;
  const mW = pW * 0.30; const mH = pW * 0.46;
  return (
    <group position={[-pW * 0.14, pH * 0.33, bZ]}>
      <RoundedBox args={[mW, mH, 0.018]} radius={0.024} smoothness={5}>
        <meshStandardMaterial color={color} metalness={metal + 0.02} roughness={rough} envMapIntensity={0.8} />
      </RoundedBox>
      <Lens r={0.047} x={0} y={ mH * 0.21} z={0.012} />
      <Lens r={0.047} x={0} y={-mH * 0.19} z={0.012} />
      <Flash x={0} y={mH * 0.43} z={0.012} />
    </group>
  );
}

function DualDiagModule({ pW, pH, pD, color, metal, rough }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
}) {
  const bZ = -pD / 2 - 0.003;
  const mW = pW * 0.34; const mH = mW;
  return (
    <group position={[-pW * 0.15, pH * 0.33, bZ]}>
      <RoundedBox args={[mW, mH, 0.015]} radius={0.026} smoothness={5}>
        <meshStandardMaterial color={color} metalness={metal} roughness={rough} envMapIntensity={0.7} />
      </RoundedBox>
      <Lens r={0.044} x={-mW * 0.22} y={ mH * 0.22} z={0.010} />
      <Lens r={0.044} x={ mW * 0.22} y={-mH * 0.22} z={0.010} />
      <Flash x={mW * 0.30} y={mH * 0.30} z={0.010} />
    </group>
  );
}

function QuadSamsungModule({ pW, pH, pD, color, metal, rough }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
}) {
  const bZ = -pD / 2 - 0.003;
  const mW = pW * 0.34; const mH = pW * 0.55;
  const lr = 0.040;
  return (
    <group position={[-pW * 0.10, pH * 0.25, bZ]}>
      <RoundedBox args={[mW, mH, 0.016]} radius={0.022} smoothness={5}>
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.15} />
      </RoundedBox>
      <Lens r={lr} x={0} y={ mH * 0.30} z={0.010} />
      <Lens r={lr} x={0} y={ mH * 0.10} z={0.010} />
      <Lens r={lr} x={0} y={-mH * 0.10} z={0.010} />
      <Lens r={lr} x={0} y={-mH * 0.30} z={0.010} />
      <Flash x={0} y={mH * 0.44} z={0.010} />
    </group>
  );
}

function PixelBarModule({ pW, pH, pD, color, metal, rough }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
}) {
  const bZ = -pD / 2 - 0.006;
  const bW = pW * 0.90; const bH = pW * 0.22;
  return (
    <group position={[0, pH * 0.36, bZ]}>
      <RoundedBox args={[bW, bH, 0.014]} radius={bH / 2} smoothness={6}>
        <meshStandardMaterial color="#111" metalness={0.70} roughness={0.15} />
      </RoundedBox>
      <Lens r={0.040} x={-bW * 0.26} y={0} z={0.010} />
      <Lens r={0.040} x={0}           y={0} z={0.010} />
      <Lens r={0.040} x={ bW * 0.26} y={0} z={0.010} />
      <LiDAR x={bW * 0.40} y={0} z={0.010} />
    </group>
  );
}

function CircularModule({ pW, pH, pD, color, metal, rough, isOnePlus = false }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number; isOnePlus?: boolean;
}) {
  const bZ = -pD / 2 - 0.006;
  const R = pW * 0.26;
  return (
    <group position={[-pW * 0.08, pH * 0.30, bZ]}>
      <mesh>
        <torusGeometry args={[R, R * 0.08, 16, 64]} />
        <meshStandardMaterial color={isOnePlus ? '#c2410c' : '#1a1a1a'} metalness={0.9} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0, -0.005]}>
        <circleGeometry args={[R * 0.88, 64]} />
        <meshStandardMaterial color={color} metalness={metal + 0.05} roughness={rough - 0.03} />
      </mesh>
      <Lens r={0.044} x={-R * 0.42} y={ R * 0.42} z={0.006} />
      <Lens r={0.044} x={ R * 0.42} y={ R * 0.42} z={0.006} />
      <Lens r={0.044} x={0}         y={-R * 0.42} z={0.006} />
      <Flash x={R * 0.50} y={0} z={0.008} />
    </group>
  );
}

// ── Front camera / notch ─────────────────────────────────────────

function DynamicIsland({ sH, isLandscape }: { sH: number; isLandscape: boolean }) {
  const [w, h] = isLandscape ? [0.055, 0.22] : [0.22, 0.055];
  const pos: [number, number, number] = isLandscape
    ? [sH / 2 - 0.065, 0, 0]
    : [0, sH / 2 - 0.065, 0];
  return (
    <group position={pos}>
      <RoundedBox args={[w, h, 0.005]} radius={Math.min(w, h) / 2} smoothness={6}>
        <meshStandardMaterial color="#000" roughness={0.05} metalness={0.2} />
      </RoundedBox>
    </group>
  );
}

function PunchHole({ sH, sW, isLandscape }: { sH: number; sW: number; isLandscape: boolean }) {
  const pos: [number, number, number] = isLandscape
    ? [sW / 2 - 0.065, 0, 0]
    : [0, sH / 2 - 0.062, 0];
  return (
    <group position={pos}>
      <mesh>
        <circleGeometry args={[0.026, 32]} />
        <meshStandardMaterial color="#000" roughness={0.05} />
      </mesh>
    </group>
  );
}

function Notch({ sH, isLandscape }: { sH: number; isLandscape: boolean }) {
  const pos: [number, number, number] = isLandscape
    ? [sH / 2, 0, 0]
    : [0, sH / 2, 0];
  const [w, h] = isLandscape ? [0.06, 0.38] : [0.38, 0.06];
  return (
    <mesh position={pos}>
      <boxGeometry args={[w, h, 0.005]} />
      <meshStandardMaterial color="#050505" roughness={0.1} />
    </mesh>
  );
}

// ── Side buttons ─────────────────────────────────────────────────

function SideButtons({ pW, pH, pD, color, metal, rough, hasActionButton, hasCameraControl }: {
  pW: number; pH: number; pD: number; color: string; metal: number; rough: number;
  hasActionButton?: boolean; hasCameraControl?: boolean;
}) {
  const bD = pD * 0.25;
  const mat = { color, metalness: metal + 0.02, roughness: rough + 0.05 };

  return (
    <group>
      {/* Left: Action button or silent switch */}
      {hasActionButton ? (
        <RoundedBox args={[0.014, pH * 0.055, bD]} radius={0.004} smoothness={3}
          position={[-pW / 2 - 0.007, pH * 0.37, 0]}>
          <meshStandardMaterial {...mat} />
        </RoundedBox>
      ) : (
        <RoundedBox args={[0.014, pH * 0.040, bD]} radius={0.003} smoothness={3}
          position={[-pW / 2 - 0.007, pH * 0.38, 0]}>
          <meshStandardMaterial {...mat} />
        </RoundedBox>
      )}
      {/* Left: Volume up */}
      <RoundedBox args={[0.014, pH * 0.08, bD]} radius={0.003} smoothness={3}
        position={[-pW / 2 - 0.007, pH * 0.24, 0]}>
        <meshStandardMaterial {...mat} />
      </RoundedBox>
      {/* Left: Volume down */}
      <RoundedBox args={[0.014, pH * 0.08, bD]} radius={0.003} smoothness={3}
        position={[-pW / 2 - 0.007, pH * 0.13, 0]}>
        <meshStandardMaterial {...mat} />
      </RoundedBox>
      {/* Right: Power */}
      <RoundedBox args={[0.014, pH * 0.13, bD]} radius={0.003} smoothness={3}
        position={[pW / 2 + 0.007, pH * 0.22, 0]}>
        <meshStandardMaterial {...mat} />
      </RoundedBox>
      {/* Right: Camera Control (iPhone 16+) */}
      {hasCameraControl && (
        <RoundedBox args={[0.014, pH * 0.10, bD]} radius={0.003} smoothness={3}
          position={[pW / 2 + 0.007, -pH * 0.05, 0]}>
          <meshStandardMaterial {...mat} />
        </RoundedBox>
      )}
      {/* Bottom: USB-C port */}
      <RoundedBox args={[pW * 0.14, 0.018, pD * 0.55]} radius={0.006} smoothness={4}
        position={[0, -pH / 2 + 0.005, 0]}>
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.6} />
      </RoundedBox>
    </group>
  );
}

// ── Main component ────────────────────────────────────────────────

interface Props {
  def: DeviceModelDef;
  deviceColor: string;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape: boolean;
}

export function Phone3DModel({ def, deviceColor, screenTexture, contentType, isLandscape }: Props) {
  const isAndroid = def.storeType === 'android';
  const isPro     = def.id.includes('pro') || def.id.includes('ultra');

  // Scale: phone height = 2.2 units
  const scale = 2.2 / (def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = 0.118; // phone depth (thickness)

  // Border radius matching real device proportions
  const br = isAndroid
    ? (def.id.includes('ultra') ? 0.050 : 0.078)
    : isPro
      ? (def.id.includes('13') ? 0.100 : def.id.includes('15') ? 0.106 : 0.110)
      : 0.114;

  // Colors
  const isClay      = deviceColor === 'clay';
  const framePreset = FRAME_MAT[def.frame] ?? FRAME_MAT.aluminum;
  const colorKey    = deviceColor || 'titanium';
  const bodyHex     = isClay
    ? '#e0dbd0'
    : isAndroid
      ? framePreset.color
      : (DEVICE_COLORS[colorKey] ?? framePreset.color);

  const metalness = isClay ? 0.0 : framePreset.metalness;
  const roughness = isClay ? 0.90 : framePreset.roughness;

  // Screen dimensions (inset from frame edges)
  const iTop  = (def.insetTop    / 100) * scale;
  const iBot  = (def.insetBottom / 100) * scale;
  const iSide = (def.insetSide   / 100) * scale;
  const sW    = pW - iSide * 2;
  const sH    = pH - iTop - iBot;
  const sOffY = -(iTop - iBot) / 2;

  // Z positions
  const frontZ = pD / 2;  // body front face
  const backZ  = -pD / 2; // body back face

  const mProps = { pW, pH, pD, color: bodyHex, metal: metalness, rough: roughness };

  return (
    <group rotation={isLandscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}>

      {/* ── 1. BODY ─────────────────────────────────────────────── */}
      {/* Single RoundedBox — no glass overlay so no "double" outline */}
      <RoundedBox
        args={[pW, pH, pD]}
        radius={br}
        smoothness={12}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={bodyHex}
          metalness={metalness}
          roughness={roughness}
          envMapIntensity={1.0}
        />
      </RoundedBox>

      {/* ── 2. FRONT FACE — screen bezel + OLED ─────────────────── */}
      {/* Black bezel fills the front face except the aluminum rim */}
      <mesh position={[0, 0, frontZ + 0.0008]}>
        <planeGeometry args={[pW * 0.94, pH * 0.97]} />
        <meshStandardMaterial color="#030306" roughness={0.05} metalness={0} />
      </mesh>

      {/* OLED screen — dark base */}
      <mesh position={[0, sOffY, frontZ + 0.0016]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#020208" roughness={0.02} metalness={0} />
      </mesh>

      {/* Screen content */}
      <group position={[0, sOffY, frontZ + 0.0024]}>
        <ScreenContent w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>

      {/* Glass gloss reflection */}
      <mesh position={[0, sOffY, frontZ + 0.0032]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#aaccff" transparent opacity={0.018} roughness={0} metalness={0} />
      </mesh>

      {/* ── 3. FRONT CAMERA ─────────────────────────────────────── */}
      <group position={[0, sOffY, frontZ + 0.004]}>
        {def.camera === 'dynamic-island' && <DynamicIsland sH={sH} isLandscape={false} />}
        {def.camera === 'punch-hole'     && <PunchHole sH={sH} sW={sW} isLandscape={false} />}
        {def.camera === 'notch'          && <Notch sH={sH} isLandscape={false} />}
      </group>

      {/* ── 4. BACK FACE — logo + shimmer ────────────────────────── */}
      {/* Apple logo */}
      <mesh position={[0, pH * 0.03, backZ - 0.001]}>
        <circleGeometry args={[pW * 0.095, 48]} />
        <meshStandardMaterial
          color={bodyHex}
          metalness={metalness + 0.06}
          roughness={roughness - 0.04}
          envMapIntensity={1.3}
        />
      </mesh>

      {/* Back shimmer gradient */}
      <mesh position={[-pW * 0.06, pH * 0.10, backZ - 0.001]}>
        <planeGeometry args={[pW * 0.55, pH * 0.38]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.010} roughness={0} metalness={0} />
      </mesh>

      {/* ── 5. SIDE BUTTONS ──────────────────────────────────────── */}
      <SideButtons
        {...mProps}
        hasActionButton={def.hasActionButton}
        hasCameraControl={def.hasCameraControl}
      />

      {/* ── 6. S-PEN SLOT ────────────────────────────────────────── */}
      {def.hasSPen && (
        <RoundedBox
          args={[pW * 0.04, pH * 0.10, pD * 0.75]}
          radius={0.005} smoothness={3}
          position={[pW * 0.42, -pH * 0.44, 0]}
        >
          <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.5} />
        </RoundedBox>
      )}

      {/* ── 7. BACK CAMERA MODULE ────────────────────────────────── */}
      {def.cameraLayout === 'triple-tri'   && <TripleTriModule {...mProps} />}
      {def.cameraLayout === 'dual-v'       && <DualVertModule  {...mProps} />}
      {def.cameraLayout === 'dual-diag'    && <DualDiagModule  {...mProps} />}
      {def.cameraLayout === 'quad-samsung' && <QuadSamsungModule {...mProps} />}
      {def.cameraLayout === 'triple-bar'   && <PixelBarModule  {...mProps} />}
      {def.cameraLayout === 'triple-round' && (
        <CircularModule {...mProps} isOnePlus={def.id.includes('oneplus')} />
      )}

    </group>
  );
}
