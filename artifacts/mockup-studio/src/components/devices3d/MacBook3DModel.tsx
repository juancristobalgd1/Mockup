import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';
import { useApp } from '../../store';
import { getGlobalScreenTexture } from './textureGlobal';

interface Props {
  def: DeviceModelDef;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  lidAngle?: number;
}

function ScreenPlane({ w, h, screenTexture, contentType }: {
  w: number; h: number;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
}) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#050510', toneMapped: false }), []);
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
      mat.color.set('#050510');
      mat.needsUpdate = true;
    }
  });
  return (
    <mesh material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

/** Renders rows of keyboard keys */
function Keyboard({ baseW, baseH, baseD, isPro, bodyColor }: {
  baseW: number; baseH: number; baseD: number; isPro: boolean; bodyColor: string;
}) {
  const keyColor = isPro ? '#1c1c1e' : '#d0ccc3';
  const keySurface = isPro ? '#2a2a2d' : '#c8c4bb';
  const keyMat = { color: keySurface, metalness: 0.0, roughness: 0.85 };
  const keyHeight = 0.003;
  const keyZ = baseD / 2 + 0.0015;

  // Key rows layout: each row = [keys count, key width, key height, x-offset, y-offset]
  const rows: Array<{ count: number; kW: number; kH: number; xStart: number; y: number; gap: number }> = [
    { count: 13, kW: baseW * 0.058, kH: baseH * 0.09, xStart: -baseW * 0.40, y: baseH * 0.15, gap: baseW * 0.066 },
    { count: 13, kW: baseW * 0.058, kH: baseH * 0.14, xStart: -baseW * 0.40, y: baseH * 0.03, gap: baseW * 0.063 },
    { count: 14, kW: baseW * 0.056, kH: baseH * 0.14, xStart: -baseW * 0.40, y: -baseH * 0.09, gap: baseW * 0.059 },
    { count: 13, kW: baseW * 0.062, kH: baseH * 0.14, xStart: -baseW * 0.39, y: -baseH * 0.21, gap: baseW * 0.062 },
    { count: 12, kW: baseW * 0.065, kH: baseH * 0.14, xStart: -baseW * 0.39, y: -baseH * 0.33, gap: baseW * 0.066 },
  ];

  return (
    <group position={[0, 0, keyZ]}>
      {/* Keyboard base area */}
      <mesh position={[0, -baseH * 0.09, -0.0005]}>
        <planeGeometry args={[baseW * 0.88, baseH * 0.62]} />
        <meshStandardMaterial color={keyColor} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Key rows */}
      {rows.map((row, ri) =>
        Array.from({ length: row.count }).map((_, ki) => (
          <group key={`${ri}-${ki}`} position={[row.xStart + ki * row.gap, row.y, 0]}>
            <RoundedBox args={[row.kW * 0.88, row.kH * 0.80, keyHeight]} radius={0.003} smoothness={2}>
              <meshStandardMaterial {...keyMat} />
            </RoundedBox>
          </group>
        ))
      )}

      {/* Space bar */}
      <group position={[0, -baseH * 0.45, 0]}>
        <RoundedBox args={[baseW * 0.33, baseH * 0.12, keyHeight]} radius={0.004} smoothness={3}>
          <meshStandardMaterial {...keyMat} />
        </RoundedBox>
      </group>

      {/* Arrow keys cluster */}
      {[[-baseW * 0.32, -baseH * 0.45], [-baseW * 0.27, -baseH * 0.39], [-baseW * 0.27, -baseH * 0.51], [-baseW * 0.22, -baseH * 0.45]].map(([x, y], i) => (
        <group key={`arrow-${i}`} position={[x, y, 0]}>
          <RoundedBox args={[baseW * 0.052, baseH * 0.065, keyHeight]} radius={0.003} smoothness={2}>
            <meshStandardMaterial {...keyMat} />
          </RoundedBox>
        </group>
      ))}

      {/* Touch ID key (top-right, Pro) */}
      {isPro && (
        <group position={[baseW * 0.41, baseH * 0.15, 0.001]}>
          <RoundedBox args={[baseW * 0.058, baseH * 0.09, 0.004]} radius={0.004} smoothness={3}>
            <meshStandardMaterial color="#1a1a1c" roughness={0.3} metalness={0.5} />
          </RoundedBox>
          {/* Touch ID sensor circle */}
          <mesh position={[0, 0, 0.003]}>
            <circleGeometry args={[baseW * 0.014, 24]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** Trackpad with Force Touch rings */
function Trackpad({ baseW, baseH, baseD, isPro, bodyColor }: {
  baseW: number; baseH: number; baseD: number; isPro: boolean; bodyColor: string;
}) {
  const tpW = baseW * 0.30;
  const tpH = baseH * 0.38;
  const tpColor = isPro ? '#222224' : '#c4c0b7';

  return (
    <group position={[0, baseD / 2 + 0.0006, baseH * 0.27]}>
      {/* Trackpad surface */}
      <mesh>
        <planeGeometry args={[tpW, tpH]} />
        <meshStandardMaterial color={tpColor} roughness={0.25} metalness={0.35} envMapIntensity={0.5} />
      </mesh>
      {/* Force Touch border */}
      <mesh position={[0, 0, 0.0001]}>
        <ringGeometry args={[tpW * 0.48, tpW * 0.50, 4]} />
        <meshStandardMaterial color={isPro ? '#333' : '#bbb'} roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  );
}

/** Side ports */
function Ports({ baseW, baseH, baseD, isPro, bodyColor, metalness, roughness }: {
  baseW: number; baseH: number; baseD: number; isPro: boolean; bodyColor: string; metalness: number; roughness: number;
}) {
  const portMat = { color: '#0a0a0a', metalness: 0.3, roughness: 0.5 };
  const portZ = baseD / 2;

  return (
    <group>
      {/* Left side — MagSafe + 2 Thunderbolt */}
      {isPro && (
        <>
          {/* MagSafe connector (pill shape) */}
          <group position={[-baseW / 2, portZ * 0.4, -baseH * 0.1]}>
            <RoundedBox args={[0.008, 0.028, 0.012]} radius={0.005} smoothness={3}>
              <meshStandardMaterial color="#cc8800" metalness={0.8} roughness={0.2} />
            </RoundedBox>
          </group>
          {/* Thunderbolt left */}
          <group position={[-baseW / 2, portZ * 0.4, baseH * 0.05]}>
            <RoundedBox args={[0.008, 0.018, 0.010]} radius={0.004} smoothness={3}>
              <meshStandardMaterial {...portMat} />
            </RoundedBox>
          </group>
          <group position={[-baseW / 2, portZ * 0.4, baseH * 0.18]}>
            <RoundedBox args={[0.008, 0.018, 0.010]} radius={0.004} smoothness={3}>
              <meshStandardMaterial {...portMat} />
            </RoundedBox>
          </group>
        </>
      )}
      {/* Right side — HDMI + SD card + Thunderbolt */}
      {isPro && (
        <>
          <group position={[baseW / 2, portZ * 0.4, -baseH * 0.05]}>
            <RoundedBox args={[0.008, 0.028, 0.018]} radius={0.003} smoothness={3}>
              <meshStandardMaterial {...portMat} />
            </RoundedBox>
          </group>
          <group position={[baseW / 2, portZ * 0.4, baseH * 0.10]}>
            <RoundedBox args={[0.008, 0.030, 0.012]} radius={0.003} smoothness={3}>
              <meshStandardMaterial {...portMat} />
            </RoundedBox>
          </group>
          <group position={[baseW / 2, portZ * 0.4, baseH * 0.22]}>
            <RoundedBox args={[0.008, 0.018, 0.010]} radius={0.004} smoothness={3}>
              <meshStandardMaterial {...portMat} />
            </RoundedBox>
          </group>
        </>
      )}
    </group>
  );
}

export function MacBook3DModel({ def, screenTexture, contentType, lidAngle = 112 }: Props) {
  const { state } = useApp();
  const isPro = def.id.includes('pro');
  const isAir = def.id.includes('air');
  const bodyColor = isPro ? '#1c1c1e' : (isAir ? '#e8e0d0' : '#1c1c1e');
  const metalness = isPro ? 0.34 : 0.22;
  const roughness = isPro ? 0.24 : 0.30;
  const bodyMat = { color: bodyColor, metalness, roughness };

  // Normalized: lid width = 3.0 units
  const lidW = 3.0;
  const aspect = def.h / def.w;
  const lidH = lidW * aspect;
  const lidD = isPro ? 0.072 : 0.065;
  const baseW = lidW + 0.12;
  const baseH = lidH * 0.25;
  const baseD = isPro ? 0.048 : 0.040;

  const screenInsetH = (def.insetTop + def.insetBottom) / def.h * lidH;
  const screenInsetW = (def.insetSide * 2) / def.w * lidW;
  const sW = lidW - screenInsetW;
  const sH = lidH - screenInsetH;
  const sOffY = -(def.insetTop - def.insetBottom) / def.h * lidH / 2;

  const lidRad = (lidAngle - 90) * (Math.PI / 180);

  return (
    <group position={[0, -0.15, 0]}>
      {/* ── Base ────────────────────────────────────────────────── */}
      <group>
        <RoundedBox
          args={[baseW, baseD, baseH]} radius={0.028} smoothness={5}
          castShadow receiveShadow
          position={[0, 0, 0]}
        >
          <meshPhysicalMaterial {...bodyMat} envMapIntensity={0.38} clearcoat={1} clearcoatRoughness={0.09} reflectivity={0.52} />
        </RoundedBox>

        {/* Keyboard area */}
        <Keyboard baseW={baseW} baseH={baseH} baseD={baseD} isPro={isPro} bodyColor={bodyColor} />

        {/* Trackpad */}
        <Trackpad baseW={baseW} baseH={baseH} baseD={baseD} isPro={isPro} bodyColor={bodyColor} />

        {/* Ports */}
        <Ports
          baseW={baseW} baseH={baseH} baseD={baseD}
          isPro={isPro} bodyColor={bodyColor} metalness={metalness} roughness={roughness}
        />

        {/* Bottom rubber feet */}
        {[[-baseW * 0.40, -baseH * 0.42], [baseW * 0.40, -baseH * 0.42],
          [-baseW * 0.40,  baseH * 0.42], [baseW * 0.40,  baseH * 0.42]].map(([x, z], i) => (
          <group key={i} position={[x, -baseD / 2 - 0.002, z]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.025, 0.004, 12]} />
              <meshStandardMaterial color="#0d0d0d" roughness={0.9} metalness={0} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Hinge */}
      <group position={[0, baseD / 2 - 0.004, -baseH / 2]}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.014, 0.014, baseW * 0.70, 16]} />
          <meshPhysicalMaterial color={bodyColor} metalness={0.42} roughness={0.22} envMapIntensity={0.34} clearcoat={0.8} clearcoatRoughness={0.08} />
        </mesh>
      </group>

      {/* ── Lid — pivot from bottom hinge ───────────────────────── */}
      <group position={[0, baseD / 2, -baseH / 2]} rotation={[-lidRad, 0, 0]}>
        <group position={[0, lidH / 2, 0]}>
          <RoundedBox args={[lidW, lidH, lidD]} radius={0.038} smoothness={6} castShadow>
            <meshPhysicalMaterial {...bodyMat} envMapIntensity={0.42} clearcoat={1} clearcoatRoughness={0.08} reflectivity={0.55} />
          </RoundedBox>

          {/* Apple logo on back */}
          <group position={[0, 0, -lidD / 2 - 0.001]}>
            <mesh>
              <circleGeometry args={[lidW * 0.06, 32]} />
              <meshPhysicalMaterial
                color={bodyColor}
                metalness={0.22}
                roughness={0.2}
                envMapIntensity={0.34}
                clearcoat={1}
                clearcoatRoughness={0.06}
              />
            </mesh>
          </group>

          {/* Screen black bezel — must use RoundedBox to match lid corners */}
          <RoundedBox
            args={[lidW - 0.004, lidH - 0.004, 0.002]}
            radius={0.034}
            smoothness={6}
            position={[0, 0, lidD / 2 + 0.001]}
          >
            <meshStandardMaterial color="#030306" roughness={0.06} metalness={0} envMapIntensity={0.6} />
          </RoundedBox>

          {/* Screen content base */}
          <mesh position={[0, sOffY, lidD / 2 + 0.003]}>
            <planeGeometry args={[sW, sH]} />
            <meshStandardMaterial color="#020208" roughness={0.04} metalness={0} />
          </mesh>
          <group position={[0, sOffY, lidD / 2 + 0.004]}>
            <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
          </group>

          {/* Screen glass gloss */}
          {(state.glassReflection ?? true) && (
          <mesh position={[0, sOffY, lidD / 2 + 0.006]}>
            <planeGeometry args={[sW, sH]} />
            <meshStandardMaterial color="#aaccff" transparent opacity={0.018} roughness={0} metalness={0} />
          </mesh>
          )}

          {/* Notch — MacBook Pro */}
          {isPro && (
            <group position={[0, sH / 2 + (def.insetTop / def.h * lidH) * 0.28, lidD / 2 + 0.003]}>
              <RoundedBox args={[sW * 0.20, 0.055, 0.01]} radius={0.022} smoothness={4}>
                <meshStandardMaterial color={bodyColor} roughness={roughness} metalness={metalness} />
              </RoundedBox>
            </group>
          )}

          {/* Webcam / FaceTime HD */}
          <group position={[0, sH / 2 + def.insetTop / def.h * lidH * 0.52, lidD / 2 + 0.004]}>
            <mesh>
              <circleGeometry args={[0.019, 24]} />
              <meshStandardMaterial color="#0d0d0d" roughness={0.05} metalness={0.2} />
            </mesh>
            {/* Lens */}
            <mesh position={[0, 0, 0.001]}>
              <circleGeometry args={[0.010, 20]} />
              <meshStandardMaterial color="#05060e" roughness={0.02} metalness={0.3} />
            </mesh>
            {/* Green indicator light */}
            <mesh position={[0.030, 0, 0.001]}>
              <circleGeometry args={[0.005, 10]} />
              <meshStandardMaterial color="#00cc44" emissive="#00ff44" emissiveIntensity={0} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
