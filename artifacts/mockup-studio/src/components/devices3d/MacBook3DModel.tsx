import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
  lidAngle?: number; // degrees, default 115
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

export function MacBook3DModel({ def, screenTexture, contentType, lidAngle = 112 }: Props) {
  const isPro = def.id.includes('pro');
  const bodyColor = isPro ? '#1c1c1e' : '#e0dbd2';
  const metalness = isPro ? 0.85 : 0.55;
  const roughness = isPro ? 0.12 : 0.25;
  const bodyMat = { color: bodyColor, metalness, roughness };

  // Normalized: lid width = 3.0 units
  const lidW = 3.0;
  const lidH = lidW * (def.h / def.w);
  const lidD = 0.07;
  const baseW = lidW + 0.15;
  const baseH = lidH * 0.22;
  const baseD = 0.05;

  const screenInsetH = (def.insetTop + def.insetBottom) / def.h * lidH;
  const screenInsetW = def.insetSide / def.w * lidW * 2;
  const sW = lidW - screenInsetW;
  const sH = lidH - screenInsetH;

  const lidRad = (lidAngle - 90) * (Math.PI / 180);

  return (
    <group position={[0, -0.2, 0]}>
      {/* Base */}
      <group position={[0, 0, 0]}>
        <RoundedBox args={[baseW, baseD, baseH]} radius={0.025} smoothness={4} castShadow>
          <meshStandardMaterial {...bodyMat} envMapIntensity={1.2} />
        </RoundedBox>
        {/* Trackpad */}
        <mesh position={[0, baseD / 2 + 0.0005, 0]}>
          <boxGeometry args={[baseW * 0.3, 0.001, baseH * 0.55]} />
          <meshStandardMaterial color={isPro ? '#222' : '#ccc8bf'} roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Keyboard hints */}
        <mesh position={[0, baseD / 2 + 0.0005, -baseH * 0.1]}>
          <planeGeometry args={[baseW * 0.72, baseH * 0.35]} />
          <meshStandardMaterial color={isPro ? '#181818' : '#d8d4cb'} roughness={0.5} metalness={0.1} />
        </mesh>
      </group>

      {/* Lid — pivot from bottom hinge */}
      <group position={[0, baseD / 2, -baseH / 2]} rotation={[-lidRad, 0, 0]}>
        <group position={[0, lidH / 2, 0]}>
          <RoundedBox args={[lidW, lidH, lidD]} radius={0.04} smoothness={5} castShadow>
            <meshStandardMaterial {...bodyMat} envMapIntensity={1.2} />
          </RoundedBox>

          {/* Screen black */}
          <mesh position={[0, -(def.insetTop - def.insetBottom) / def.h * lidH / 2, lidD / 2 + 0.001]}>
            <planeGeometry args={[sW, sH]} />
            <meshStandardMaterial color="#050510" roughness={0.06} metalness={0} />
          </mesh>

          {/* Screen content */}
          <group position={[0, -(def.insetTop - def.insetBottom) / def.h * lidH / 2, lidD / 2 + 0.002]}>
            <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
          </group>

          {/* Notch (MacBook Pro) */}
          {isPro && (
            <RoundedBox args={[sW * 0.22, 0.055, 0.008]} radius={0.02} smoothness={3}
              position={[0, sH / 2 - 0.028, lidD / 2 + 0.005]}>
              <meshStandardMaterial color={bodyColor} roughness={roughness} metalness={metalness} />
            </RoundedBox>
          )}

          {/* Webcam */}
          <mesh position={[0, sH / 2 + def.insetTop / def.h * lidH * 0.45, lidD / 2 + 0.003]}>
            <circleGeometry args={[0.018, 24]} />
            <meshStandardMaterial color="#111" roughness={0.1} />
          </mesh>

          {/* Screen gloss */}
          <mesh position={[0, -(def.insetTop - def.insetBottom) / def.h * lidH / 2, lidD / 2 + 0.004]}>
            <planeGeometry args={[sW, sH]} />
            <meshStandardMaterial color="#fff" transparent opacity={0.03} roughness={0.02} metalness={0} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
