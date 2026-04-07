import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { DeviceModelDef } from '../../data/devices';

interface Props {
  def: DeviceModelDef;
  screenTexture: React.MutableRefObject<THREE.Texture | null>;
  contentType: 'image' | 'video' | null;
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

export function Watch3DModel({ def, screenTexture, contentType }: Props) {
  const isUltra = def.id.includes('ultra');
  const scale = 1.8 / (def.h / 100);
  const pW = (def.w / 100) * scale;
  const pH = (def.h / 100) * scale;
  const pD = 0.12;
  const br = 0.32;
  const bodyColor = isUltra ? '#2a2520' : '#1e1e22';
  const metalness = isUltra ? 0.9 : 0.75;
  const roughness = isUltra ? 0.1 : 0.15;
  const insetS = def.insetSide / 100 * scale;
  const sW = pW - insetS * 2;
  const sH = pH - insetS * 2;
  const sZ = pD / 2 + 0.002;
  const bandColor = isUltra ? '#f97316' : '#e11d48';
  const bandW = pW * 0.75;
  const bandH = pH * 0.42;

  return (
    <group>
      {/* Band top */}
      <group position={[0, pH / 2 + bandH / 2, -pD * 0.2]}>
        <RoundedBox args={[bandW, bandH, pD * 0.7]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color={bandColor} roughness={0.6} metalness={0.05} envMapIntensity={0.5} />
        </RoundedBox>
      </group>
      {/* Band bottom */}
      <group position={[0, -pH / 2 - bandH / 2, -pD * 0.2]}>
        <RoundedBox args={[bandW, bandH, pD * 0.7]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color={bandColor} roughness={0.6} metalness={0.05} envMapIntensity={0.5} />
        </RoundedBox>
      </group>

      {/* Case */}
      <RoundedBox args={[pW, pH, pD]} radius={br} smoothness={8} castShadow>
        <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness} envMapIntensity={1.5} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 0, sZ - 0.001]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#050510" roughness={0.06} metalness={0} />
      </mesh>
      <group position={[0, 0, sZ + 0.001]}>
        <ScreenPlane w={sW} h={sH} screenTexture={screenTexture} contentType={contentType} />
      </group>
      <mesh position={[0, 0, sZ + 0.003]}>
        <planeGeometry args={[sW, sH]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.04} roughness={0.02} metalness={0} />
      </mesh>

      {/* Crown */}
      <group position={[pW / 2 + 0.025, pH * 0.12, 0]}>
        <mesh>
          <cylinderGeometry args={[0.038, 0.038, 0.045, 32]} />
          <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness + 0.1} />
        </mesh>
      </group>
      {/* Side button */}
      <group position={[pW / 2 + 0.015, -pH * 0.12, 0]}>
        <RoundedBox args={[0.03, pH * 0.14, pD * 0.7]} radius={0.008} smoothness={3}>
          <meshStandardMaterial color={bodyColor} metalness={metalness} roughness={roughness + 0.1} />
        </RoundedBox>
      </group>
    </group>
  );
}
