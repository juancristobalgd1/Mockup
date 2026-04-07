import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  deviceColor: string;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  isLandscape: boolean;
}

const BODY_COLORS: Record<string, { body: string; metalness: number; roughness: number }> = {
  titanium: { body: '#2d2d2d', metalness: 0.85, roughness: 0.12 },
  black:    { body: '#0d0d0d', metalness: 0.7,  roughness: 0.18 },
  white:    { body: '#d0d0d0', metalness: 0.55, roughness: 0.22 },
  blue:     { body: '#1a2a5e', metalness: 0.75, roughness: 0.15 },
};

const ANDROID_COLORS: Record<string, { body: string; metalness: number; roughness: number }> = {
  titanium: { body: '#252525', metalness: 0.8, roughness: 0.14 },
  aluminum: { body: '#1e1e1e', metalness: 0.75, roughness: 0.2 },
  glass:    { body: '#1a1a1a', metalness: 0.6, roughness: 0.1 },
};

function EmptyScreen() {
  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color="#050510" roughness={0.1} metalness={0} />
    </mesh>
  );
}

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
    if (tex && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    } else if (!tex && mat.map) {
      mat.map = null;
      mat.needsUpdate = true;
    }
    // VideoTexture needs update every frame
    if (contentType === 'video' && tex) {
      tex.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={screenTexture.current ? '#ffffff' : '#050510'} toneMapped={false} />
    </mesh>
  );
}

export function Phone3DModel({ def, deviceColor, screenTexture, contentType, isLandscape }: Props) {
  const isAndroid = def.storeType === 'android';

  // Scale factor: normalize so phone height ~ 2.0 units
  const scale = 2.0 / (isLandscape ? def.w / 100 : def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = 0.11;
  const br = isAndroid ? 0.07 : 0.10;

  const mat = isAndroid
    ? (ANDROID_COLORS[def.frame] ?? ANDROID_COLORS.titanium)
    : (BODY_COLORS[deviceColor] ?? BODY_COLORS.titanium);

  // Screen dimensions (subtract insets)
  const insetH = def.insetTop / 100 * scale + def.insetBottom / 100 * scale;
  const insetW = def.insetSide / 100 * scale * 2;
  const sW = pW - insetW;
  const sH = pH - insetH;
  const sZ = pD / 2 + 0.001;

  // Dynamic Island / punch hole dimensions
  const diW = isAndroid ? 0.065 : 0.22;
  const diH = isAndroid ? 0.065 : 0.055;
  const diY = (sH / 2) - 0.085;
  const diR = isAndroid ? 0.032 : 0.027;

  const bodyColor = new THREE.Color(mat.body);

  return (
    <group rotation={isLandscape ? [0, 0, -Math.PI / 2] : [0, 0, 0]}>
      {/* Main body */}
      <RoundedBox args={[pW, pH, pD]} radius={br} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial
          color={bodyColor}
          metalness={mat.metalness}
          roughness={mat.roughness}
          envMapIntensity={1.5}
        />
      </RoundedBox>

      {/* Screen glass face */}
      <mesh position={[0, 0, sZ - 0.0005]}>
        <planeGeometry args={[sW + 0.02, sH + 0.02]} />
        <meshStandardMaterial
          color="#050505"
          roughness={0.02}
          metalness={0.0}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Screen content */}
      <mesh position={[0, -(def.insetTop - def.insetBottom) / 200 * scale, sZ + 0.0005]}>
        <planeGeometry args={[sW, sH]} />
        <meshBasicMaterial color="#050510" toneMapped={false} />
      </mesh>

      {/* Screen texture overlay (updated each frame) */}
      <group position={[0, -(def.insetTop - def.insetBottom) / 200 * scale, sZ + 0.001]}>
        <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>

      {/* Camera / Dynamic Island / Notch */}
      {def.camera === 'dynamic-island' && (
        <RoundedBox args={[diW, diH, 0.008]} radius={diR} smoothness={4}
          position={[0, diY - (def.insetTop - def.insetBottom) / 200 * scale, sZ + 0.004]}>
          <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.2} />
        </RoundedBox>
      )}
      {def.camera === 'punch-hole' && (
        <mesh position={[0, diY - (def.insetTop - def.insetBottom) / 200 * scale, sZ + 0.004]}>
          <circleGeometry args={[0.034, 32]} />
          <meshStandardMaterial color="#000000" roughness={0.05} />
        </mesh>
      )}
      {def.camera === 'notch' && (
        <RoundedBox args={[0.38, 0.065, 0.008]} radius={0.028} smoothness={4}
          position={[0, diY - (def.insetTop - def.insetBottom) / 200 * scale, sZ + 0.004]}>
          <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.1} />
        </RoundedBox>
      )}

      {/* Screen glass gloss overlay */}
      <mesh position={[0, 0, sZ + 0.003]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.02}
          metalness={0}
          transparent
          opacity={0.04}
        />
      </mesh>

      {/* Side buttons LEFT */}
      <group position={[-pW / 2 - 0.006, pH * 0.17, 0]}>
        <RoundedBox args={[0.012, pH * 0.07, 0.07]} radius={0.003} smoothness={3}>
          <meshStandardMaterial color={mat.body} metalness={mat.metalness} roughness={mat.roughness + 0.05} />
        </RoundedBox>
      </group>
      <group position={[-pW / 2 - 0.006, pH * 0.27, 0]}>
        <RoundedBox args={[0.012, pH * 0.07, 0.07]} radius={0.003} smoothness={3}>
          <meshStandardMaterial color={mat.body} metalness={mat.metalness} roughness={mat.roughness + 0.05} />
        </RoundedBox>
      </group>
      {/* Silent switch */}
      <group position={[-pW / 2 - 0.006, pH * 0.37, 0]}>
        <RoundedBox args={[0.012, pH * 0.04, 0.065]} radius={0.003} smoothness={3}>
          <meshStandardMaterial color={mat.body} metalness={mat.metalness} roughness={mat.roughness + 0.05} />
        </RoundedBox>
      </group>

      {/* Power button RIGHT */}
      <group position={[pW / 2 + 0.006, pH * 0.22, 0]}>
        <RoundedBox args={[0.012, pH * 0.12, 0.07]} radius={0.003} smoothness={3}>
          <meshStandardMaterial color={mat.body} metalness={mat.metalness} roughness={mat.roughness + 0.05} />
        </RoundedBox>
      </group>

      {/* Back camera module */}
      <group position={[pW * 0.22, pH * 0.36, -pD / 2 - 0.005]}>
        <RoundedBox args={[pW * 0.32, pW * 0.32, 0.012]} radius={0.025} smoothness={4}>
          <meshStandardMaterial color={mat.body} metalness={mat.metalness + 0.05} roughness={mat.roughness - 0.05} />
        </RoundedBox>
        {/* Camera lenses */}
        {[[-0.045, 0.045], [0.045, 0.045], [0, -0.04]].map(([cx, cy], i) => (
          <group key={i} position={[cx, cy, 0.008]}>
            <mesh>
              <circleGeometry args={[0.028, 32]} />
              <meshStandardMaterial color="#111" roughness={0.05} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.003]}>
              <circleGeometry args={[0.018, 32]} />
              <meshStandardMaterial color="#0a0a1a" roughness={0.02} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
